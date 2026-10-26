import { expect, it } from 'vitest';
import { NoteTracker, matchNote, type Mark } from './noteTrack';
import { detectPitch } from './pitch';
const SR = 48000;
/** Regression: each note of a clean tone sequence is reported once, not twice. */
it('reports each note once (no double count on the rising edge)', () => {
  const notes = [45, 48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72];
  let seed = 5;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const parts: number[] = new Array(SR * 2).fill(0);
  for (const m of notes) {
    const f = 440 * 2 ** ((m - 69) / 12);
    for (let i = 0; i < SR * 0.6; i++) parts.push([1, 2, 3].reduce((s, k) => s + Math.sin(2 * Math.PI * f * k * i / SR) / k ** 1.5, 0) * 0.4 * Math.exp(-i / (SR * 0.5)));
    for (let i = 0; i < SR * 0.15; i++) parts.push(rnd() * 0.001);
  }
  const x = Float32Array.from(parts);
  let marks: Mark[] = notes.map(() => 'pending'); let pos = 0; const log: string[] = [];
  const t = new NoteTracker((m) => { const r = matchNote(notes, marks, pos, m); log.push(`${m}${r.wrong ? '!' : ''}`); marks = r.marks; pos = r.pos; });
  const hop = Math.round(SR / 60);
  for (let i = 4096; i < x.length; i += hop) {
    const time = x.subarray(i - 4096, i);
    let sum = 0; for (let j = 0; j < 4096; j++) sum += time[j] * time[j];
    t.frame({ freq: detectPitch(time, SR, 60, 1400, 0.003), level: Math.sqrt(sum / 4096) }, notes[pos]);
  }
  expect(log.join(' ')).toBe(notes.join(' '));
});
