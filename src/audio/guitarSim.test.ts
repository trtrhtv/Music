import { describe, expect, it } from 'vitest';
import { GUITAR_TUNING, midiToFreq } from '../theory/theory';
import { NoteTracker, matchNote, type Mark } from './noteTrack';
import { EXPLAINED, detectPitch, explainedBy } from './pitch';
import { detectOnsets, scoreTiming } from './timing';

/**
 * A more realistic guitar than plain bursts: Karplus–Strong plucked strings that keep ringing,
 * strums spread over six strings, and room noise – to check the mic tests before real use.
 */
const SR = 44100;
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;

function pluck(out: Float32Array, midi: number, start: number, amp: number, decay = 0.996, dur = 1.2) {
  const n = Math.round(SR / midiToFreq(midi));
  const buf = Float32Array.from({ length: n }, () => rnd() * amp);
  const s0 = Math.round(start * SR);
  for (let i = 0; i < dur * SR && s0 + i < out.length; i++) {
    const k = i % n;
    const v = buf[k];
    buf[k] = decay * 0.5 * (v + buf[(k + 1) % n]);
    out[s0 + i] += v;
  }
}
const room = (len: number, level: number) => Float32Array.from({ length: Math.ceil(len * SR) }, () => rnd() * level);

/** Runs a signal through the same frame-by-frame path as the live mic. */
function track(x: Float32Array, minRms?: number, win = 4096) {
  const got: number[] = [];
  const t = new NoteTracker((m) => got.push(m));
  const hop = Math.round(SR / 60);
  for (let i = 0; i + win < x.length; i += hop) {
    const f = x.subarray(i, i + win);
    let s = 0;
    for (let j = 0; j < win; j++) s += f[j] * f[j];
    t.frame({ freq: detectPitch(f, SR, 60, 1400, minRms), level: Math.sqrt(s / win) });
  }
  return got;
}

/** Magnitude spectrum (Hann window), like the analyser node gives. */
function spectrum(frame: Float32Array): Float32Array {
  const n = frame.length;
  const re = Float64Array.from(frame, (v, i) => v * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
  const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const wr = Math.cos(a * k), wi = Math.sin(a * k);
      const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
      re[i + k + len / 2] = re[i + k] - xr; im[i + k + len / 2] = im[i + k] - xi;
      re[i + k] += xr; im[i + k] += xi;
    }
  }
  return Float32Array.from({ length: n / 2 }, (_, i) => Math.hypot(re[i], im[i]));
}

const PENTA = [45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72];

describe('mic checks on a simulated guitar', () => {
  for (const [label, amp, gap] of [['loud, picked', 0.4, 0.45], ['quiet (phone a metre away)', 0.06, 0.45], ['fast', 0.3, 0.25]] as const) {
    it(`note check follows a pentatonic scale – ${label}`, () => {
      const x = room(PENTA.length * gap + 2, 0.002);
      // Fretted notes stop when the finger lifts for the next note (a little overlap).
      PENTA.forEach((m, i) => pluck(x, m, 0.3 + i * gap, amp, 0.996, gap + 0.06));
      const heard = track(x, 0.003);
      let marks: Mark[] = PENTA.map(() => 'pending');
      let pos = 0, wrong = 0;
      for (const m of heard) { const r = matchNote(PENTA, marks, pos, m); marks = r.marks; pos = r.pos; if (r.wrong) wrong++; }
      expect(marks.filter((m) => m === 'ok').length, `heard ${heard.join(' ')}`).toBe(PENTA.length);
      expect(wrong, `heard ${heard.join(' ')}`).toBeLessThanOrEqual(1);
    });
  }

  for (const win of [4096, 2048]) {
    it(`note check when notes ring over each other (window ${win})`, () => {
      const x = room(PENTA.length * 0.45 + 2, 0.002);
      PENTA.forEach((m, i) => pluck(x, m, 0.3 + i * 0.45, 0.3, 0.996, 1.2));
      const heard = track(x, 0.003, win);
      let marks: Mark[] = PENTA.map(() => 'pending');
      let pos = 0, wrong = 0;
      for (const m of heard) { const r = matchNote(PENTA, marks, pos, m); marks = r.marks; pos = r.pos; if (r.wrong) wrong++; }
      console.log(win, 'ok', marks.filter((m) => m === 'ok').length, 'wrong', wrong, heard.join(' '));
    });
  }

  it('the attack spectrum confirms the new note even while earlier notes ring, and rejects wrong ones', () => {
    const x = room(PENTA.length * 0.45 + 2, 0.002);
    const starts = PENTA.map((m, i) => { const t = 0.3 + i * 0.45; pluck(x, m, t, 0.3, 0.996, 1.2); return t; });
    const N = 8192, binHz = SR / N;
    let right = 0, falseOk = 0;
    starts.forEach((t, i) => {
      const at = (sec: number) => spectrum(x.subarray(Math.round(sec * SR), Math.round(sec * SR) + N));
      const before = at(t - N / SR - 0.01), after = at(t + 0.06 - N / SR / 2);
      const rise = after.map((v, k) => Math.max(0, v - before[k]));
      if (explainedBy(rise, binHz, PENTA[i]) >= EXPLAINED) right++;
      // An octave off is accepted on purpose (see matchNote).
      for (const d of [-7, -5, -2, -1, 1, 2, 5, 7]) if (explainedBy(rise, binHz, PENTA[i] + d) >= EXPLAINED) falseOk++;
    });
    expect(right).toBeGreaterThanOrEqual(11);
    expect(falseOk).toBeLessThanOrEqual(2);
  });

  /** Plays `played` and follows it against `expected` through the live (spectrum + pitch) path. */
  function live(played: number[], expected: number[], { gap = 0.45, amp = 0.3, ring = 1.2 } = {}) {
    const x = room(played.length * gap + 2, 0.002);
    played.forEach((m, i) => pluck(x, m, 0.3 + i * gap, amp, 0.996, ring));
    let marks: Mark[] = expected.map(() => 'pending');
    let pos = 0, wrong = 0;
    const t = new NoteTracker((m) => { const r = matchNote(expected, marks, pos, m); marks = r.marks; pos = r.pos; if (r.wrong) wrong++; });
    const N = 8192, hop = Math.round(SR / 60), binHz = SR / N;
    for (let i = N; i < x.length; i += hop) {
      const win = x.subarray(i - N, i);
      const time = win.subarray(N - 4096);
      let sum = 0;
      for (let j = 0; j < time.length; j++) sum += time[j] * time[j];
      const spec = Float32Array.from(spectrum(win), (m) => 20 * Math.log10(m / (N / 4) + 1e-12));
      t.frame({ freq: detectPitch(time, SR, 60, 1400, 0.003), level: Math.sqrt(sum / time.length), spec, binHz }, expected[pos]);
    }
    return { ok: marks.filter((m) => m === 'ok').length, wrong, marks };
  }

  for (const [label, opts] of [['notes ringing into each other', {}], ['fretted (finger lifts)', { ring: 0.5 }], ['quiet', { amp: 0.06, ring: 0.5 }], ['fast', { gap: 0.25, ring: 0.3 }]] as const) {
    it(`live path follows the scale – ${label}`, () => {
      const r = live(PENTA, PENTA, opts);
      expect(r.ok).toBeGreaterThanOrEqual(11);
      expect(r.wrong).toBeLessThanOrEqual(2);
    });
  }

  it('live path catches a wrong note', () => {
    const played = [...PENTA];
    played[4] = 56; // G# instead of G
    const r = live(played, PENTA, { ring: 0.5 });
    expect(r.marks[4]).not.toBe('ok');
    expect(r.wrong).toBeGreaterThanOrEqual(1);
  });

  it('timing check on strummed chords that keep ringing (eighths, 90 BPM)', () => {
    const step = 60 / 90 / 2;
    const am = [-1, 0, 2, 2, 1, 0].map((f, s) => (f < 0 ? -1 : GUITAR_TUNING[s] + f)).filter((m) => m > 0);
    const times: number[] = [];
    const x = room(14, 0.003);
    for (let i = 0; i < 32; i++) {
      const t = 0.5 + i * step + rnd() * 0.006;
      times.push(t);
      const down = i % 2 === 0;
      const strings = down ? am : [...am].reverse().slice(0, 3); // up-strums hit the top strings only
      strings.forEach((m, k) => pluck(x, m, t + k * 0.008, down ? 0.12 : 0.06, 0.997, 2));
    }
    const on = detectOnsets(x, SR);
    const r = scoreTiming(on, step);
    expect(on.length, `onsets ${on.length}`).toBeGreaterThanOrEqual(28);
    expect(on.length).toBeLessThanOrEqual(34);
    expect(r.onTime).toBeGreaterThan(0.85);
  });

  it('timing check flags a player who rushes', () => {
    const x = room(12, 0.003);
    for (let i = 0; i < 32; i++) pluck(x, 57, 0.5 + i * 0.32 * (1 - i * 0.004), 0.2);
    const r = scoreTiming(detectOnsets(x, SR), 60 / 90 / 2);
    expect(r.onTime).toBeLessThan(0.85);
  });
});
