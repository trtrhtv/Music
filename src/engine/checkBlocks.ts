import { expect } from 'vitest';
import type { Block } from '../data/blocks';
import { parseSlots } from '../audio/rhythm';
import { LESSON_BY_ID } from '../data/curriculum';
import { GLOSSARY_BY_ID } from '../data/glossary';
import { SONG_BY_ID } from '../data/songs';

/** Shared checks for content blocks: tabs line up, chords have six strings, links lead somewhere. */
export function checkBlocks(blocks: Block[], where: string) {
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
      else if (page === 'track') expect(['theory', 'ear', 'guitar', 'piano']).toContain(arg);
      else expect(['practice', 'tools', 'plan', 'daily'], `${where}: ${l.to}`).toContain(page);
    }
  }
}

