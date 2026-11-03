import embellishBass from './embellish-bass.json';
import { EMBELLISH_BASS_GUIDE, type PlanGuide } from './embellish-bass.guide';

/**
 * Practice plans imported as JSON, exactly as written. Each plan is one file in this folder in
 * the format below; adding a plan = adding its file and a line to PLANS.
 */

export type PlanCategory = string;
export interface PlanBlock { block: string; name_he: string; minutes: number; category: PlanCategory }
export interface PlanExercise {
  id: string;
  category: PlanCategory;
  name_he: string;
  instructions_he: string;
  bpm_start: number;
  bpm_target: number;
  bpm_step: number;
  pass_criteria_he: string;
  chords: string[];
  intro_week: number;
}
/** A bass note: [string as written ("6" = low E), fret, note name]. */
export type BassNote = [string, number, string];
export interface BassRun { from: string; to: string; notes: BassNote[] }
export interface PlanWeek { week: number; blocks: Record<PlanCategory, string[]>; goal_he: string; note_he: string }
export interface PracticePlan {
  version: number;
  title_he: string;
  source_he?: string;
  string_notation?: string;
  session_template: PlanBlock[];
  rules: { bpm_start: number; bpm_increment: number; clean_reps_to_advance: number; right_hand_never_stops?: boolean };
  /** Chord shapes written string 6 → 1, one character per string, x = muted. */
  chord_shapes: Record<string, string>;
  bass_runs: BassRun[];
  exercises: PlanExercise[];
  weeks: PlanWeek[];
  advance_rule_he?: string;
  glossary: { term: string; def_he: string }[];
  progress_log_schema?: Record<string, unknown>;
}
/** One entry of a plan's progress log (the plan's progress_log_schema). */
export interface PlanLogEntry { date: string; exercise_id: string; clean_bpm: number; clean_reps: number; passed: boolean; note: string }

export const PLANS: { id: string; plan: PracticePlan }[] = [
  // JSON tuples come in as plain arrays; the shape is checked by the plans test.
  { id: 'embellish-bass', plan: embellishBass as unknown as PracticePlan },
];
export const PLAN_BY_ID: Record<string, PracticePlan> = Object.fromEntries(PLANS.map((p) => [p.id, p.plan]));
/** The app's how-to notes for a plan (optional; the plan file itself is never changed). */
export const PLAN_GUIDES: Record<string, PlanGuide> = { 'embellish-bass': EMBELLISH_BASS_GUIDE };

const escape = (w: string) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * The plan's own glossary terms that a text uses ("פעמה (beat)" matches "בפעמה"): whole words,
 * with at most one Hebrew prefix letter – so "ליק" isn't found inside "קליק" (a chord root before "sus4" is fine).
 */
export function planTermsIn(plan: PracticePlan, text: string) {
  return plan.glossary.filter((g) => {
    const word = g.term.split(' (')[0];
    return new RegExp(`(?<![\\u0590-\\u05FF])[בהולמשכ]?${escape(word)}(?![A-Za-z0-9])`).test(text);
  });
}

/** "xx0232" → [-1, -1, 0, 2, 3, 2] (string 6 → 1). */
export const shapeFrets = (shape: string): number[] => [...shape].map((c) => (c === 'x' ? -1 : Number(c)));

export const exerciseOf = (plan: PracticePlan, id: string) => plan.exercises.find((e) => e.id === id);
