import { CHORDS, NATURALS, pc } from '../theory/theory';
import { pcAny, pick, spellChord } from './util';

/**
 * Piano note reading: a note on the staff, or a chord (by name or on the staff). The player names
 * it – the note, or the notes the chord is built from – and finds it on the keyboard.
 */

export type Clef = 'treble' | 'bass';
export interface DrillOptions {
  kind: 'note' | 'chord' | 'mix';
  clef: Clef | 'both';
  /** Notes with ♯ and ♭ too. */
  accidentals: boolean;
  /** Beyond major and minor: diminished, augmented and the four 7th chords. */
  moreChords: boolean;
  /** How a chord is shown: its name, written on the staff, or either. */
  chordShow: 'name' | 'staff' | 'mix';
}
export interface DrillQ {
  kind: 'note' | 'chord';
  show: 'staff' | 'name';
  clef: Clef;
  /** Spelled with octave, as the staff draws them: "F#4". */
  staff: string[];
  /** Spelled names without octave: ["D", "F#", "A"]. */
  names: string[];
  midis: number[];
  /** Chord symbol ("Dm7") and quality name in Hebrew. */
  symbol?: string;
  quality?: string;
}

/** Keyboard shown for each clef: two octaves around where its notes sit. */
export const KEYS: Record<Clef, [number, number]> = { treble: [60, 84], bass: [36, 64] };

const acc = (n: string) => (n.match(/#/g)?.length ?? 0) - (n.match(/b/g)?.length ?? 0);
/** Octave number of a spelled note at a midi pitch (B#3 is midi 60, Cb4 is midi 59). */
export const withOctave = (name: string, midi: number) => `${name}${Math.floor((midi - acc(name)) / 12) - 1}`;
/** Midi of a spelled note with octave, e.g. "F#4" → 66. */
export function midiOf(n: string): number {
  const m = /^([A-G](?:#{1,2}|b{1,2})?)(\d)$/.exec(n)!;
  return (Number(m[2]) + 1) * 12 + [0, 2, 4, 5, 7, 9, 11][NATURALS.indexOf(m[1][0])] + acc(m[1]);
}

// Readable ranges (few ledger lines): treble C4–A5, bass E2–C4.
const RANGE: Record<Clef, [number, number]> = { treble: [60, 81], bass: [40, 60] };
const NOTE_ROOTS_PLAIN = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const CHORD_ROOTS_ACC = ['Bb', 'Eb', 'Ab', 'Db', 'F#', 'C#'];

function noteQ(clef: Clef, accidentals: boolean): DrillQ {
  const [lo, hi] = RANGE[clef];
  for (;;) {
    const letter = pick(NATURALS);
    const name = accidentals && Math.random() < 0.5 ? letter + pick(['#', 'b']) : letter;
    // Skip the spellings that read like another white key (E#, B#, Fb, Cb).
    if (['E#', 'B#', 'Fb', 'Cb'].includes(name)) continue;
    const options: number[] = [];
    for (let m = lo; m <= hi; m++) if (pc(m) === pcAny(name)) options.push(m);
    const midi = pick(options);
    return { kind: 'note', show: 'staff', clef, staff: [withOctave(name, midi)], names: [name], midis: [midi] };
  }
}

function chordQ(clef: Clef, o: DrillOptions): DrillQ {
  const roots = o.accidentals ? [...NOTE_ROOTS_PLAIN, ...CHORD_ROOTS_ACC] : NOTE_ROOTS_PLAIN;
  const qualities = o.moreChords ? ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'] : ['maj', 'min'];
  for (;;) {
    const root = pick(roots);
    const q = pick(qualities);
    const names = spellChord(root, CHORDS[q].steps);
    // No double sharps or flats, and nothing that reads as another white key.
    if (names.some((n) => /##|bb|E#|B#|Fb|Cb/.test(n))) continue;
    // Root position, close: the root in the octave that sits well on the clef.
    const base = (clef === 'treble' ? 60 : 48) + pcAny(root);
    const midis = CHORDS[q].steps.map((s) => base + s);
    if (midis[midis.length - 1] > (clef === 'treble' ? 81 : 64)) continue;
    const show: DrillQ['show'] = o.chordShow === 'mix' ? pick(['name', 'staff'] as const) : o.chordShow;
    return { kind: 'chord', show, clef, staff: names.map((n, i) => withOctave(n, midis[i])), names, midis, symbol: root + CHORDS[q].symbol, quality: CHORDS[q].name };
  }
}

export function makeDrillQ(o: DrillOptions): DrillQ {
  const clef: Clef = o.clef === 'both' ? pick(['treble', 'bass'] as const) : o.clef;
  const kind = o.kind === 'mix' ? pick(['note', 'chord'] as const) : o.kind;
  return kind === 'note' ? noteQ(clef, o.accidentals) : chordQ(clef, o);
}

/** Step 1: the names written. Spelling is checked; the same key under another name is "almost". */
export function checkNames(q: DrillQ, answer: string[]): { ok: boolean; enharmonic: boolean } {
  const want = [...q.names].sort().join(' ');
  const got = [...answer].sort().join(' ');
  if (want === got) return { ok: true, enharmonic: false };
  const pcs = (xs: string[]) => [...new Set(xs.map(pcAny))].sort((a, b) => a - b).join(' ');
  const enharmonic = answer.length === q.names.length && pcs(answer) === pcs(q.names);
  return { ok: false, enharmonic };
}

/** Step 2: the keys pressed. A single note must be the exact key; a chord, its notes in any octave. */
export function checkKeys(q: DrillQ, keys: number[]): boolean {
  if (q.kind === 'note') return keys.length === 1 && keys[0] === q.midis[0];
  const want = new Set(q.midis.map(pc));
  const got = new Set(keys.map(pc));
  return want.size === got.size && [...want].every((p) => got.has(p));
}
