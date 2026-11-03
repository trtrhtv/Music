import { describe, expect, it } from 'vitest';
import raw from '../data/plans/embellish-bass.json?raw';
import { PLANS, PLAN_GUIDES, planTermsIn, shapeFrets } from '../data/plans';

describe('imported practice plans', () => {
  it('the guitar plan file is imported unchanged', () => {
    expect(PLANS[0].plan).toEqual(JSON.parse(raw));
  });
  for (const { id, plan } of PLANS) {
    it(`${id}: every reference resolves`, () => {
      const ids = new Set(plan.exercises.map((e) => e.id));
      expect(ids.size, 'unique exercise ids').toBe(plan.exercises.length);
      const cats = new Set(plan.session_template.map((b) => b.category));
      for (const e of plan.exercises) {
        expect(cats.has(e.category), `${e.id} category`).toBe(true);
        expect(e.bpm_start, e.id).toBeLessThanOrEqual(e.bpm_target);
        expect(e.bpm_step, e.id).toBeGreaterThan(0);
        for (const c of e.chords) expect(plan.chord_shapes[c], `${e.id}: chord ${c}`).toBeDefined();
      }
      for (const w of plan.weeks) for (const [cat, list] of Object.entries(w.blocks)) {
        expect(cats.has(cat), `week ${w.week} block ${cat}`).toBe(true);
        for (const x of list) expect(ids.has(x), `week ${w.week}: ${x}`).toBe(true);
      }
      for (const [name, shape] of Object.entries(plan.chord_shapes)) {
        expect(shapeFrets(shape), name).toHaveLength(6);
        expect(shapeFrets(shape).every((f) => f === -1 || (f >= 0 && f <= 9)), name).toBe(true);
      }
      for (const r of plan.bass_runs) for (const [s, f] of r.notes) {
        expect(['1', '2', '3', '4', '5', '6']).toContain(s);
        expect(f).toBeGreaterThanOrEqual(0);
      }
    });
  }
});

describe('the "clean" button', () => {
  it('raises the BPM by the step after 3 clean takes in a row, logs it, and never passes the target', async () => {
    const { getState, planBpm, planClean, planNotClean, planProgress } = await import('../state/store');
    const plan = PLANS[0].plan;
    const ex = plan.exercises.find((e) => e.id === 'K1')!; // 60 → 90, step 5
    const bpm = () => planBpm(getState(), 'test', ex);
    expect(bpm()).toBe(60);
    expect(planClean('test', plan, ex)).toBeNull();
    expect(planClean('test', plan, ex)).toBeNull();
    planNotClean('test', ex.id); // the run breaks
    expect(planClean('test', plan, ex)).toBeNull();
    expect(planClean('test', plan, ex)).toBeNull();
    expect(bpm()).toBe(60);
    expect(planClean('test', plan, ex)).toBe(65);
    expect(bpm()).toBe(65);
    const log = planProgress(getState(), 'test').log;
    expect(log[log.length - 1]).toMatchObject({ exercise_id: 'K1', clean_bpm: 60, clean_reps: 3, passed: false, note: '' });
    for (let k = 0; k < 30; k++) planClean('test', plan, ex);
    expect(bpm()).toBe(90);
  });
});

describe('how-to notes for a plan', () => {
  it('cover every exercise of the plan, and only those', () => {
    for (const { id, plan } of PLANS) {
      const g = PLAN_GUIDES[id];
      if (!g) continue;
      expect(Object.keys(g.exercises).sort()).toEqual(plan.exercises.map((e) => e.id).sort());
      for (const steps of Object.values(g.exercises)) expect(steps.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('find the plan\'s own glossary terms in a text', () => {
    const plan = PLANS[0].plan;
    expect(planTermsIn(plan, 'בפעמה 1 המר-און ואז סלייד').map((t) => t.term)).toEqual(expect.arrayContaining(['פעמה (beat)', 'המר-און', 'סלייד']));
    expect(planTermsIn(plan, 'מכה על כל קליק').map((t) => t.term)).not.toContain('ליק (lick)');
    expect(planTermsIn(plan, 'Dsus4 ו-Dsus2').map((t) => t.term)).toEqual(expect.arrayContaining(['sus4', 'sus2']));
  });
});
