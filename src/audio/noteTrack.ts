import { freqToMidiFloat } from '../theory/theory';
import type { MicFrame } from './mic';

/**
 * Turns a stream of mic frames into played notes. A note counts once its pitch has been steady
 * for a few frames; the same note again needs a fresh attack (or a gap) in between.
 */
export class NoteTracker {
  private candidate: number | null = null;
  private steady = 0;
  private last: number | null = null;
  private armed = true;
  private avg = 0;
  private onNote: (midi: number) => void;
  constructor(onNote: (midi: number) => void) { this.onNote = onNote; }

  frame(f: Pick<MicFrame, 'freq' | 'level'>) {
    if (f.level > 0.008 && f.level > this.avg * 1.8) this.armed = true;
    this.avg = this.avg * 0.85 + f.level * 0.15;
    if (!f.freq || f.level < 0.004) { this.candidate = null; this.steady = 0; this.armed = true; return; }
    const mf = freqToMidiFloat(f.freq);
    const m = Math.round(mf);
    if (Math.abs(mf - m) > 0.35) return;
    this.steady = m === this.candidate ? this.steady + 1 : 1;
    this.candidate = m;
    if (this.steady === 3 && (this.armed || m !== this.last)) {
      this.last = m;
      this.armed = false;
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
