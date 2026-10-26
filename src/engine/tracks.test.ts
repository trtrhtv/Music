import { describe, expect, it } from 'vitest';
import { SESSIONS, TRACKS, TRACK_BY_ID } from '../data/tracks';
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
      else if (page === 'songs') expect(SONG_BY_ID[arg], `${where}: ${l.to}`).toBeDefined();
      else expect(['practice', 'tools', 'plan'], `${where}: ${l.to}`).toContain(page);
    }
  }
}

describe('guitar program', () => {
  it('has four tracks of five stages, each with exercises and a measurable test', () => {
    expect(TRACKS.map((t) => t.id)).toEqual(['tech', 'rhythm', 'neck', 'finger']);
    const ids = new Set<string>();
    for (const t of TRACKS) {
      expect(t.stages, t.id).toHaveLength(5);
      for (const h of t.help) expect(GLOSSARY_BY_ID[h], `${t.id} help ${h}`).toBeDefined();
      t.stages.forEach((st, i) => {
        const where = `${t.id} stage ${i + 1}`;
        expect(st.exercises.length, where).toBeGreaterThan(0);
        expect(st.test.length, where).toBeGreaterThan(20);
        for (const ex of st.exercises) {
          expect(ids.has(ex.id), `duplicate ${ex.id}`).toBe(false);
          ids.add(ex.id);
          expect(ex.steps.length, ex.id).toBeGreaterThan(0);
          if (ex.bpm) expect(ex.bpm.target, ex.id).toBeGreaterThan(ex.bpm.start);
          checkBlocks(ex.content ?? [], `${where} ${ex.id}`);
        }
      });
    }
  });
  it('sessions are about an hour (or half), end with free playing, and point at real tracks', () => {
    for (const s of SESSIONS) {
      const min = s.blocks.reduce((n, b) => n + b.min, 0);
      expect([30, 60], s.id).toContain(min);
      expect(s.blocks[s.blocks.length - 1].kind, s.id).toBe('free');
      for (const b of s.blocks) if (b.kind === 'track') expect(TRACK_BY_ID[b.track], s.id).toBeDefined();
    }
  });
  it('the Romanza page is well-formed', () => {
    for (const s of SONGS) { checkBlocks(s.blocks, s.id); expect(s.sources.length, s.id).toBeGreaterThan(0); }
  });
  it('strum patterns keep the hand moving (downs on the beat grid, ups between)', () => {
    for (const [id, st] of Object.entries(STRUMS)) {
      if (st.rhythm.sub === 3) continue; // triplet feel alternates differently
      parseSlots(st.rhythm.slots).forEach((s, i) => {
        if (s.kind === 'D') expect(i % 2, `${id} slot ${i}`).toBe(0);
        if (s.kind === 'U') expect(i % 2, `${id} slot ${i}`).toBe(1);
      });
    }
  });
  it('every chord voicing is a playable 6-string shape', () => {
    for (const [n, f] of Object.entries(CH)) {
      expect(f, n).toHaveLength(6);
      const played = f.filter((x) => x > 0);
      if (played.length) expect(Math.max(...played) - Math.min(...played), n).toBeLessThanOrEqual(4);
    }
  });
});
