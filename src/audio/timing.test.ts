import { describe, expect, it } from 'vitest';
import { detectOnsets, scoreTiming } from './timing';

const SR = 44100;
/** Synthetic "strums": noise bursts with a fast decay at the given times, over quiet room noise. */
function render(times: number[], dur: number, seed = 1) {
  const x = new Float32Array(Math.ceil(dur * SR));
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < x.length; i++) x[i] = rnd() * 0.002;
  for (const t of times) {
    const start = Math.round(t * SR);
    for (let i = 0; i < SR * 0.25 && start + i < x.length; i++) x[start + i] += rnd() * 0.5 * Math.exp(-i / (SR * 0.04));
  }
  return x;
}

describe('timing check', () => {
  it('finds every strum, close to where it happened', () => {
    const times = Array.from({ length: 16 }, (_, i) => 0.5 + i * 0.375);
    const on = detectOnsets(render(times, 7), SR);
    expect(on).toHaveLength(16);
    on.forEach((t, i) => expect(Math.abs(t - times[i])).toBeLessThan(0.012));
  });
  it('scores steady playing high and sloppy playing low', () => {
    const step = 60 / 80 / 2; // eighths at 80 BPM
    const steady = Array.from({ length: 32 }, (_, i) => 0.31 + i * step + (i % 3 - 1) * 0.005);
    const sloppy = steady.map((t, i) => t + [0, 0.07, -0.06, 0.09][i % 4]);
    expect(scoreTiming(steady, step).onTime).toBeGreaterThan(0.95);
    expect(scoreTiming(sloppy, step).onTime).toBeLessThan(0.6);
  });
  it('notices dragging', () => {
    const step = 0.25;
    const drag = Array.from({ length: 32 }, (_, i) => i * step * 1.03);
    expect(scoreTiming(drag, step).driftMs).toBeGreaterThan(20);
  });
});
