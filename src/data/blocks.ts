import type { AudioCue, StaffSpec } from '../engine/types';

/** Building blocks for explanations (glossary entries, lesson intros, help sheets). */
export type Block =
  | { t: 'p'; text: string }
  | { t: 'h'; text: string }
  | { t: 'tip'; text: string }
  | { t: 'list'; items: string[] }
  /** Table; columns listed in `ltr` are rendered left-to-right (note names, symbols). */
  | { t: 'table'; head?: string[]; rows: string[][]; ltr?: number[] }
  | { t: 'keyboard'; from?: number; to?: number; labels?: 'letters' | 'solfege' | 'both'; marks?: number[]; caption?: string }
  | { t: 'staff'; spec: StaffSpec; labels?: string[]; caption?: string }
  | { t: 'diagram'; frets: number[]; label?: string; caption?: string }
  | { t: 'fretboard'; names?: boolean; marks?: { s: number; f: number; label?: string }[]; maxFret?: number; caption?: string }
  | { t: 'sounds'; items: { label: string; cue: AudioCue; timbre?: 'piano' | 'guitar' }[] }
  /** Links to glossary entries. */
  | { t: 'see'; ids: string[] };

// Small helpers to keep content files readable.
export const p = (text: string): Block => ({ t: 'p', text });
export const h = (text: string): Block => ({ t: 'h', text });
export const tip = (text: string): Block => ({ t: 'tip', text });
export const list = (...items: string[]): Block => ({ t: 'list', items });
export const see = (...ids: string[]): Block => ({ t: 'see', ids });
export const seq = (label: string, notes: number[], gap = 0.45, timbre?: 'piano' | 'guitar') =>
  ({ label, cue: { type: 'seq', notes, gap } as AudioCue, timbre });
export const chord = (label: string, notes: number[], timbre?: 'piano' | 'guitar') =>
  ({ label, cue: { type: 'chord', notes } as AudioCue, timbre });
export const sounds = (...items: { label: string; cue: AudioCue; timbre?: 'piano' | 'guitar' }[]): Block => ({ t: 'sounds', items });
