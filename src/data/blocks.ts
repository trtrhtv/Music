import type { Rhythm } from '../audio/rhythm';
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
  | { t: 'see'; ids: string[] }
  /** Guitar tab, 6 lines from high e to low E. */
  /** `sub` = notes per beat when played back (2 = eighths, 3 = triplets). */
  | { t: 'tab'; lines: string[]; title?: string; sub?: number; bpm?: number }
  /** Playable strum pattern; chords are fret voicings (6→1) cycled per bar. */
  | { t: 'strum'; name: string; rhythm: Rhythm; bpm?: number; chords?: number[][]; chordNames?: string[]; note?: string }
  | { t: 'metronome'; bpm?: number; beats?: number }
  /** External links (sources, full tabs). */
  | { t: 'links'; items: { label: string; url: string }[] }
  /** Links inside the app (lessons, practice, glossary…). */
  | { t: 'go'; items: { label: string; to: string }[] }
  /** A row of chord diagrams. */
  | { t: 'chords'; items: { name: string; frets: number[] }[]; caption?: string }
  /** Hidden until tapped – an answer to try first. */
  | { t: 'reveal'; label: string; blocks: Block[] };

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
