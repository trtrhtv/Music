import { describe, expect, it } from 'vitest';
import { DAILY, itemFor } from '../data/daily';
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
