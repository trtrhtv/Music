import { describe, expect, it } from 'vitest';
import { KEYS, checkKeys, checkNames, makeDrillQ, midiOf, withOctave, type DrillOptions } from './noteDrill';
import { pc } from '../theory/theory';
import { pcAny } from './util';

const opts = (o: Partial<DrillOptions> = {}): DrillOptions => ({ kind: 'mix', clef: 'both', accidentals: true, moreChords: true, chordShow: 'mix', ...o });

describe('piano note reading drill', () => {
  it('spells octaves right around the B–C boundary', () => {
    expect(withOctave('B#', 60)).toBe('B#3');
    expect(withOctave('Cb', 59)).toBe('Cb4');
    expect(midiOf('F#4')).toBe(66);
    expect(midiOf('Bb2')).toBe(46);
  });
  it('every question is consistent: staff spelling, names, keys – and on the keyboard shown', () => {
    for (let k = 0; k < 3000; k++) {
      const q = makeDrillQ(opts());
      expect(q.staff.map(midiOf)).toEqual(q.midis);
      q.names.forEach((n, i) => expect(pcAny(n)).toBe(pc(q.midis[i])));
      const [lo, hi] = KEYS[q.clef];
      for (const m of q.midis) { expect(m).toBeGreaterThanOrEqual(lo); expect(m).toBeLessThanOrEqual(hi); }
      for (const s of q.staff) expect(s).toMatch(/^[A-G](#|b)?\d$/);
      if (q.kind === 'chord') expect(q.symbol).toBeTruthy();
    }
  });
  it('without accidentals: only white keys, and only major and minor chords unless asked', () => {
    for (let k = 0; k < 500; k++) {
      const q = makeDrillQ(opts({ accidentals: false, moreChords: false, kind: 'note' }));
      expect(q.names[0]).toMatch(/^[A-G]$/);
      const c = makeDrillQ(opts({ accidentals: false, moreChords: false, kind: 'chord' }));
      expect(c.symbol).toMatch(/^[A-G]m?$/);
    }
  });
  it('checks names (any order; another name for the same key is "almost") and keys', () => {
    const q = { kind: 'chord' as const, show: 'name' as const, clef: 'treble' as const, staff: ['D4', 'F#4', 'A4'], names: ['D', 'F#', 'A'], midis: [62, 66, 69], symbol: 'D' };
    expect(checkNames(q, ['A', 'D', 'F#']).ok).toBe(true);
    expect(checkNames(q, ['D', 'Gb', 'A'])).toEqual({ ok: false, enharmonic: true });
    expect(checkNames(q, ['D', 'F', 'A']).ok).toBe(false);
    expect(checkKeys(q, [50, 54, 57])).toBe(true); // a lower octave is fine for a chord
    expect(checkKeys(q, [62, 65, 69])).toBe(false);
    const n = { kind: 'note' as const, show: 'staff' as const, clef: 'treble' as const, staff: ['E4'], names: ['E'], midis: [64] };
    expect(checkKeys(n, [64])).toBe(true);
    expect(checkKeys(n, [76])).toBe(false); // a single note: the exact key
  });
});
