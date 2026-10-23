import { PLAN, type PlanDay } from '../data/plan';
import { planKey, type State } from './store';

export const coreDone = (s: State, d: PlanDay) => d.blocks.filter((b) => b.core).every((b) => s.plan.done[planKey(d.n, b.id)]);
export const doneCount = (s: State, d: PlanDay) => d.blocks.filter((b) => s.plan.done[planKey(d.n, b.id)]).length;
/** The first day whose core blocks aren't all checked. */
export const currentDay = (s: State) => PLAN.find((d) => !coreDone(s, d)) ?? PLAN[PLAN.length - 1];
