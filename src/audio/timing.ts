/**
 * Timing analysis for the mic test: find note onsets in recorded audio, then measure how far
 * each one lands from an even grid. The grid's phase is fitted from the playing itself, so the
 * unknown mic/speaker latency doesn't matter – only steadiness does.
 */

/** Onset times (seconds) in a mono signal: sharp rises of high-frequency energy. */
export function detectOnsets(x: Float32Array, sr: number, minGap = 0.07): number[] {
  const hop = Math.round(sr * 0.005);
  const n = Math.floor(x.length / hop);
  const e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = i * hop + 1; j < (i + 1) * hop; j++) { const d = x[j] - x[j - 1]; s += d * d; }
    e[i] = s / hop;
  }
  const sorted = Array.from(e).sort((a, b) => a - b);
  const floor = sorted[Math.floor(n * 0.2)] ?? 0;
  const peak = sorted[Math.floor(n * 0.99)] ?? 0;
  // Ignore anything below a fraction of the loud notes, so string ring and room noise don't count.
  const gate = Math.max(floor * 6, peak * 0.04, 1e-7);
  const out: number[] = [];
  let last = -Infinity;
  for (let i = 4; i < n; i++) {
    const before = (e[i - 4] + e[i - 3] + e[i - 2]) / 3;
    if (e[i] > gate && e[i] > before * 4 && e[i] >= e[i - 1]) {
      const t = (i * hop) / sr;
      if (t - last >= minGap) { out.push(t); last = t; }
    }
  }
  return out;
}

export interface TimingResult {
  /** Notes found. */
  count: number;
  /** Share of notes within the tolerance of the grid (0–1). */
  onTime: number;
  /** Average distance from the grid, ms. */
  meanMs: number;
  /** Positive = second half later than the first (dragging), negative = rushing; ms. */
  driftMs: number;
  /** Tolerance used, ms. */
  tolMs: number;
}

/** Scores onsets against a grid of `step` seconds whose phase is fitted from the onsets. */
export function scoreTiming(onsets: number[], step: number): TimingResult {
  const tol = Math.min(0.04, step * 0.2);
  if (onsets.length < 4) return { count: onsets.length, onTime: 0, meanMs: 0, driftMs: 0, tolMs: tol * 1000 };
  // Circular mean of the phases within one grid step.
  let sx = 0, sy = 0;
  for (const t of onsets) { const a = (2 * Math.PI * t) / step; sx += Math.cos(a); sy += Math.sin(a); }
  const phase = ((Math.atan2(sy, sx) / (2 * Math.PI)) * step + step) % step;
  const res = onsets.map((t) => { const k = Math.round((t - phase) / step); return t - phase - k * step; });
  const half = Math.floor(res.length / 2);
  const avg = (a: number[]) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
  return {
    count: onsets.length,
    onTime: res.filter((r) => Math.abs(r) <= tol).length / res.length,
    meanMs: avg(res.map(Math.abs)) * 1000,
    driftMs: (avg(res.slice(half)) - avg(res.slice(0, half))) * 1000,
    tolMs: tol * 1000,
  };
}
