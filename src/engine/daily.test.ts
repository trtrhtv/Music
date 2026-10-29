import { describe, expect, it } from 'vitest';
import { BARRE, DAILY, itemFor } from '../data/daily';
import { GUITAR_TUNING } from '../theory/theory';
import { parseTab } from '../audio/tabPlayer';
import { checkBlocks } from './checkBlocks';
import { dailyBase, getState, type State } from '../state/store';

describe('daily practice list', () => {
  it('has the base categories, about two hours, every item explained and well-formed', () => {
    expect(DAILY.map((c) => c.id)).toEqual(['warm', 'scales', 'chords', 'hand', 'neck', 'rhythm', 'flamenco', 'romanza', 'song']);
    const total = DAILY.reduce((n, c) => n + c.min, 0);
    expect(total).toBeGreaterThanOrEqual(110);
    expect(total).toBeLessThanOrEqual(125);
    for (const c of DAILY) {
      expect(c.levels.length, c.id).toBeGreaterThan(1);
      for (const lv of c.levels) for (const it of lv.items) {
        const where = `${c.id}/${it.id}`;
        expect(it.title.length, where).toBeGreaterThan(10);
        expect(it.how.length, where).toBeGreaterThan(0);
        checkBlocks(it.content ?? [], where);
        for (const b of it.content ?? []) if (b.t === 'tab') expect(parseTab(b.lines).length, `${where}: tab has notes`).toBeGreaterThan(0);
      }
    }
  });
  it('rotates within a category from day to day, at the chosen level', () => {
    const warm = DAILY[0];
    const days = Array.from({ length: 6 }, (_, d) => itemFor(warm, 0, d).id);
    expect(new Set(days).size).toBe(6);
    expect(itemFor(warm, 1, 0).id).not.toBe(itemFor(warm, 0, 0).id);
    expect(itemFor(warm, 99, 0).id).toBe(itemFor(warm, warm.levels.length - 1, 0).id);
  });
  it('the full barre versions are the right chords, with the root in the bass', () => {
    const want: Record<string, number[]> = { G: [7, 11, 2], A: [9, 1, 4], F: [5, 9, 0], Am: [9, 0, 4], C: [0, 4, 7], D: [2, 6, 9], E: [4, 8, 11], Bm: [11, 2, 6], Em: [4, 7, 11], Dm: [2, 5, 9] };
    for (const [name, [, frets]] of Object.entries(BARRE)) {
      const midis = frets.map((f, i) => (f < 0 ? -1 : GUITAR_TUNING[i] + f)).filter((m) => m >= 0);
      expect([...new Set(midis.map((m) => m % 12))].sort(), name).toEqual([...want[name]].sort());
      expect(Math.min(...midis) % 12, `${name} root in the bass`).toBe(want[name][0]);
    }
  });
  it('the whole of Romanza is covered, chunk by chunk', () => {
    const rom = DAILY.find((c) => c.id === 'romanza')!;
    expect(rom.levels.slice(0, 8).map((l) => l.name)).toEqual(['תיבות 1–4', 'תיבות 5–8', 'תיבות 9–12', 'תיבות 13–16', 'תיבות 17–20', 'תיבות 21–24', 'תיבות 25–28', 'תיבות 29–32']);
  });
  it('counts practice days: each earlier day with something done, plus the extra lists started that day', () => {
    const s0 = getState();
    const s: State = { ...s0, daily: { ...s0.daily, checks: { '2026-10-01': ['0:warm'], '2026-10-02': [], '2026-10-03': ['0:warm', '1:warm'] }, sets: { '2026-10-03': 2 } } };
    expect(dailyBase(s, '2026-10-05')).toBe(3);
    expect(dailyBase(s, '2026-10-03')).toBe(1);
  });
});
