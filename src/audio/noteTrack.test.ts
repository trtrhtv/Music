import { describe, expect, it } from 'vitest';
import { midiToFreq } from '../theory/theory';
import { NoteTracker, matchNote, type Mark } from './noteTrack';

const frames = (midi: number | null, n: number, level = 0.05) => Array.from({ length: n }, () => ({ freq: midi === null ? null : midiToFreq(midi), level }));

describe('note check', () => {
  it('hears a scale, legato or picked, and a repeated note only with a new attack', () => {
    const got: number[] = [];
    const t = new NoteTracker((m) => got.push(m));
    // A minor pentatonic start: picked notes with short gaps, then a legato change, then the same note twice.
    for (const f of [...frames(45, 8), ...frames(null, 2, 0.001), ...frames(48, 8), ...frames(50, 8), ...frames(50, 6), ...frames(null, 2, 0.001), ...frames(50, 6)]) t.frame(f);
    expect(got).toEqual([45, 48, 50, 50]);
  });
  it('follows the expected notes, counts wrong ones, marks skipped ones', () => {
    const exp = [45, 48, 50, 52];
    let marks: Mark[] = exp.map(() => 'pending');
    let pos = 0, wrong = 0;
    for (const n of [45, 47, 50, 52]) {
      const r = matchNote(exp, marks, pos, n);
      marks = r.marks; pos = r.pos; if (r.wrong) wrong++;
    }
    expect(marks).toEqual(['ok', 'miss', 'ok', 'ok']);
    expect(wrong).toBe(1);
    expect(pos).toBe(4);
  });
});
