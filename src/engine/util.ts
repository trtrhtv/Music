import { NATURALS, PC_SHARP, pcOf } from '../theory/theory';
import type { ChoiceEx, AudioCue, StaffSpec } from './types';

export const rand = (n: number) => Math.floor(Math.random() * n);
export const pick = <T,>(a: readonly T[]): T => a[rand(a.length)];
export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const sample = <T,>(a: readonly T[], n: number) => shuffle([...a]).slice(0, n);

/** Build a multiple-choice exercise; distractors are de-duplicated and trimmed to `n-1`. */
export function choice(
  prompt: string,
  correct: string,
  distractors: string[],
  extra: { audio?: AudioCue; staff?: StaffSpec; diagram?: number[]; explain?: string; n?: number } = {},
): ChoiceEx {
  const n = extra.n ?? 4;
  const uniq = shuffle([...new Set(distractors.filter((d) => d !== correct))]).slice(0, n - 1);
  const options = shuffle([correct, ...uniq]);
  return {
    kind: 'choice',
    prompt,
    options,
    answer: options.indexOf(correct),
    audio: extra.audio,
    staff: extra.staff,
    diagram: extra.diagram,
    explain: extra.explain,
  };
}

/** Spell `targetPc` using a given letter, e.g. ('E', 3) → 'Eb'. */
export function spellWithLetter(letter: string, targetPc: number): string {
  let diff = (targetPc - pcOf(letter) + 12) % 12;
  if (diff > 6) diff -= 12;
  const acc = diff === 1 ? '#' : diff === 2 ? '##' : diff === -1 ? 'b' : diff === -2 ? 'bb' : '';
  return letter + acc;
}

// Letter offset (interval number − 1) for each semitone count; tritone is spelled as an augmented 4th.
const LETTER_OFFSET = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7];

/** Correctly spelled note `semis` above `rootName`, e.g. ('D', 3) → 'F'. */
export function spellAbove(rootName: string, semis: number): string {
  const letter = NATURALS[(NATURALS.indexOf(rootName[0]) + LETTER_OFFSET[semis]) % 7];
  return spellWithLetter(letter, (pcAny(rootName) + semis) % 12);
}

/** pcOf that tolerates double accidentals. */
export function pcAny(name: string): number {
  const base = PC_SHARP.indexOf(name[0]);
  let v = base;
  for (const ch of name.slice(1)) v += ch === '#' ? 1 : ch === 'b' ? -1 : 0;
  return ((v % 12) + 12) % 12;
}

export const spellChord = (rootName: string, steps: number[]) => steps.map((s) => spellAbove(rootName, s));
