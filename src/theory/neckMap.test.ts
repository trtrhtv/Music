import { expect, it } from 'vitest';
import { NECK_SETS, neckMarks } from './neckMap';

const set = (id: string) => NECK_SETS.find((s) => s.id === id)!;

it('A minor pentatonic on the neck: shape 1 frets, names and degrees', () => {
  const m = neckMarks('A', set('minPent'), 'names');
  const low = m.filter((x) => x.s === 0).map((x) => `${x.f}:${x.label}`);
  expect(low).toEqual(['0:E', '3:G', '5:A', '8:C', '10:D', '12:E', '15:G']);
  const deg = neckMarks('A', set('minPent'), 'degrees').filter((x) => x.s === 0 && x.f >= 5 && x.f <= 8).map((x) => x.label);
  expect(deg).toEqual(['1', 'b3']);
  expect(m.filter((x) => x.kind === 'ok').every((x) => x.label === 'A')).toBe(true);
});

it('spells scales and chords with the right letters', () => {
  expect(set('major').spell('F')).toEqual(['F', 'G', 'A', 'Bb', 'C', 'D', 'E']);
  expect(set('blues').spell('E')).toEqual(['E', 'G', 'A', 'Bb', 'B', 'D']);
  expect(set('c-7').spell('D')).toEqual(['D', 'F#', 'A', 'C']);
  expect(set('dorian').spell('A')).toEqual(['A', 'B', 'C', 'D', 'E', 'F#', 'G']);
  for (const s of NECK_SETS) expect(s.spell('C'), s.id).toHaveLength(s.steps.length);
});
