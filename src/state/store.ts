import { useSyncExternalStore } from 'react';
import { lessonsFor } from '../data/curriculum';
import type { Domain } from '../engine/types';
import type { TrackId } from '../data/tracks';

export interface Profile {
  guitarExp: number; // 0..4
  pianoExp: number;
  readsNotes: number;
  knowsTheory: number;
  goal: string;
  hasGuitar: boolean;
  hasPiano: boolean;
}

export interface JournalEntry { date: string; session: string; goal: string; good: string; next: string }

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
  /**
   * Guitar program: current stage per track (1–5, 6 = done), the days each stage test was passed
   * ("track:stage" → dates), BPM log per exercise, and sessions done per date.
   */
  /** Display preferences. */
  prefs: { hidePiano: boolean };
  /** Spaced review of passed theory lessons: Leitner box and next due date per lesson. */
  review: Record<string, { box: number; due: string }>;
  prog: {
    placed: boolean;
    stage: Record<TrackId, number>;
    passes: Record<string, string[]>;
    bpm: Record<string, number[]>;
    sessions: Record<string, string[]>;
    /** Practice journal: the goal set before a session and the reflection after it. */
    journal: JournalEntry[];
  };
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
  prefs: { hidePiano: false },
  review: {},
  prog: { placed: false, stage: { tech: 1, rhythm: 1, neck: 1, finger: 1 }, passes: {}, bpm: {}, sessions: {}, journal: [] },
});

/** Fills in fields added after the data was saved. */
const withDefaults = (saved: Partial<State>): State =>
  ({ ...fresh(), ...saved, prog: { ...fresh().prog, ...saved.prog }, prefs: { ...fresh().prefs, ...saved.prefs } });

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return withDefaults(JSON.parse(raw));
  } catch { /* storage unavailable */ }
  return fresh();
}

/** Replaces everything with a backup's state. */
export function restoreState(saved: Partial<State>) {
  update(() => withDefaults(saved));
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
    // A theory lesson passed for the first time enters spaced review: first due tomorrow.
    const review = domain === 'theory' && !prev.passed && score >= PASS && !s.review[id] ? { ...s.review, [id]: { box: 0, due: addDays(today(), REVIEW_DAYS[0]) } } : s.review;
    // Level up when every lesson of the current level is passed.
    let lvl = s.levels[domain];
    while (lvl < 5 && lessonsFor(domain).filter((l) => l.level === lvl && !l.optional).every((l) => lessons[l.id]?.passed || l.level < s.placedLevels[domain])) lvl++;
    return { ...s, lessons, review, levels: { ...s.levels, [domain]: lvl } };
  });
}

/** Days until the next review, per box: 1, 3, 7, 14, 30, 60 – a right answer moves up a box, a wrong one back to the start. */
export const REVIEW_DAYS = [1, 3, 7, 14, 30, 60];
export const addDays = (date: string, n: number) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Theory lessons whose review is due today, oldest first. Lessons passed before review existed count as due. */
export function dueReviews(s: State, theoryIds: string[]): string[] {
  return theoryIds
    .filter((id) => s.lessons[id]?.passed)
    .map((id) => ({ id, due: s.review[id]?.due ?? today() }))
    .filter((r) => r.due <= today())
    .sort((a, b) => a.due.localeCompare(b.due))
    .map((r) => r.id);
}

export function answerReview(id: string, right: boolean) {
  update((s) => {
    const box = right ? Math.min((s.review[id]?.box ?? 0) + 1, REVIEW_DAYS.length - 1) : 0;
    return { ...s, review: { ...s.review, [id]: { box, due: addDays(today(), REVIEW_DAYS[box]) } } };
  });
}

export function finishPlacement(profile: Profile, levels: Record<Domain, number>) {
  update((s) => ({ ...s, placed: true, profile, levels: { ...levels }, placedLevels: { ...levels } }));
}

/** Manually chosen levels: lessons below them count as known, like after the placement test. */
export function setLevels(levels: Record<Domain, number>) {
  update((s) => ({ ...s, placed: true, levels: { ...levels }, placedLevels: { ...levels } }));
}

/** Days a stage test must be passed on before the stage counts as done. */
export const PASS_DAYS = 2;
export const STAGES = 5;
const touchDay = (s: State) => (s.days.includes(today()) ? s.days : [...s.days, today()]);

export function placeProgram(stage: Record<TrackId, number>) {
  update((s) => ({ ...s, prog: { ...s.prog, placed: true, stage: { ...stage } } }));
}

export function setTrackStage(track: TrackId, n: number) {
  update((s) => ({ ...s, prog: { ...s.prog, stage: { ...s.prog.stage, [track]: Math.max(1, Math.min(STAGES + 1, n)) } } }));
}

/** Records today's pass of the current stage test; the stage advances after PASS_DAYS different days. Returns true if it advanced. */
export function passStageTest(track: TrackId): boolean {
  let advanced = false;
  update((s) => {
    const stage = s.prog.stage[track];
    const k = `${track}:${stage}`;
    const dates = s.prog.passes[k] ?? [];
    const next = dates.includes(today()) ? dates : [...dates, today()];
    advanced = next.length >= PASS_DAYS && stage <= STAGES;
    return {
      ...s, days: touchDay(s),
      prog: { ...s.prog, passes: { ...s.prog.passes, [k]: next }, stage: advanced ? { ...s.prog.stage, [track]: stage + 1 } : s.prog.stage },
    };
  });
  return advanced;
}

/** Undoes today's pass – of the current stage, or of the stage that just advanced because of it. */
export function unpassStageTest(track: TrackId) {
  update((s) => {
    let stage = s.prog.stage[track];
    let k = `${track}:${stage}`;
    if (!(s.prog.passes[k] ?? []).includes(today()) && stage > 1 && (s.prog.passes[`${track}:${stage - 1}`] ?? []).includes(today())) {
      stage -= 1;
      k = `${track}:${stage}`;
    }
    const dates = (s.prog.passes[k] ?? []).filter((d) => d !== today());
    return { ...s, prog: { ...s.prog, stage: { ...s.prog.stage, [track]: stage }, passes: { ...s.prog.passes, [k]: dates } } };
  });
}

export function logExerciseBpm(exercise: string, bpm: number) {
  update((s) => ({ ...s, days: touchDay(s), prog: { ...s.prog, bpm: { ...s.prog.bpm, [exercise]: [...(s.prog.bpm[exercise] ?? []), bpm] } } }));
}

export function finishSession(id: string, note?: Omit<JournalEntry, 'date' | 'session'>) {
  update((s) => {
    const done = s.prog.sessions[today()] ?? [];
    const journal = note && (note.goal || note.good || note.next) ? [...s.prog.journal, { date: today(), session: id, ...note }] : s.prog.journal;
    return { ...s, days: touchDay(s), prog: { ...s.prog, journal, sessions: { ...s.prog.sessions, [today()]: [...done, id] } } };
  });
}

export function setHidePiano(hidePiano: boolean) {
  update((s) => ({ ...s, prefs: { ...s.prefs, hidePiano } }));
}

export function resetProgram() {
  update((s) => ({ ...s, prog: fresh().prog }));
}

export function resetAll() {
  update(() => fresh());
}

export type LessonStatus = 'passed' | 'known' | 'open' | 'locked';
export function lessonStatus(s: State, l: { id: string; domain: Domain; level: number }): LessonStatus {
  if (s.lessons[l.id]?.passed) return 'passed';
  if (l.domain === 'theory') return 'open'; // the theory course is never locked
  if (l.level < s.placedLevels[l.domain]) return 'known';
  if (l.level <= s.levels[l.domain]) return 'open';
  return 'locked';
}
