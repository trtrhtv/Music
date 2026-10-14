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
