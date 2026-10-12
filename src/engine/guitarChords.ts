/** Guitar chord shapes: frets from string 6 (low E) → 1, -1 = muted. */
export interface ChordShape { symbol: string; root: string; q: string; frets: number[]; tier: number }

export const CHORD_SHAPES: ChordShape[] = [
  { symbol: 'Em', root: 'E', q: 'min', frets: [0, 2, 2, 0, 0, 0], tier: 1 },
  { symbol: 'Am', root: 'A', q: 'min', frets: [-1, 0, 2, 2, 1, 0], tier: 1 },
  { symbol: 'C', root: 'C', q: 'maj', frets: [-1, 3, 2, 0, 1, 0], tier: 1 },
  { symbol: 'G', root: 'G', q: 'maj', frets: [3, 2, 0, 0, 0, 3], tier: 1 },
  { symbol: 'D', root: 'D', q: 'maj', frets: [-1, -1, 0, 2, 3, 2], tier: 1 },
  { symbol: 'E', root: 'E', q: 'maj', frets: [0, 2, 2, 1, 0, 0], tier: 1 },
  { symbol: 'A', root: 'A', q: 'maj', frets: [-1, 0, 2, 2, 2, 0], tier: 1 },
  { symbol: 'Dm', root: 'D', q: 'min', frets: [-1, -1, 0, 2, 3, 1], tier: 1 },
  { symbol: 'E7', root: 'E', q: 'dom7', frets: [0, 2, 0, 1, 0, 0], tier: 2 },
  { symbol: 'A7', root: 'A', q: 'dom7', frets: [-1, 0, 2, 0, 2, 0], tier: 2 },
  { symbol: 'D7', root: 'D', q: 'dom7', frets: [-1, -1, 0, 2, 1, 2], tier: 2 },
  { symbol: 'G7', root: 'G', q: 'dom7', frets: [3, 2, 0, 0, 0, 1], tier: 2 },
  { symbol: 'C7', root: 'C', q: 'dom7', frets: [-1, 3, 2, 3, 1, 0], tier: 2 },
  { symbol: 'B7', root: 'B', q: 'dom7', frets: [-1, 2, 1, 2, 0, 2], tier: 2 },
  { symbol: 'Am7', root: 'A', q: 'min7', frets: [-1, 0, 2, 0, 1, 0], tier: 2 },
  { symbol: 'Em7', root: 'E', q: 'min7', frets: [0, 2, 0, 0, 0, 0], tier: 2 },
  { symbol: 'Cmaj7', root: 'C', q: 'maj7', frets: [-1, 3, 2, 0, 0, 0], tier: 2 },
  { symbol: 'Dmaj7', root: 'D', q: 'maj7', frets: [-1, -1, 0, 2, 2, 2], tier: 2 },
  { symbol: 'Fmaj7', root: 'F', q: 'maj7', frets: [-1, -1, 3, 2, 1, 0], tier: 2 },
  { symbol: 'F', root: 'F', q: 'maj', frets: [1, 3, 3, 2, 1, 1], tier: 3 },
  { symbol: 'Fm', root: 'F', q: 'min', frets: [1, 3, 3, 1, 1, 1], tier: 3 },
  { symbol: 'Bm', root: 'B', q: 'min', frets: [-1, 2, 4, 4, 3, 2], tier: 3 },
  { symbol: 'B', root: 'B', q: 'maj', frets: [-1, 2, 4, 4, 4, 2], tier: 3 },
  { symbol: 'Bb', root: 'Bb', q: 'maj', frets: [-1, 1, 3, 3, 3, 1], tier: 3 },
  { symbol: 'F#m', root: 'F#', q: 'min', frets: [2, 4, 4, 2, 2, 2], tier: 3 },
  { symbol: 'Cm', root: 'C', q: 'min', frets: [-1, 3, 5, 5, 4, 3], tier: 3 },
];

export const shapesUpTo = (tier: number) => CHORD_SHAPES.filter((s) => s.tier <= tier);
export const shapesAt = (tier: number) => CHORD_SHAPES.filter((s) => s.tier === tier);
