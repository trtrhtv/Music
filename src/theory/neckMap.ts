import type { FretMark } from '../components/Fretboard';
import { pcAny, spellChord } from '../engine/util';
import { GUITAR_TUNING, SCALES, spellScale } from './theory';

/** What can be shown on the neck map: scales (by their parent scale for spelling) and chords. */
export interface NeckSet { id: string; label: string; steps: number[]; spell: (root: string) => string[] }
export const NECK_SETS: NeckSet[] = [
  { id: 'major', label: 'סולם מז\'ור', steps: SCALES.major.steps, spell: (r) => spellScale(r, 'major') },
  { id: 'minor', label: 'סולם מינור', steps: SCALES.minor.steps, spell: (r) => spellScale(r, 'minor') },
  { id: 'minPent', label: 'מינור פנטטוני', steps: [0, 3, 5, 7, 10], spell: (r) => { const m = spellScale(r, 'minor'); return [m[0], m[2], m[3], m[4], m[6]]; } },
  { id: 'majPent', label: 'מז\'ור פנטטוני', steps: [0, 2, 4, 7, 9], spell: (r) => { const m = spellScale(r, 'major'); return [m[0], m[1], m[2], m[4], m[5]]; } },
  { id: 'blues', label: 'בלוז', steps: [0, 3, 5, 6, 7, 10], spell: (r) => { const m = spellScale(r, 'minor'); const f = spellScale(r, 'major')[4]; return [m[0], m[2], m[3], f.endsWith('#') ? f.slice(0, -1) : f + 'b', m[4], m[6]]; } },
  { id: 'dorian', label: 'דורי', steps: [0, 2, 3, 5, 7, 9, 10], spell: (r) => spellScale(r, 'dorian') },
  { id: 'mixolydian', label: 'מיקסולידי', steps: [0, 2, 4, 5, 7, 9, 10], spell: (r) => spellScale(r, 'mixolydian') },
  { id: 'c-maj', label: 'אקורד מז\'ור', steps: [0, 4, 7], spell: (r) => spellChord(r, [0, 4, 7]) },
  { id: 'c-min', label: 'אקורד מינור', steps: [0, 3, 7], spell: (r) => spellChord(r, [0, 3, 7]) },
  { id: 'c-7', label: 'אקורד 7', steps: [0, 4, 7, 10], spell: (r) => spellChord(r, [0, 4, 7, 10]) },
  { id: 'c-maj7', label: 'אקורד maj7', steps: [0, 4, 7, 11], spell: (r) => spellChord(r, [0, 4, 7, 11]) },
  { id: 'c-m7', label: 'אקורד m7', steps: [0, 3, 7, 10], spell: (r) => spellChord(r, [0, 3, 7, 10]) },
];
export const NECK_ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const DEGREE = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];


/** Every place on the neck (frets 0–15) of a scale or chord, labelled by name or degree; the root marked. */
export function neckMarks(root: string, set: NeckSet, show: 'names' | 'degrees', maxFret = 15): FretMark[] {
  const r = pcAny(root);
  const spelled = set.spell(root);
  const marks: FretMark[] = [];
  for (let st = 0; st < 6; st++) for (let f = 0; f <= maxFret; f++) {
    const iv = ((GUITAR_TUNING[st] + f - r) % 12 + 12) % 12;
    const k = set.steps.indexOf(iv);
    if (k >= 0) marks.push({ s: st, f, kind: iv === 0 ? 'ok' : 'mark', label: show === 'degrees' ? DEGREE[iv] : spelled[k] });
  }
  return marks;
}
