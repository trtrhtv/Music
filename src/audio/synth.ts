import { midiToFreq } from '../theory/theory';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

export function audio(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.6;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** The shared output bus (for sounds built outside this module, e.g. metronome clicks). */
export function output(): AudioNode {
  audio();
  return master!;
}

export type Timbre = 'piano' | 'guitar';

const pluckCache = new Map<number, AudioBuffer>();

/** Karplus–Strong plucked string, rendered once per pitch. */
function pluckBuffer(c: AudioContext, midi: number): AudioBuffer {
  const cached = pluckCache.get(midi);
  if (cached) return cached;
  const sr = c.sampleRate;
  const len = Math.floor(sr * 2.5);
  const buf = c.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const period = Math.round(sr / midiToFreq(midi));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  const decay = 0.996;
  for (let i = 0; i < len; i++) {
    const j = i % period;
    const next = ring[(j + 1) % period];
    out[i] = ring[j];
    ring[j] = decay * 0.5 * (ring[j] + next);
  }
  pluckCache.set(midi, buf);
  return buf;
}

function playPiano(c: AudioContext, midi: number, t: number, dur: number, vel: number) {
  const f = midiToFreq(midi);
  const g = c.createGain();
  g.connect(master!);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.28 * vel, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.1 * vel, t + 0.4);
  g.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.6);
  const partials = [1, 2, 3, 4, 5];
  const amps = [1, 0.45, 0.22, 0.12, 0.06];
  partials.forEach((p, i) => {
    const o = c.createOscillator();
    const pg = c.createGain();
    o.type = 'sine';
    o.frequency.value = f * p * (1 + 0.0004 * p * p); // slight inharmonicity
    pg.gain.value = amps[i];
    o.connect(pg).connect(g);
    o.start(t);
    o.stop(t + dur + 0.7);
  });
}

function playGuitar(c: AudioContext, midi: number, t: number, dur: number, vel: number) {
  const src = c.createBufferSource();
  src.buffer = pluckBuffer(c, midi);
  const g = c.createGain();
  g.gain.setValueAtTime(0.5 * vel, t);
  g.gain.setTargetAtTime(0, t + dur, 0.08);
  src.connect(g).connect(master!);
  src.start(t);
  src.stop(t + dur + 0.5);
}

/** `at` is an absolute AudioContext time (for scheduled rhythms); `when` is relative to now. */
export function playNote(midi: number, opts: { when?: number; at?: number; dur?: number; timbre?: Timbre; vel?: number } = {}) {
  const c = audio();
  const t = opts.at ?? c.currentTime + 0.03 + (opts.when ?? 0);
  const dur = opts.dur ?? 1;
  (opts.timbre === 'guitar' ? playGuitar : playPiano)(c, midi, t, dur, opts.vel ?? 1);
}

/** Plays notes together, or strummed / arpeggiated by `spread` seconds. */
export function playChord(notes: number[], opts: { when?: number; dur?: number; timbre?: Timbre; spread?: number } = {}) {
  notes.forEach((n, i) =>
    playNote(n, { ...opts, when: (opts.when ?? 0) + i * (opts.spread ?? 0), vel: 0.8 }),
  );
}

export function playSequence(notes: number[], opts: { gap?: number; dur?: number; timbre?: Timbre } = {}) {
  const gap = opts.gap ?? 0.5;
  notes.forEach((n, i) => playNote(n, { when: i * gap, dur: opts.dur ?? gap * 0.95, timbre: opts.timbre }));
}

/** Chord progression: each item a list of midi notes. */
export function playProgression(chords: number[][], opts: { gap?: number; timbre?: Timbre } = {}) {
  const gap = opts.gap ?? 1.1;
  chords.forEach((ch, i) => playChord(ch, { when: i * gap, dur: gap * 0.9, timbre: opts.timbre }));
}
