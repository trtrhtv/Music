import { describe, expect, it } from 'vitest';
import { PD_PIECES, PIECE_BACH, PIECE_GREEN, PIECE_SCAR, PIECE_TARREGA } from '../data/pieces';
import { SONG_BY_ID } from '../data/songs';
import { parseTab } from '../audio/tabPlayer';

describe('public-domain pieces', () => {
  const all = { tarrega: PIECE_TARREGA, bach: PIECE_BACH, green: PIECE_GREEN, scar: PIECE_SCAR };
  it.each(Object.entries(all))('%s: six even strings, one bar number per bar, notes in every bar', (_, p) => {
    expect(p.lines).toHaveLength(6);
    expect(new Set(p.lines.map((l) => l.length)).size).toBe(1);
    const bars = p.lines.map((l) => l.split('|'));
    expect(bars[0]).toHaveLength(p.bars.length);
    for (let i = 0; i < p.bars.length; i++) expect(parseTab(bars.map((b) => b[i])).length).toBeGreaterThan(0);
  });
  it('are complete', () => {
    expect(PIECE_BACH.bars).toHaveLength(43);
    // Tárrega: 1–8 twice, then 9–16 twice; the repeat is the same music.
    expect(PIECE_TARREGA.bars.join(' ')).toBe([1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 9, 10, 11, 12, 13, 14, 15, 16].join(' '));
    const t = PIECE_TARREGA.lines[0].split('|');
    expect(t.slice(0, 8)).toEqual(t.slice(8, 16));
    expect(PIECE_GREEN.bars).toEqual(Array.from({ length: 17 }, (_, i) => i));
    expect(PIECE_SCAR.bars).toHaveLength(18);
  });
  it('are on the song list, each with a full tab and its sources', () => {
    for (const s of PD_PIECES) {
      expect(SONG_BY_ID[s.id]).toBe(s);
      expect(s.blocks.some((b) => b.t === 'tab' && b.bars && b.beats)).toBe(true);
      expect(s.sources.some((x) => x.url.includes('classtab.org'))).toBe(true);
    }
  });
});
