import { describe, expect, it } from 'vitest';
import { adviceFor, coachDue } from './coach';
import { addDays, getState, type Heard, type State } from '../state/store';

const TODAY = '2026-11-10';
const d = (n: number) => addDays(TODAY, -n);
function state(heard: Omit<Heard, 'track' | 'stage'>[], stage = 1, extra: Partial<State['prog']> = {}): State {
  const s = getState();
  return { ...s, prog: { ...s.prog, placed: true, stage: { tech: stage, rhythm: 1, neck: 1, finger: 1 }, heard: heard.map((h) => ({ track: 'tech', stage, ...h })), ...extra } };
}
const timing = (date: string, score: number, bpm: number, drift = 0): Omit<Heard, 'track' | 'stage'> => ({ date, kind: 'timing', score, bpm, drift });

describe('what I heard: level suggestions', () => {
  it('asks for more checks before judging (at least 3, on 2 different days)', () => {
    expect(adviceFor(state([]), 'tech', TODAY)!.kind).toBe('more');
    expect(adviceFor(state([timing(d(0), 0.3, 80), timing(d(0), 0.3, 80), timing(d(0), 0.3, 80)]), 'tech', TODAY)!.kind).toBe('more');
  });
  it('suggests slowing down by ~15% when the playing is unsteady', () => {
    const a = adviceFor(state([timing(d(2), 0.5, 80), timing(d(1), 0.55, 80), timing(d(0), 0.45, 80)]), 'tech', TODAY)!;
    expect(a.kind).toBe('slow');
    expect(a.bpm).toBe(70);
  });
  it('suggests stepping back a stage only when it is far too hard, never from stage 1', () => {
    const weak = [timing(d(3), 0.3, 70), timing(d(2), 0.25, 70), timing(d(1), 0.35, 65), timing(d(0), 0.3, 65)];
    expect(adviceFor(state(weak, 2), 'tech', TODAY)!.kind).toBe('down');
    expect(adviceFor(state(weak, 1), 'tech', TODAY)!.kind).toBe('slow');
  });
  it('says ready for the test when the test tempo is clean on two days, and "move on" when well above it', () => {
    // Technique stage 1: test at 90 BPM.
    expect(adviceFor(state([timing(d(2), 0.92, 90), timing(d(1), 0.9, 90), timing(d(0), 0.95, 90)]), 'tech', TODAY)!.kind).toBe('ready');
    expect(adviceFor(state([timing(d(2), 0.93, 105), timing(d(1), 0.95, 105), timing(d(0), 0.94, 90)]), 'tech', TODAY)!.kind).toBe('up');
    // Clean but only below the test tempo: keep going.
    expect(adviceFor(state([timing(d(2), 0.95, 70), timing(d(1), 0.95, 75), timing(d(0), 0.95, 80)]), 'tech', TODAY)!.kind).toBe('keep');
  });
  it('ignores checks older than three weeks and checks of other stages', () => {
    expect(adviceFor(state([timing(d(30), 0.3, 80), timing(d(29), 0.3, 80), timing(d(28), 0.3, 80)]), 'tech', TODAY)!.kind).toBe('more');
    const s = state([timing(d(2), 0.3, 80), timing(d(1), 0.3, 80), timing(d(0), 0.3, 80)]);
    s.prog.heard = s.prog.heard.map((h) => ({ ...h, stage: 2 }));
    expect(adviceFor(s, 'tech', TODAY)!.kind).toBe('more');
  });
  it('does not hold back a player whose latest check is already clean', () => {
    expect(adviceFor(state([timing(d(2), 0.4, 90), timing(d(1), 0.5, 90), timing(d(0), 1, 90)]), 'tech', TODAY)!.kind).toBe('keep');
  });
  it('notices rushing', () => {
    const a = adviceFor(state([timing(d(2), 0.7, 80, -30), timing(d(1), 0.72, 80, -25), timing(d(0), 0.75, 80, -20)]), 'tech', TODAY)!;
    expect(a.detail.join(' ')).toContain('להאיץ');
  });
  it('shows "what I heard" on the home screen only when there is something new', () => {
    const weak = [timing(d(2), 0.5, 80), timing(d(1), 0.5, 80), timing(d(0), 0.5, 80)];
    expect(coachDue(state(weak), TODAY)).toBe(true);
    expect(coachDue(state(weak, 1, { coachSeen: TODAY }), TODAY)).toBe(false);
    expect(coachDue(state([]), TODAY)).toBe(false);
    // Nothing to act on, but a week of new checks: a weekly summary.
    const fine = [timing(d(3), 0.8, 80), timing(d(2), 0.8, 80), timing(d(1), 0.8, 80)];
    expect(coachDue(state(fine, 1, { coachSeen: d(8) }), TODAY)).toBe(true);
    expect(coachDue(state(fine, 1, { coachSeen: d(4) }), TODAY)).toBe(false);
  });
});
