import { it, expect } from 'vitest';
import { GENERATORS } from './generators';
import { HELP } from '../data/help';
it('every generator explains itself and has help', () => {
  const missing: string[] = [];
  for (const g of GENERATORS) {
    for (let i = 0; i < 30; i++) if (!(g.make() as { explain?: string }).explain) { missing.push(g.id); break; }
    expect(HELP[g.id], 'help ' + g.id).toBeDefined();
  }
  expect(missing).toEqual([]);
});

it('help and lessons only link to existing glossary entries', async () => {
  const { GLOSSARY_BY_ID } = await import('../data/glossary');
  const { LESSONS } = await import('../data/curriculum');
  for (const [id, h] of Object.entries(HELP)) for (const t of h.topics) expect(GLOSSARY_BY_ID[t], `${id} → ${t}`).toBeDefined();
  for (const l of LESSONS) for (const t of l.see ?? []) expect(GLOSSARY_BY_ID[t], `${l.id} → ${t}`).toBeDefined();
  for (const g of Object.values(GLOSSARY_BY_ID))
    for (const b of g.blocks) if (b.t === 'see') for (const t of b.ids) expect(GLOSSARY_BY_ID[t], `${g.id} → ${t}`).toBeDefined();
});

it('lesson extras refer to real lessons', async () => {
  const { LESSON_EXTRAS } = await import('../data/lessonExtras');
  const { LESSON_BY_ID } = await import('../data/curriculum');
  for (const id of Object.keys(LESSON_EXTRAS)) expect(LESSON_BY_ID[id], id).toBeDefined();
});

it('theory course: every lesson sits in a unit, uses real drills, and teaches before it drills', async () => {
  const { LESSONS } = await import('../data/curriculum');
  const { GEN_BY_ID } = await import('./generators');
  const { THEORY_UNITS } = await import('../data/theoryCourse');
  for (const l of LESSONS) {
    for (const [g] of l.drills) expect(GEN_BY_ID[g], `${l.id} → ${g}`).toBeDefined();
    if (l.domain !== 'theory') continue;
    expect(l.unit, l.id).toBeGreaterThan(0);
    expect(THEORY_UNITS[l.unit!], l.id).toBeTruthy();
    if (l.pages) {
      expect(l.pages.length, l.id).toBeGreaterThan(1);
      expect(l.why && l.summary, l.id).toBeTruthy();
      for (const pg of l.pages) {
        expect(pg.blocks.length, `${l.id}: ${pg.title}`).toBeGreaterThan(0);
        for (const b of pg.blocks) if (b.t === 'tab') expect(new Set(b.lines.map((x) => x.length)).size, `${l.id} tab`).toBe(1);
        for (const b of pg.blocks) if (b.t === 'chords') for (const c of b.items) expect(c.frets, `${l.id} ${c.name}`).toHaveLength(6);
        for (const b of pg.blocks) if (b.t === 'diagram') expect(b.frets, l.id).toHaveLength(6);
      }
    }
  }
});

it('new theory drills always offer the right answer once', async () => {
  const { GEN_BY_ID } = await import('./generators');
  for (const id of ['th.fretSteps', 'th.stepUp', 'th.degreeOf', 'th.intervalNumber', 'th.neckInterval', 'th.thirdSwap', 'th.susPower', 'th.symbolRead', 'th.romanChord', 'th.keyFromChords', 'th.transpose', 'th.minorDiatonic', 'th.pentaNotes']) {
    for (let i = 0; i < 200; i++) {
      const ex = GEN_BY_ID[id].make() as { kind: string; options: string[]; answer: number };
      expect(ex.answer, id).toBeGreaterThanOrEqual(0);
      expect(new Set(ex.options).size, `${id}: ${ex.options.join(',')}`).toBe(ex.options.length);
      expect(ex.options.length, id).toBeGreaterThanOrEqual(2);
    }
  }
});
