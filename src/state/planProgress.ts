import { CHECKPOINT, PLAN, type PlanDay } from '../data/plan';
import { planKey, type State } from './store';

export const coreDone = (s: State, d: PlanDay) => d.blocks.filter((b) => b.core).every((b) => s.plan.done[planKey(d.n, b.id)]);
export const doneCount = (s: State, d: PlanDay) => d.blocks.filter((b) => s.plan.done[planKey(d.n, b.id)]).length;
/** The first day whose core blocks aren't all checked. */
export const currentDay = (s: State) => PLAN.find((d) => !coreDone(s, d)) ?? PLAN[PLAN.length - 1];

export const RATE_LABELS = ['עוד לא', 'עם עצירות', 'ברצף, עם טעויות', 'נקי ובטוח'];

/** Songs rated lowest on the checkpoint day, weakest first. */
export function weakestSongs(s: State, n = 2): string[] {
  const prefix = CHECKPOINT + ':';
  return Object.entries(s.plan.rate).filter(([k]) => k.startsWith(prefix)).sort((a, b) => a[1] - b[1]).slice(0, n).map(([k]) => k.slice(prefix.length));
}
