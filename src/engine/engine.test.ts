import { describe, expect, it } from 'vitest';
import { GENERATORS, GEN_BY_ID } from './generators';
import { LESSONS } from '../data/curriculum';
import { estimateLevel, nextTier } from './placement';
import { spellAbove } from './util';
import { spellScale, diatonicChord } from '../theory/theory';
import { chromaMatchesChord, detectPitch } from '../audio/pitch';

describe('theory', () => {
  it('spells scales', () => {
    expect(spellScale('F', 'major').join(' ')).toBe('F G A Bb C D E');
    expect(spellScale('D', 'major').join(' ')).toBe('D E F# G A B C#');
    expect(spellScale('Eb', 'major').join(' ')).toBe('Eb F G Ab Bb C D');
    expect(spellScale('D', 'dorian').join(' ')).toBe('D E F G A B C');
    expect(spellScale('E', 'minor').join(' ')).toBe('E F# G A B C D');
  });
  it('spells intervals', () => {
    expect(spellAbove('C', 3)).toBe('Eb');
    expect(spellAbove('D', 4)).toBe('F#');
    expect(spellAbove('B', 6)).toBe('E#');
    expect(spellAbove('Bb', 7)).toBe('F');
    expect(spellAbove('A', 10)).toBe('G');
  });
  it('builds diatonic chords', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => diatonicChord('G', d)).join(' ')).toBe('G Am Bm C D Em F#dim');
    expect(diatonicChord('F', 2, true)).toBe('Gm7');
  });
});

describe('generators', () => {
  it('every generator makes valid exercises', () => {
    for (const g of GENERATORS) {
      for (let i = 0; i < 40; i++) {
        const e = g.make();
        expect(e.prompt.length, g.id).toBeGreaterThan(3);
        if (e.kind === 'choice') {
          expect(e.options.length, g.id).toBeGreaterThanOrEqual(2);
          expect(e.answer, g.id).toBeGreaterThanOrEqual(0);
          expect(new Set(e.options).size, g.id).toBe(e.options.length);
        }
        if (e.kind === 'keys') expect(e.pcs.every((p) => p >= 0 && p < 12), g.id).toBe(true);
        if (e.kind === 'fret') expect(e.pc !== undefined || e.midis?.length, g.id).toBeTruthy();
      }
    }
  });
  it('lessons reference real generators at every level', () => {
    for (const l of LESSONS) for (const [id] of l.drills) expect(GEN_BY_ID[id], `${l.id}:${id}`).toBeDefined();
    for (const d of ['theory', 'ear', 'guitar', 'piano'])
      for (let t = 1; t <= 5; t++) expect(GENERATORS.some((g) => g.domain === d && g.tier === t), `${d}${t}`).toBe(true);
  });
});

describe('placement', () => {
  it('staircase and estimate', () => {
    expect(nextTier(5, true)).toBe(5);
    expect(nextTier(1, false)).toBe(1);
    expect(estimateLevel([])).toBe(1);
    expect(estimateLevel([{ tier: 2, right: true }, { tier: 3, right: true }, { tier: 4, right: false }, { tier: 3, right: true }])).toBe(3);
    expect(estimateLevel([{ tier: 3, right: false }, { tier: 2, right: false }, { tier: 1, right: true }])).toBe(1);
  });
});

describe('dsp', () => {
  const sr = 44100;
  const tone = (f: number, harmonics = [1, 0.5, 0.3]) => {
    const b = new Float32Array(4096);
    for (let i = 0; i < b.length; i++) b[i] = harmonics.reduce((s, a, h) => s + 0.2 * a * Math.sin((2 * Math.PI * f * (h + 1) * i) / sr), 0);
    return b;
  };
  it('detects pitch of guitar-range tones', () => {
    for (const f of [82.41, 110, 196, 329.63, 440, 659.25]) {
      const got = detectPitch(tone(f), sr)!;
      expect(Math.abs(1200 * Math.log2(got / f))).toBeLessThan(15);
    }
  });
  it('rejects silence', () => {
    expect(detectPitch(new Float32Array(4096), sr)).toBeNull();
  });
  it('matches chord chroma', () => {
    const c = [1, 0, 0.1, 0, 0.8, 0, 0, 0.9, 0, 0.1, 0, 0.3];
    expect(chromaMatchesChord(c, [0, 4, 7]).ok).toBe(true);
    expect(chromaMatchesChord(c, [0, 3, 7]).ok).toBe(false);
  });
});
