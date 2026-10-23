import { describe, expect, it } from 'vitest';
import { PLAN, dayMinutes } from '../data/plan';
import { SONGS, SONG_BY_ID } from '../data/songs';
import { CH, STRUMS } from '../data/guitarLib';
import { parseSlots } from '../audio/rhythm';
import { LESSON_BY_ID } from '../data/curriculum';
import { GLOSSARY_BY_ID } from '../data/glossary';
import type { Block } from '../data/blocks';

function checkBlocks(blocks: Block[], where: string) {
  for (const b of blocks) {
    if (b.t === 'tab') {
      expect(b.lines.length, where).toBe(6);
      expect(new Set(b.lines.map((l) => l.length)).size, `${where}: tab lines equal length`).toBe(1);
    }
    if (b.t === 'chords') for (const c of b.items) expect(c.frets, `${where}: chord ${c.name}`).toHaveLength(6);
    if (b.t === 'strum') {
      for (const c of b.chords ?? []) expect(c, `${where}: strum chord`).toHaveLength(6);
      expect(parseSlots(b.rhythm.slots).length, `${where}: slots = sub × beats`).toBe(b.rhythm.sub * b.rhythm.beats);
    }
    if (b.t === 'go') for (const l of b.items) {
      const [page, arg] = l.to.split('/');
      if (page === 'lesson') expect(LESSON_BY_ID[arg], `${where}: ${l.to}`).toBeDefined();
      else if (page === 'glossary') expect(GLOSSARY_BY_ID[arg], `${where}: ${l.to}`).toBeDefined();
      else expect(['practice', 'tools', 'plan', 'songs'], `${where}: ${l.to}`).toContain(page);
    }
  }
}

describe('practice plan', () => {
  it('has 14 days of ~2h core (light day excepted)', () => {
    expect(PLAN.map((d) => d.n)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
    for (const d of PLAN) {
      const m = dayMinutes(d);
      if (!d.light) expect(m.core, `day ${d.n}`).toBeGreaterThanOrEqual(100);
      expect(m.core, `day ${d.n}`).toBeLessThanOrEqual(130);
      expect(new Set(d.blocks.map((b) => b.id)).size, `day ${d.n} unique ids`).toBe(d.blocks.length);
    }
  });
  it('blocks reference real songs, lessons and well-formed content', () => {
    for (const d of PLAN) for (const b of d.blocks) {
      for (const s of b.songs ?? []) expect(SONG_BY_ID[s], `day ${d.n} ${b.id}: ${s}`).toBeDefined();
      checkBlocks(b.content ?? [], `day ${d.n} ${b.id}`);
      if (b.bpm) expect(b.bpm.target).toBeGreaterThan(b.bpm.start);
    }
    for (const s of SONGS) { checkBlocks(s.blocks, s.id); expect(s.sources.length, s.id).toBeGreaterThan(0); }
  });
  it('strum patterns keep the hand moving (downs on the beat grid, ups between)', () => {
    for (const [id, st] of Object.entries(STRUMS)) {
      const slots = parseSlots(st.rhythm.slots);
      if (st.rhythm.sub === 3) continue; // triplet feel alternates differently
      slots.forEach((s, i) => {
        if (s.kind === 'D') expect(i % 2, `${id} slot ${i}`).toBe(0);
        if (s.kind === 'U') expect(i % 2, `${id} slot ${i}`).toBe(1);
      });
    }
  });
  it('every chord voicing is a playable 6-string shape', () => {
    for (const [n, f] of Object.entries(CH)) {
      expect(f, n).toHaveLength(6);
      const fretted = f.filter((x) => x > 0);
      if (fretted.length) expect(Math.max(...fretted) - Math.min(...fretted), `${n} stretch`).toBeLessThanOrEqual(4);
    }
  });
});
