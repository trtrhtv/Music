import { describe, expect, it } from 'vitest';
import { isChordLine, parseTabText } from './tabText';

const SONG = `My song – tabbed by someone

[Intro]
      Am              E7
e|-----0-------0---|-----0-------0---|
B|---1---1-------1-|---0---0-------0-|
G|-2-------2-------|-1-------1-------|   x2
D|-----------------|-----------------|
A|-0---------------|-----------------|
E|-----------------|-0---------------|

Some words here that are lyrics

[Chorus]
  C
e|--0-----|
B|----1---|
G|------0-|
D|--------|
A|3-------|
E|--------|
`;

describe('pasted tab text', () => {
  it('reads staves, bars, chords and sections', () => {
    const t = parseTabText(SONG);
    expect(t.staves).toBe(2);
    expect(t.bars).toBe(3);
    expect(t.lines).toHaveLength(6);
    expect(new Set(t.lines.map((l) => l.length)).size).toBe(1);
    expect(t.lines[0].split('|')).toHaveLength(3);
    expect(t.lines[4]).toBe('-0---------------|-----------------|3-------');
    expect(t.chords).toEqual(['Am', 'E7', 'C']);
    expect(t.chordLine).toHaveLength(t.lines[0].length);
    // "Am" sits above the first bar, "E7" above the second, "C" above the third.
    const bars0 = t.lines[0].split('|').map((b) => b.length);
    expect(t.chordLine.slice(0, bars0[0]).trim()).toBe('Am');
    expect(t.chordLine.slice(bars0[0] + 1, bars0[0] + 1 + bars0[1]).trim()).toBe('E7');
    expect(t.chordLine.slice(bars0[0] + bars0[1] + 2).trim()).toBe('C');
    expect(t.sections).toEqual({ 0: 'Intro', 2: 'Chorus' });
  });
  it('accepts staves without string names or closing bar lines', () => {
    const t = parseTabText(['|--0--|--3--', '|-1---|-----', '|2----|-----', '|-----|-----', '|-----|-----', '|-----|-3---'].join('\n'));
    expect(t.staves).toBe(1);
    expect(t.bars).toBe(2);
    expect(t.lines[0]).toBe('--0--|--3--');
    expect(t.chordLine).toBe('');
  });
  it('tells chord lines from lyrics', () => {
    expect(isChordLine('   Am     E7/G#   Dm7  ')).toBe(true);
    expect(isChordLine('  Bm7b5   F#m  Cadd9 (x2)')).toBe(true);
    expect(isChordLine('He deals the cards as a meditation')).toBe(false);
    expect(isChordLine('A man walks')).toBe(false);
  });
  it('finds nothing in plain text', () => {
    expect(parseTabText('just some words\nand more').staves).toBe(0);
  });
});
