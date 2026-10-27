// Pure DSP helpers for microphone analysis (kept free of browser APIs so they can be unit tested).

/**
 * Monophonic pitch detection using the YIN difference function.
 * Returns frequency in Hz, or null when the frame has no clear pitch.
 */
export function detectPitch(buf: Float32Array, sampleRate: number, minHz = 60, maxHz = 1400, minRms = 0.001): number | null {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < minRms) return null;

  const maxTau = Math.min(Math.floor(sampleRate / minHz), Math.floor(buf.length / 2));
  const minTau = Math.max(2, Math.floor(sampleRate / maxHz));
  const W = buf.length - maxTau;
  const d = new Float32Array(maxTau + 1);
  for (let tau = 1; tau <= maxTau; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxTau + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxTau; tau++) {
    running += d[tau];
    cmnd[tau] = running === 0 ? 1 : (d[tau] * tau) / running;
  }
  const threshold = 0.15;
  let tau = -1;
  for (let t = minTau; t <= maxTau; t++) {
    if (cmnd[t] < threshold) {
      while (t + 1 <= maxTau && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;
  // Parabolic interpolation for sub-sample accuracy.
  let better = tau;
  if (tau > 1 && tau < maxTau) {
    const a = cmnd[tau - 1], b = cmnd[tau], c = cmnd[tau + 1];
    const denom = a + c - 2 * b;
    if (denom !== 0) better = tau + (a - c) / (2 * denom);
  }
  return sampleRate / better;
}

/**
 * 12-bin chroma (pitch-class energy) from an AnalyserNode-style dB spectrum.
 * `binHz` = sampleRate / fftSize.
 */
export function chromaFromSpectrum(db: Float32Array, binHz: number, loHz = 70, hiHz = 2000): number[] {
  const chroma = new Array(12).fill(0);
  const lo = Math.max(1, Math.floor(loHz / binHz));
  const hi = Math.min(db.length - 1, Math.ceil(hiHz / binHz));
  for (let i = lo; i <= hi; i++) {
    // Keep only local peaks to reduce smearing.
    if (db[i] < db[i - 1] || db[i] < db[i + 1]) continue;
    const mag = Math.pow(10, db[i] / 20);
    const f = i * binHz;
    const midi = 69 + 12 * Math.log2(f / 440);
    const p = ((Math.round(midi) % 12) + 12) % 12;
    // Down-weight high bins (mostly overtones).
    chroma[p] += mag / Math.sqrt(f / 100);
  }
  const max = Math.max(...chroma);
  return max > 0 ? chroma.map((v) => v / max) : chroma;
}

// Pitch-class offsets and relative strength of the first harmonics of a plucked/struck string
// (h = 1..6 → 0, +12, +19, +24, +28, +31 semitones).
const HARMONICS: [number, number][] = [[0, 1], [0, 0.5], [7, 0.4], [0, 0.25], [4, 0.2], [7, 0.15]];

/** Expected chroma of a chord, including the overtones each chord tone adds. */
export function chordTemplate(pcs: number[]): number[] {
  const t = new Array(12).fill(0);
  for (const p of pcs) for (const [off, w] of HARMONICS) t[(p + off) % 12] += w;
  return t;
}

const cosine = (a: number[], b: number[]) => {
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < 12; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa && bb ? ab / Math.sqrt(aa * bb) : 0;
};

const CANDIDATE_SHAPES = [[0, 4, 7], [0, 3, 7], [0, 3, 6], [0, 4, 8], [0, 2, 7], [0, 5, 7], [0, 4, 7, 11], [0, 4, 7, 10], [0, 3, 7, 10], [0, 3, 6, 10]];
const CANDIDATES: number[][] = [];
for (let r = 0; r < 12; r++) for (const sh of CANDIDATE_SHAPES) CANDIDATES.push(sh.map((x) => (x + r) % 12));
const key = (pcs: number[]) => [...new Set(pcs.map((p) => ((p % 12) + 12) % 12))].sort((a, b) => a - b).join(',');

/**
 * Does the averaged chroma match the chord? The chord's harmonic template must fit the
 * spectrum well, at least as well as any other common chord that isn't a superset of it,
 * and every chord tone must be audible.
 */
export function chromaMatchesChord(chroma: number[], chordPcs: number[]): { ok: boolean; score: number; best: number[] } {
  const target = [...new Set(chordPcs.map((p) => ((p % 12) + 12) % 12))];
  const score = cosine(chroma, chordTemplate(target));
  let best = target, bestScore = score;
  for (const c of CANDIDATES) {
    if (key(c) === key(target)) continue;
    const s = cosine(chroma, chordTemplate(c));
    // A 7th chord built on the target triad (e.g. Cmaj7 vs C) isn't a competing answer.
    if (target.every((p) => c.includes(p))) continue;
    if (s > bestScore) { bestScore = s; best = c; }
  }
  const audible = target.every((p) => chroma[p] > 0.15);
  return { ok: audible && score > 0.8 && score >= bestScore - 0.01, score, best };
}

/**
 * Harmonic score of a note in a magnitude spectrum: the sum of the strongest bin near each of
 * its first harmonics. Used on the spectrum *increase* after an attack, so notes that are still
 * ringing from before don't count – only what was just played.
 */
export function noteScore(mag: Float32Array, binHz: number, midi: number, harmonics = 6): number {
  const f0 = 440 * Math.pow(2, (midi - 69) / 12);
  let s = 0;
  for (let h = 1; h <= harmonics; h++) {
    const c = (f0 * h) / binHz;
    const lo = Math.max(1, Math.floor(c * 0.985)), hi = Math.min(mag.length - 1, Math.ceil(c * 1.015));
    let best = 0;
    for (let i = lo; i <= hi; i++) best = Math.max(best, mag[i]);
    s += best;
  }
  return s;
}

/** The note (midi 40–88) that best explains a spectrum increase, and how clearly. */
export function attackNote(rise: Float32Array, binHz: number): { midi: number; score: number; ratio: number } {
  let best = 0, second = 0, midi = 0;
  for (let m = 40; m <= 88; m++) {
    const s = noteScore(rise, binHz, m);
    if (s > best) { second = best; best = s; midi = m; } else if (s > second) second = s;
  }
  return { midi, score: best, ratio: second ? best / second : Infinity };
}

/**
 * How much of a spectrum increase is explained by one note's harmonic series (0–1):
 * the energy share of the strongest new peaks that sit on its harmonics. A bright attack with
 * strong overtones still scores high for the right note; a wrong note's peaks fall off the series.
 */
/** Share of the new energy that must sit on a note's harmonics to count as that note. */
export const EXPLAINED = 0.85;

export function explainedBy(rise: Float32Array, binHz: number, midi: number, loHz = 70, hiHz = 4000): number {
  const f0 = 440 * Math.pow(2, (midi - 69) / 12);
  const peaks: [number, number][] = [];
  for (let i = Math.max(2, Math.floor(loHz / binHz)); i < Math.min(rise.length - 2, hiHz / binHz); i++) {
    if (rise[i] > 0 && rise[i] >= rise[i - 1] && rise[i] > rise[i + 1]) peaks.push([i * binHz, rise[i]]);
  }
  peaks.sort((a, b) => b[1] - a[1]);
  const top = peaks.slice(0, 8);
  const total = top.reduce((s, [, m]) => s + m * m, 0);
  if (!total) return 0;
  const on = top.filter(([f]) => {
    const h = Math.round(f / f0);
    return h >= 1 && Math.abs(f - h * f0) <= Math.max(binHz * 1.5, h * f0 * 0.015);
  }).reduce((s, [, m]) => s + m * m, 0);
  return on / total;
}
