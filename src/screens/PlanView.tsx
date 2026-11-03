import { useState } from 'react';
import { ChordDiagram } from '../components/ChordDiagram';
import { rich } from '../components/rich';
import { Metronome, TabView, Timer } from '../components/RhythmTools';
import { notesTab } from '../data/guitarLib';
import { PLAN_BY_ID, exerciseOf, shapeFrets, type PlanExercise, type PracticePlan } from '../data/plans';
import { go } from '../router';
import { planBpm, planClean, planNotClean, planProgress, useStore } from '../state/store';

/**
 * An imported practice plan: today's session (the current week's blocks, each with its timer)
 * and a card per exercise – instructions, chord diagrams, a metronome at the working BPM and the
 * "clean" button that moves the BPM up.
 */

function ExerciseCard({ planId, plan, ex }: { planId: string; plan: PracticePlan; ex: PlanExercise }) {
  const s = useStore();
  const bpm = planBpm(s, planId, ex);
  const streak = planProgress(s, planId).streak[ex.id] ?? 0;
  const need = plan.rules.clean_reps_to_advance;
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const atTarget = bpm >= ex.bpm_target;
  const clean = () => {
    const raised = planClean(planId, plan, ex);
    setMsg(raised ? `🎉 ${need} פעמים נקי ברצף – עולים ל-${raised} BPM.` : streak + 1 >= need && atTarget ? `✓ ${need} פעמים נקי ב-${bpm} BPM – זה היעד של התרגיל.` : '');
  };
  return (
    <div className="plan-block">
      <div className="pb-head">
        <button className="pb-title" onClick={() => setOpen(!open)}>
          <span className="pb-kind" dir="ltr">{ex.id}</span>
          <span className="pb-name">{ex.name_he}</span>
          <span className="small muted">{bpm} BPM · יעד {ex.bpm_target}</span>
        </button>
        <button className="pb-toggle" onClick={() => setOpen(!open)} aria-label="פתח">{open ? '▴' : '▾'}</button>
      </div>
      {open && (
        <div className="pb-body">
          <p>{rich(ex.instructions_he)}</p>
          <p className="small"><b>קריטריון מעבר:</b> {rich(ex.pass_criteria_he)}</p>
          <div className="chord-row">{ex.chords.map((c) => <ChordDiagram key={c} label={c} frets={shapeFrets(plan.chord_shapes[c])} />)}</div>
          {ex.category === 'B' && plan.bass_runs.map((r) => (
            <TabView key={`${r.from}-${r.to}`} title={`\u2066${r.from} → ${r.to}: ${r.notes.map((n) => n[2]).join(' ')}\u2069`} lines={notesTab(r.notes.map(([st, f]) => [Number(st), f] as [number, number]))} bpm={bpm} />
          ))}
          <Metronome initial={bpm} />
          <div className="pp-clean">
            <div className="pp-dots" aria-label={`${streak} מתוך ${need}`}>{Array.from({ length: need }, (_, i) => <span key={i} className={i < streak ? 'on' : ''} />)}</div>
            <div className="row tight">
              <button className="btn primary" onClick={clean}>✓ נקי</button>
              <button className="btn ghost" onClick={() => { planNotClean(planId, ex.id); setMsg('הרצף התחיל מחדש – אותו BPM.'); }}>✗ לא נקי</button>
            </div>
            <p className="small muted">נגן ב-{bpm} BPM. כל נגינה נקייה – "נקי". {need} ברצף → עולים ל-{Math.min(ex.bpm_target, bpm + ex.bpm_step)}{atTarget ? ' (כבר ביעד)' : ''}.</p>
            {msg && <p className="small ok-text">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlanView({ id }: { id: string }) {
  const s = useStore();
  const plan = PLAN_BY_ID[id];
  if (!plan) return <div className="screen"><p>לא נמצאה תוכנית</p></div>;
  const week = plan.weeks.find((w) => w.week === planProgress(s, id).week) ?? plan.weeks[0];
  const total = plan.session_template.reduce((n, b) => n + b.minutes, 0);
  return (
    <div className="screen">
      <button className="back" onClick={() => go('daily')}>→ לגיטרה</button>
      <h1>{plan.title_he}</h1>
      {plan.source_he && <p className="small muted">{plan.source_he}</p>}
      <div className="why-box"><b>שבוע {week.week} מתוך {plan.weeks.length}</b> · מטרה: {rich(week.goal_he)}<br /><span className="small">{rich(week.note_he)}</span></div>
      <h3 className="section-title">אימון היום <small className="muted">({total} דק')</small></h3>
      {plan.session_template.map((b) => {
        const ids = week.blocks[b.category] ?? [];
        return (
          <section key={b.block} className="pp-block">
            <h3 className="b-h">{b.name_he} · {b.minutes} דק'</h3>
            <Timer minutes={b.minutes} />
            {ids.length
              ? ids.map((x) => exerciseOf(plan, x)).filter((e): e is PlanExercise => !!e).map((e) => <ExerciseCard key={e.id} planId={id} plan={plan} ex={e} />)
              : <p className="small muted">אין תרגיל בבלוק הזה השבוע.</p>}
          </section>
        );
      })}
      {plan.advance_rule_he && <p className="small muted">{plan.advance_rule_he}</p>}
    </div>
  );
}
