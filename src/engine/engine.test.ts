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

describe('review fixes', () => {
  it('spells altered chord tones on the right letters', async () => {
    const { spellChord } = await import('./util');
    expect(spellChord('B', [0, 3, 6, 10]).join(' ')).toBe('B D F A');
    expect(spellChord('E', [0, 3, 6]).join(' ')).toBe('E G Bb');
    expect(spellChord('A', [0, 4, 8]).join(' ')).toBe('A C# E#');
    expect(spellChord('Eb', [0, 4, 7, 10]).join(' ')).toBe('Eb G Bb Db');
    expect(spellChord('F#', [0, 3, 7]).join(' ')).toBe('F# A C#');
  });
  it('orders numeric options but still shuffles chord names', async () => {
    const { choice } = await import('./util');
    expect(choice('q', 'סריג 5', ['סריג 7', 'סריג 3', 'סריג 4']).options).toEqual(['סריג 3', 'סריג 4', 'סריג 5', 'סריג 7']);
    const firsts = new Set(Array.from({ length: 40 }, () => choice('q', 'Dm7 – G7 – Cmaj7', ['Am7 – D7 – Gmaj7', 'Em7 – A7 – Dmaj7', 'Gm7 – C7 – Fmaj7']).answer));
    expect(firsts.size).toBeGreaterThan(1);
  });
  it('no exercise has fret-12 barre answers or a correct option that is always first', () => {
    for (const id of ['gt.barre', 'gt.pentaPosition', 'gt.cagedA'])
      for (let i = 0; i < 200; i++) {
        const e = GEN_BY_ID[id].make();
        if (e.kind === 'choice') expect(e.options[e.answer], id).not.toBe('סריג 12');
      }
  });
  it('placement staircase reaches the extremes', () => {
    const run = (start: number, right: boolean, n = 7) => {
      let t = start; const a = [];
      for (let i = 0; i < n; i++) { a.push({ tier: t, right }); t = nextTier(t, right); }
      return estimateLevel(a);
    };
    expect(run(1, true)).toBe(5);
    expect(run(3, false)).toBe(1);
    expect(run(5, false)).toBe(1);
  });
  it('mic-only lessons are optional and do not block levelling up', async () => {
    const { recordLesson, getState, finishPlacement } = await import('../state/store');
    finishPlacement({} as never, { theory: 1, ear: 1, guitar: 1, piano: 1 });
    for (const l of LESSONS.filter((x) => x.domain === 'piano' && x.level === 1 && !x.optional)) recordLesson(l.id, 'piano', 1);
    expect(getState().levels.piano).toBe(2);
    recordLesson('t1a', 'theory', 0.5);
    expect(getState().lessons.t1a.passed).toBe(false);
    expect(getState().levels.theory).toBe(1);
  });
});

describe('spaced review of theory lessons', () => {
  it('schedules a passed lesson for tomorrow, moves up on right answers and back on wrong ones', async () => {
    const { recordLesson, answerReview, getState, addDays, today, dueReviews, REVIEW_DAYS } = await import('../state/store');
    recordLesson('t2a', 'theory', 0.9);
    expect(getState().review.t2a).toEqual({ box: 0, due: addDays(today(), 1) });
    expect(dueReviews(getState(), ['t2a'])).toEqual([]);
    answerReview('t2a', true);
    expect(getState().review.t2a).toEqual({ box: 1, due: addDays(today(), REVIEW_DAYS[1]) });
    answerReview('t2a', false);
    expect(getState().review.t2a.box).toBe(0);
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });
});
