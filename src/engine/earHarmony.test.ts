import { describe, expect, it } from 'vitest';
import { GEN_BY_ID } from './generators';
import type { AudioCue, ChoiceEx } from './types';
import { LESSON_BY_ID } from '../data/curriculum';
import { THEORY_COURSE } from '../data/theoryCourse';

const chordsOf = (c: AudioCue): number[][] => (c.type === 'prog' ? c.chords : c.type === 'twoParts' ? [...chordsOf(c.first), ...chordsOf(c.second)] : c.type === 'chord' ? [c.notes] : []);

describe('harmonic ear training', () => {
  const ids = ['ear.homeTension', 'ear.chordRole', 'ear.chordRole4', 'ear.progFunc', 'ear.progFunc4', 'ear.progInG', 'ear.minorProg'];
  for (const id of ids) {
    it(`${id} makes well-formed guitar exercises`, () => {
      for (let k = 0; k < 300; k++) {
        const ex = GEN_BY_ID[id].make() as ChoiceEx;
        expect(ex.kind).toBe('choice');
        expect(ex.timbre).toBe('guitar');
        expect(ex.options.length).toBeGreaterThanOrEqual(2);
        expect(new Set(ex.options).size).toBe(ex.options.length);
        expect(ex.answer).toBeGreaterThanOrEqual(0);
        const chords = chordsOf(ex.audio!);
        expect(chords.length).toBeGreaterThan(0);
        for (const c of chords) { expect(c.length).toBeGreaterThanOrEqual(3); for (const m of c) expect(m).toBeGreaterThan(30); }
      }
    });
  }
  it('progressions start at home, never repeat a chord back to back, and offer near-miss choices (one or two chords off)', () => {
    for (const id of ['ear.progFunc', 'ear.progFunc4', 'ear.minorProg']) {
      for (let k = 0; k < 300; k++) {
        const ex = GEN_BY_ID[id].make() as ChoiceEx;
        const ans = ex.options[ex.answer].split(' – ');
        expect(ans[0]).toMatch(/^(I|i)$/);
        for (let i = 1; i < ans.length; i++) expect(ans[i]).not.toBe(ans[i - 1]);
        expect(ex.options.length).toBeGreaterThanOrEqual(3);
        for (const o of ex.options) {
          const diff = o.split(' – ').filter((x, i) => x !== ans[i]).length;
          expect(diff).toBeLessThanOrEqual(2);
        }
      }
    }
  });
  it('the ear lessons sit right after the lessons they build on', () => {
    const order = THEORY_COURSE.map((l) => l.id);
    expect(order.indexOf('t5g')).toBe(order.indexOf('t5c') + 1);
    expect(order.indexOf('t5h')).toBe(order.indexOf('t5c') + 2);
    expect(order.indexOf('t6d')).toBe(order.indexOf('t6c') + 1);
    for (const id of ['t5g', 't5h', 't6d']) expect(LESSON_BY_ID[id].listen).toBeTruthy();
  });
});
