// Core music theory helpers. Notes are MIDI numbers (60 = middle C, C4).

export const PC_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const PC_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const NATURALS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
export const SOLFEGE: Record<string, string> = {
  C: 'דו', D: 'רה', E: 'מי', F: 'פה', G: 'סול', A: 'לה', B: 'סי',
};

export const pc = (midi: number) => ((midi % 12) + 12) % 12;
export const octaveOf = (midi: number) => Math.floor(midi / 12) - 1;
export const noteName = (midi: number, flats = false) => (flats ? PC_FLAT : PC_SHARP)[pc(midi)];
export const noteNameOct = (midi: number, flats = false) => noteName(midi, flats) + octaveOf(midi);
export const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
export const freqToMidiFloat = (f: number) => 69 + 12 * Math.log2(f / 440);

/** "C#" / "Db" / "C" → pitch class 0..11, or -1 if not a note name. */
export function pcOf(name: string): number {
  const m = /^([A-G])(#|b)?$/.exec(name);
  if (!m) return -1;
  let v = PC_SHARP.indexOf(m[1]);
  if (m[2] === '#') v += 1;
  if (m[2] === 'b') v -= 1;
  return (v + 12) % 12;
}

/** Hebrew-friendly label: "C (דו)" / "F# (פה דיאז)". */
export function heLabel(name: string): string {
  const letter = name[0];
  const acc = name[1] === '#' ? ' דיאז' : name[1] === 'b' ? ' במול' : '';
  return `${name} (${SOLFEGE[letter]}${acc})`;
}

export interface IntervalDef { semis: number; name: string; short: string }
export const INTERVALS: IntervalDef[] = [
  { semis: 0, name: 'אוניסון', short: 'P1' },
  { semis: 1, name: 'סקונדה קטנה', short: 'm2' },
  { semis: 2, name: 'סקונדה גדולה', short: 'M2' },
  { semis: 3, name: 'טרצה קטנה', short: 'm3' },
  { semis: 4, name: 'טרצה גדולה', short: 'M3' },
  { semis: 5, name: 'קוורטה זכה', short: 'P4' },
  { semis: 6, name: 'טריטון', short: 'TT' },
  { semis: 7, name: 'קווינטה זכה', short: 'P5' },
  { semis: 8, name: 'סקסטה קטנה', short: 'm6' },
  { semis: 9, name: 'סקסטה גדולה', short: 'M6' },
  { semis: 10, name: 'ספטימה קטנה', short: 'm7' },
  { semis: 11, name: 'ספטימה גדולה', short: 'M7' },
  { semis: 12, name: 'אוקטבה', short: 'P8' },
];
export const intervalName = (semis: number) => INTERVALS[semis].name;

export interface ChordDef { id: string; symbol: string; name: string; steps: number[] }
export const CHORDS: Record<string, ChordDef> = {
  maj: { id: 'maj', symbol: '', name: 'מז\'ור', steps: [0, 4, 7] },
  min: { id: 'min', symbol: 'm', name: 'מינור', steps: [0, 3, 7] },
  dim: { id: 'dim', symbol: 'dim', name: 'מוקטן', steps: [0, 3, 6] },
  aug: { id: 'aug', symbol: 'aug', name: 'מוגדל', steps: [0, 4, 8] },
  sus2: { id: 'sus2', symbol: 'sus2', name: 'sus2', steps: [0, 2, 7] },
  sus4: { id: 'sus4', symbol: 'sus4', name: 'sus4', steps: [0, 5, 7] },
  maj7: { id: 'maj7', symbol: 'maj7', name: 'מז\'ור 7', steps: [0, 4, 7, 11] },
  dom7: { id: 'dom7', symbol: '7', name: 'דומיננט 7', steps: [0, 4, 7, 10] },
  min7: { id: 'min7', symbol: 'm7', name: 'מינור 7', steps: [0, 3, 7, 10] },
  m7b5: { id: 'm7b5', symbol: 'm7b5', name: 'חצי-מוקטן', steps: [0, 3, 6, 10] },
};
export const chordSymbol = (rootName: string, q: string) => rootName + CHORDS[q].symbol;
export const chordNotes = (root: number, q: string) => CHORDS[q].steps.map((s) => root + s);

export interface ScaleDef { id: string; name: string; steps: number[] }
export const SCALES: Record<string, ScaleDef> = {
  major: { id: 'major', name: 'מז\'ור', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { id: 'minor', name: 'מינור טבעי', steps: [0, 2, 3, 5, 7, 8, 10] },
  harmMinor: { id: 'harmMinor', name: 'מינור הרמוני', steps: [0, 2, 3, 5, 7, 8, 11] },
  majPent: { id: 'majPent', name: 'פנטטוני מז\'ור', steps: [0, 2, 4, 7, 9] },
  minPent: { id: 'minPent', name: 'פנטטוני מינור', steps: [0, 3, 5, 7, 10] },
  blues: { id: 'blues', name: 'בלוז', steps: [0, 3, 5, 6, 7, 10] },
  dorian: { id: 'dorian', name: 'דורי', steps: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { id: 'phrygian', name: 'פריגי', steps: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { id: 'lydian', name: 'לידי', steps: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { id: 'mixolydian', name: 'מיקסולידי', steps: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { id: 'locrian', name: 'לוקרי', steps: [0, 1, 3, 5, 6, 8, 10] },
};
export const scaleNotes = (root: number, id: string) => SCALES[id].steps.map((s) => root + s);

/**
 * Correctly spelled scale (each letter used once) for heptatonic scales.
 * e.g. spellScale('F','major') → F G A Bb C D E
 */
export function spellScale(rootName: string, id: string): string[] {
  const steps = SCALES[id].steps;
  if (steps.length !== 7) return steps.map((s) => noteName(pcOf(rootName) + s, rootName.includes('b')));
  const startLetter = NATURALS.indexOf(rootName[0]);
  const rootPc = pcOf(rootName);
  return steps.map((s, i) => {
    const letter = NATURALS[(startLetter + i) % 7];
    const target = (rootPc + s) % 12;
    let diff = (target - pcOf(letter) + 12) % 12;
    if (diff > 6) diff -= 12;
    return letter + (diff === 1 ? '#' : diff === 2 ? '##' : diff === -1 ? 'b' : diff === -2 ? 'bb' : '');
  });
}

/** Major keys in circle-of-fifths order with their signature count (+ sharps / − flats). */
export const MAJOR_KEYS: { name: string; acc: number; relMinor: string }[] = [
  { name: 'C', acc: 0, relMinor: 'A' },
  { name: 'G', acc: 1, relMinor: 'E' },
  { name: 'D', acc: 2, relMinor: 'B' },
  { name: 'A', acc: 3, relMinor: 'F#' },
  { name: 'E', acc: 4, relMinor: 'C#' },
  { name: 'B', acc: 5, relMinor: 'G#' },
  { name: 'F#', acc: 6, relMinor: 'D#' },
  { name: 'F', acc: -1, relMinor: 'D' },
  { name: 'Bb', acc: -2, relMinor: 'G' },
  { name: 'Eb', acc: -3, relMinor: 'C' },
  { name: 'Ab', acc: -4, relMinor: 'F' },
  { name: 'Db', acc: -5, relMinor: 'Bb' },
];

/** Diatonic triad qualities on each degree of the major scale. */
export const MAJOR_DEGREE_QUALITIES = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
export const MAJOR_DEGREE_7THS = ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'];
export const ROMAN = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

/** Diatonic chord symbol on a 1-based degree of a major key, e.g. ('G', 5) → 'D'. */
export function diatonicChord(key: string, degree: number, sevenths = false): string {
  const notes = spellScale(key, 'major');
  const q = (sevenths ? MAJOR_DEGREE_7THS : MAJOR_DEGREE_QUALITIES)[degree - 1];
  return chordSymbol(notes[degree - 1], q);
}

/** Same pitch-class sets regardless of order/octave. */
export const samePcSet = (a: number[], b: number[]) => {
  const sa = new Set(a.map(pc));
  const sb = new Set(b.map(pc));
  return sa.size === sb.size && [...sa].every((x) => sb.has(x));
};

// Guitar
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4 (string 6 → 1)
export const STRING_LABEL = ['6 (E נמוך)', '5 (A)', '4 (D)', '3 (G)', '2 (B)', '1 (E גבוה)'];
