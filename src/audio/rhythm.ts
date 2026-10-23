import { GUITAR_TUNING } from '../theory/theory';
import { audio, output, playNote } from './synth';

/**
 * A strum/picking pattern: space-separated slots.
 *  D / U  – down / up strum      d / u – soft (ghost) strum
 *  X      – muted "chk" (strings muted with the fretting hand, or a flamenco golpe)
 *  -      – rest (hand keeps moving, no contact)
 *  >      – prefix for an accent, e.g. ">D"
 */
export interface Rhythm {
  slots: string;
  /** Slots per beat: 2 = eighths, 3 = triplets / 6-8 feel, 4 = sixteenths. */
  sub: 2 | 3 | 4;
  beats: number;
  swing?: boolean;
}

export interface Slot { kind: 'D' | 'U' | 'X' | '-'; soft: boolean; accent: boolean }

export function parseSlots(s: string): Slot[] {
  return s.trim().split(/\s+/).map((tok) => {
    const accent = tok.startsWith('>');
    const c = tok.replace('>', '');
    const up = c.toUpperCase() as Slot['kind'];
    return { kind: up, soft: c === 'd' || c === 'u', accent };
  });
}

/** Counting syllables for each slot, e.g. 1 & 2 & or 1 e & a. */
export function countLabels(r: Rhythm): string[] {
  const per = r.sub === 4 ? ['', 'e', '&', 'a'] : r.sub === 3 ? ['', '&', 'a'] : ['', '&'];
  const out: string[] = [];
  for (let b = 1; b <= r.beats; b++) for (const p of per) out.push(p || String(b));
  return out;
}

const fretsToMidi = (frets: number[]) =>
  frets.map((f, s) => (f < 0 ? -1 : GUITAR_TUNING[s] + f)).filter((m) => m > 0);

let noiseBuf: AudioBuffer | null = null;
function chk(t: number, vel: number) {
  const c = audio();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.06), c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length / 5));
  }
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.value = 0.9 * vel;
  src.connect(bp).connect(g).connect(output());
  src.start(t);
}

function click(t: number, strong: boolean) {
  const c = audio();
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = strong ? 1600 : 1000;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(strong ? 0.35 : 0.2, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(output());
  o.start(t);
  o.stop(t + 0.06);
}

/** Plays one strum of a chord voicing at absolute time t. */
function strum(t: number, notes: number[], dir: 'D' | 'U', vel: number, ring: number) {
  const ordered = dir === 'D' ? notes : [...notes].reverse().slice(0, 4);
  ordered.forEach((m, i) => playNote(m, { at: t + i * (dir === 'D' ? 0.012 : 0.009), dur: ring, timbre: 'guitar', vel }));
}

export interface LoopOptions {
  bpm: number;
  rhythm?: Rhythm;
  /** Chord voicings (frets 6→1) cycled once per bar; empty = metronome only. */
  chords?: number[][];
  click?: boolean;
  onSlot?: (index: number) => void;
}

/** Look-ahead scheduler: plays a metronome and/or a strum pattern in a loop. */
export class Loop {
  private timer = 0;
  private next = 0;
  private i = 0;
  private bar = 0;
  private pending: number[] = [];
  private o: LoopOptions;
  constructor(o: LoopOptions) {
    this.o = o;
  }

  update(o: Partial<LoopOptions>) {
    this.o = { ...this.o, ...o };
  }

  start() {
    const c = audio();
    this.next = c.currentTime + 0.1;
    this.i = 0;
    this.bar = 0;
    this.timer = window.setInterval(() => this.tick(), 25);
  }

  stop() {
    clearInterval(this.timer);
    this.pending.forEach((t) => clearTimeout(t));
    this.pending = [];
  }

  private tick() {
    const c = audio();
    const r = this.o.rhythm ?? { slots: Array(4).fill('-').join(' '), sub: 2 as const, beats: 4 };
    const slots = parseSlots(r.slots);
    const beat = 60 / this.o.bpm;
    while (this.next < c.currentTime + 0.12) {
      const idx = this.i % slots.length;
      const posInBeat = idx % r.sub;
      // Swing: the off-beat eighth lands two-thirds of the way through the beat.
      let t = this.next;
      if (r.swing && r.sub === 2 && posInBeat === 1) t += beat / 6;
      if (this.o.click !== false && posInBeat === 0) click(t, idx === 0);
      const s = slots[idx];
      const chords = this.o.chords ?? [];
      if (chords.length && s) {
        const notes = fretsToMidi(chords[this.bar % chords.length]);
        const vel = s.accent ? 1 : s.soft ? 0.35 : 0.7;
        if (s.kind === 'D' || s.kind === 'U') strum(t, notes, s.kind, vel, beat / r.sub * 1.8);
        if (s.kind === 'X') chk(t, vel);
      }
      const cb = this.o.onSlot;
      if (cb) {
        const delay = Math.max(0, (t - c.currentTime) * 1000);
        this.pending.push(window.setTimeout(() => cb(idx), delay));
        if (this.pending.length > 64) this.pending.splice(0, 32);
      }
      this.next += beat / r.sub;
      this.i++;
      if (this.i % slots.length === 0) this.bar++;
    }
  }
}
