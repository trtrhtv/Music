export type Domain = 'theory' | 'ear' | 'guitar' | 'piano';
export const DOMAINS: Domain[] = ['theory', 'ear', 'guitar', 'piano'];
export const DOMAIN_LABEL: Record<Domain, string> = {
  theory: 'תיאוריה',
  ear: 'שמיעה',
  guitar: 'שיעורי גיטרה',
  piano: 'פסנתר',
};
export const DOMAIN_ICON: Record<Domain, string> = {
  theory: '📖',
  ear: '👂',
  guitar: '🎸',
  piano: '🎹',
};
export const LEVEL_LABEL = ['', 'מתחיל', 'בסיסי', 'בינוני', 'בינוני+', 'מתקדם'];

export type AudioCue =
  | { type: 'seq'; notes: number[]; gap?: number }
  | { type: 'chord'; notes: number[]; spread?: number }
  | { type: 'prog'; chords: number[][] }
  | { type: 'twoParts'; first: AudioCue; second: AudioCue; pause?: number };

export interface StaffSpec {
  clef: 'treble' | 'bass';
  /** Spelled notes with octave, e.g. "F#4". Drawn as a chord when `chord` is set. */
  notes: string[];
  chord?: boolean;
}

export interface ChoiceEx {
  kind: 'choice';
  prompt: string;
  options: string[];
  answer: number;
  audio?: AudioCue;
  staff?: StaffSpec;
  diagram?: number[]; // guitar chord diagram, frets from string 6 → 1 (-1 = muted)
  explain?: string;
}

export interface KeysEx {
  kind: 'keys';
  prompt: string;
  /** Required pitch classes (octave-agnostic). */
  pcs: number[];
  /** If set, the lowest selected key must have this pitch class (inversions / bass). */
  bassPc?: number;
  explain?: string;
}

export interface FretEx {
  kind: 'fret';
  prompt: string;
  /** Accept any tap whose pitch class matches… */
  pc?: number;
  /** …or whose exact midi matches one of these. */
  midis?: number[];
  /** Restrict to string index 0..5 (0 = low E). */
  string?: number;
  /** Pre-marked position shown on the board. */
  mark?: { s: number; f: number };
  maxFret?: number;
  explain?: string;
}

export interface MicNoteEx {
  kind: 'micNote';
  prompt: string;
  pc: number;
  /** When set, the octave must match too. */
  midi?: number;
  instrument: 'guitar' | 'piano';
  explain?: string;
}

export interface MicChordEx {
  kind: 'micChord';
  prompt: string;
  pcs: number[];
  /** Spelled chord tones for display, e.g. ['Bb', 'D', 'F']. */
  names: string[];
  symbol: string;
  diagram?: number[];
  instrument: 'guitar' | 'piano';
  explain?: string;
}

export type Exercise = ChoiceEx | KeysEx | FretEx | MicNoteEx | MicChordEx;
export const isMic = (e: Exercise) => e.kind === 'micNote' || e.kind === 'micChord';

export interface Generator {
  id: string;
  domain: Domain;
  tier: number; // 1..5
  title: string;
  make: () => Exercise;
}
