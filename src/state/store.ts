import { useSyncExternalStore } from 'react';
import { lessonsFor } from '../data/curriculum';
import type { Domain } from '../engine/types';

export interface Profile {
  guitarExp: number; // 0..4
  pianoExp: number;
  readsNotes: number;
  knowsTheory: number;
  goal: string;
  hasGuitar: boolean;
  hasPiano: boolean;
}

export interface State {
  version: 1;
  placed: boolean;
  profile: Profile | null;
  /** Current unlocked level per domain (1..5). */
  levels: Record<Domain, number>;
  /** Level the placement test found (lessons below it count as "known"). */
  placedLevels: Record<Domain, number>;
  lessons: Record<string, { best: number; passed: boolean; attempts: number }>;
  genStats: Record<string, { right: number; total: number; last: number }>;
  days: string[];
  xp: number;
  /** Practice plan: done blocks ("day:block"), BPM log per block key and self-ratings ("day:song" → 0–3). */
  plan: { done: Record<string, boolean>; bpm: Record<string, number[]>; rate: Record<string, number> };
}

const KEY = 'music-trainer-v1';
const fresh = (): State => ({
  version: 1,
  placed: false,
  profile: null,
  levels: { theory: 1, ear: 1, guitar: 1, piano: 1 },
  placedLevels: { theory: 1, ear: 1, guitar: 1, piano: 1 },
  lessons: {},
  genStats: {},
  days: [],
  xp: 0,
  plan: { done: {}, bpm: {}, rate: {} },
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return { ...fresh(), ...saved, plan: { ...fresh().plan, ...saved.plan } };
    }
  } catch { /* storage unavailable */ }
  return fresh();
}

let state = load();
const subs = new Set<() => void>();

export function getState() {
  return state;
}

export function update(fn: (s: State) => State) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch { /* storage unavailable */ }
  subs.forEach((f) => f());
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
  );
}

export const today = () => new Date().toISOString().slice(0, 10);

export function streak(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  if (!set.has(today())) d.setDate(d.getDate() - 1);
  while (set.has(d.toISOString().slice(0, 10))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function recordAnswer(genId: string, right: boolean) {
  update((s) => {
    const g = s.genStats[genId] ?? { right: 0, total: 0, last: 0 };
    const days = s.days.includes(today()) ? s.days : [...s.days, today()];
    return {
      ...s,
      days,
      xp: s.xp + (right ? 10 : 2),
      genStats: { ...s.genStats, [genId]: { right: g.right + (right ? 1 : 0), total: g.total + 1, last: Date.now() } },
    };
  });
}

export const PASS = 0.7;

export function recordLesson(id: string, domain: Domain, score: number) {
  update((s) => {
    const prev = s.lessons[id] ?? { best: 0, passed: false, attempts: 0 };
    const lessons = { ...s.lessons, [id]: { best: Math.max(prev.best, score), passed: prev.passed || score >= PASS, attempts: prev.attempts + 1 } };
    // Level up when every lesson of the current level is passed.
    let lvl = s.levels[domain];
    while (lvl < 5 && lessonsFor(domain).filter((l) => l.level === lvl && !l.optional).every((l) => lessons[l.id]?.passed || l.level < s.placedLevels[domain])) lvl++;
    return { ...s, lessons, levels: { ...s.levels, [domain]: lvl } };
  });
}

export function finishPlacement(profile: Profile, levels: Record<Domain, number>) {
  update((s) => ({ ...s, placed: true, profile, levels: { ...levels }, placedLevels: { ...levels } }));
}

/** Manually chosen levels: lessons below them count as known, like after the placement test. */
export function setLevels(levels: Record<Domain, number>) {
  update((s) => ({ ...s, placed: true, levels: { ...levels }, placedLevels: { ...levels } }));
}

export const planKey = (day: number, block: string) => `${day}:${block}`;

export function togglePlanBlock(day: number, block: string) {
  update((s) => {
    const k = planKey(day, block);
    const days = s.days.includes(today()) ? s.days : [...s.days, today()];
    return { ...s, days, plan: { ...s.plan, done: { ...s.plan.done, [k]: !s.plan.done[k] } } };
  });
}

export function logPlanBpm(day: number, block: string, bpm: number) {
  update((s) => {
    const k = planKey(day, block);
    return { ...s, plan: { ...s.plan, bpm: { ...s.plan.bpm, [k]: [...(s.plan.bpm[k] ?? []), bpm] } } };
  });
}

export function ratePlanSong(day: number, song: string, level: number) {
  update((s) => ({ ...s, plan: { ...s.plan, rate: { ...s.plan.rate, [planKey(day, song)]: level } } }));
}

export function resetPlan() {
  update((s) => ({ ...s, plan: fresh().plan }));
}

export function resetAll() {
  update(() => fresh());
}

export type LessonStatus = 'passed' | 'known' | 'open' | 'locked';
export function lessonStatus(s: State, l: { id: string; domain: Domain; level: number }): LessonStatus {
  if (s.lessons[l.id]?.passed) return 'passed';
  if (l.level < s.placedLevels[l.domain]) return 'known';
  if (l.level <= s.levels[l.domain]) return 'open';
  return 'locked';
}
