import type { Profile } from '../state/store';
import { GENERATORS } from './generators';
import type { Domain, Generator } from './types';
import { isMic } from './types';
import { pick } from './util';

export const PLACEMENT_LEN: Record<Domain, number> = { theory: 7, ear: 6, guitar: 7, piano: 5 };

/** Starting tier for each domain, from the self-assessment questionnaire. */
export function priorTiers(p: Profile): Record<Domain, number> {
  const clamp = (x: number) => Math.max(1, Math.min(5, Math.round(x)));
  const theory = 1 + (p.knowsTheory + p.readsNotes) / 2;
  return {
    theory: clamp(theory),
    ear: clamp(theory - 0.5),
    guitar: clamp(1 + p.guitarExp),
    piano: clamp(1 + p.pianoExp),
  };
}

export interface Answer { tier: number; right: boolean }

/** Up one tier after a right answer, down one after a wrong one. */
export const nextTier = (tier: number, right: boolean) => Math.max(1, Math.min(5, tier + (right ? 1 : -1)));

/**
 * Estimated level: the highest tier the learner answered correctly at least half the time.
 * A level is only granted if no lower tier was failed outright (all wrong).
 */
export function estimateLevel(answers: Answer[]): number {
  if (answers.length === 0) return 1;
  const by = new Map<number, { r: number; t: number }>();
  for (const a of answers) {
    const v = by.get(a.tier) ?? { r: 0, t: 0 };
    v.t++;
    if (a.right) v.r++;
    by.set(a.tier, v);
  }
  let level = 1;
  for (let t = 1; t <= 5; t++) {
    const v = by.get(t);
    if (!v) continue;
    if (v.r === 0 && v.t >= 2) break; // clearly failing this tier
    if (v.r / v.t >= 0.5) level = t;
  }
  return level;
}

/** Choose a generator for the placement step. Mic steps prefer mic generators at or below the tier. */
export function pickPlacementGen(domain: Domain, tier: number, wantMic: boolean): Generator {
  const pool = GENERATORS.filter((g) => g.domain === domain);
  for (let t = tier; t >= 1; t--) {
    const at = pool.filter((g) => g.tier === t && isMicGen(g) === wantMic);
    if (at.length) return pick(at);
  }
  return pick(pool.filter((g) => g.tier <= tier && !isMicGen(g)));
}

const micCache = new Map<string, boolean>();
export function isMicGen(g: Generator): boolean {
  if (!micCache.has(g.id)) micCache.set(g.id, isMic(g.make()));
  return micCache.get(g.id)!;
}

/** Which step indexes in a domain's placement are microphone checks. */
export function micSteps(domain: Domain, p: Profile): number[] {
  if (domain === 'guitar' && p.hasGuitar) return [2, 5];
  if (domain === 'piano' && p.hasPiano) return [4];
  return [];
}
