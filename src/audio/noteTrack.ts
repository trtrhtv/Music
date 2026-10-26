import { freqToMidiFloat } from '../theory/theory';
import { EXPLAINED, explainedBy } from './pitch';
import type { MicFrame } from './mic';

/**
 * Turns a stream of mic frames into played notes. A note counts once its pitch has been steady
 * for a few frames; the same note again needs a fresh attack (or a gap) in between.
 */
/** Frames after an attack before its spectrum is compared (about 120 ms at 60 frames/s). */
const ATTACK_FRAMES = 7;
/** Frames after a note during which another attack can't re-trigger the same note (~100 ms). */
const REFRACTORY = 6;
/** Share of new spectral energy in one frame that marks a new note (ringing notes stay near 0.01–0.05). */
const FLUX_ATTACK = 0.15;
/** When the next note is known, a different pitch must hold this many frames to count (filters ringing mixtures). */
const OTHER_FRAMES = 8;

export class NoteTracker {
  private candidate: number | null = null;
  private steady = 0;
  private last: number | null = null;
  private armed = true;
  private avg = 0;
  private onNote: (midi: number) => void;
  /** Spectrum (linear) from just before the last attack, and frames counted since it. */
  private before: Float32Array | null = null;
  private prev: Float32Array | null = null;
  private sinceAttack = -1;
  private flux = 0;
  /** Frames since the last note was reported – the rising edge of a note can look like several attacks. */
  private sinceNote = 99;
  constructor(onNote: (midi: number) => void) { this.onNote = onNote; }

  /**
   * `expected` (optional): the note that should come next. When notes ring into each other the
   * pitch tracker can't tell them apart, so after an attack we also check whether what just got
   * louder is that note's harmonic series.
   */
  frame(f: Pick<MicFrame, 'freq' | 'level' | 'spec' | 'binHz'>, expected?: number) {
    const lin = f.spec ? Float32Array.from(f.spec, (db) => Math.pow(10, db / 20)) : null;
    // An attack: the level jumps, or (with notes still ringing) a burst of new energy in the spectrum.
    let flux = 0;
    if (lin && this.prev) {
      let up = 0, all = 0;
      for (let i = 3; i < lin.length / 4; i++) { up += Math.max(0, lin[i] - this.prev[i]); all += lin[i]; }
      flux = up / (all + 1e-9);
    }
    const attack = (f.level > 0.008 && f.level > this.avg * 1.8) || (flux > FLUX_ATTACK && this.flux <= FLUX_ATTACK);
    this.flux = flux;
    this.sinceNote++;
    if (attack && this.sinceNote > REFRACTORY) {
      this.armed = true;
      if (this.sinceAttack < 0 || this.sinceAttack > 3) { this.before = this.prev; this.sinceAttack = 0; }
    }
    if (this.sinceAttack >= 0 && ++this.sinceAttack === ATTACK_FRAMES && lin && this.before && f.binHz && expected !== undefined) {
      const before = this.before;
      const rise = lin.map((v, i) => Math.max(0, v - before[i]));
      if (this.armed && explainedBy(rise, f.binHz, expected) >= EXPLAINED) {
        this.last = expected;
        this.armed = false;
        this.candidate = expected;
        this.steady = 3;
        this.sinceNote = 0;
        this.onNote(expected);
      }
      this.sinceAttack = -1;
    }
    this.prev = lin;
    this.avg = this.avg * 0.85 + f.level * 0.15;
    if (!f.freq || f.level < 0.004) { this.candidate = null; this.steady = 0; if (this.sinceNote > REFRACTORY) this.armed = true; return; }
    const mf = freqToMidiFloat(f.freq);
    const m = Math.round(mf);
    if (Math.abs(mf - m) > 0.35) return;
    this.steady = m === this.candidate ? this.steady + 1 : 1;
    this.candidate = m;
    const need = expected === undefined || m === expected || Math.abs(m - expected) === 12 ? 3 : OTHER_FRAMES;
    if (this.steady === need && (this.armed || m !== this.last)) {
      this.last = m;
      this.armed = false;
      this.sinceNote = 0;
      this.onNote(m);
    }
  }
}

export type Mark = 'ok' | 'miss' | 'pending';

/**
 * Follows the expected notes as they are played. A wrong note is counted but doesn't move on;
 * if the played note is the one after next, the skipped note is marked missed.
 * An octave off still counts (pitch detection on low strings sometimes jumps an octave).
 */
export function matchNote(expected: number[], marks: Mark[], pos: number, played: number): { pos: number; marks: Mark[]; wrong: boolean } {
  const same = (a: number, b: number) => a === b || Math.abs(a - b) === 12;
  if (pos >= expected.length) return { pos, marks, wrong: false };
  const next = [...marks];
  if (same(played, expected[pos])) { next[pos] = 'ok'; return { pos: pos + 1, marks: next, wrong: false }; }
  if (pos + 1 < expected.length && same(played, expected[pos + 1])) {
    next[pos] = 'miss';
    next[pos + 1] = 'ok';
    return { pos: pos + 2, marks: next, wrong: false };
  }
  return { pos, marks, wrong: true };
}
