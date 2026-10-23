import { useState } from 'react';
import { Blocks } from '../components/Blocks';
import { rich } from '../components/rich';
import { Timer } from '../components/RhythmTools';
import { KIND_META, PLAN, dayMinutes, planIntro, type PlanBlock } from '../data/plan';
import { SONG_BY_ID } from '../data/songs';
import { go } from '../router';
import { coreDone, currentDay, doneCount } from '../state/planProgress';
import { logPlanBpm, planKey, togglePlanBlock, useStore } from '../state/store';

const blockTitle = (b: PlanBlock) => b.title || (b.songs?.[0] ? SONG_BY_ID[b.songs[0]].title : KIND_META[b.kind].label);

export function PlanOverview() {
  const s = useStore();
  const cur = currentDay(s);
  const total = PLAN.filter((d) => coreDone(s, d)).length;
  return (
    <div className="screen">
      <h1>🗓️ התוכנית שלי</h1>
      <div className="bar big"><div style={{ width: `${(total / PLAN.length) * 100}%` }} /></div>
      <p className="muted small">{total} מתוך {PLAN.length} ימים הושלמו</p>
      <button className="cta" onClick={() => go('plan/' + cur.n)}>
        <span className="cta-icon">▶</span>
        <span><b>יום {cur.n}: {cur.title}</b><br /><small>{cur.focus}</small></span>
      </button>
      <button className="btn ghost wide" onClick={() => go('songs')}>🎵 השירים והיצירות</button>
      <details className="plan-intro"><summary>איך עובדים עם התוכנית</summary><Blocks blocks={planIntro} /></details>
      {[1, 2].map((w) => (
        <section key={w} className="unit">
          <h3>שבוע {w} · {w === 1 ? 'חזרה לכושר, מקצב ופריטה באצבעות' : 'סגנונות, יצירות והופעה'}</h3>
          {PLAN.filter((d) => d.week === w).map((d) => {
            const m = dayMinutes(d);
            const done = coreDone(s, d);
            return (
              <button key={d.n} className={`lesson-row ${done ? 'passed' : d.n === cur.n ? 'open' : ''}`} onClick={() => go('plan/' + d.n)}>
                <span className="lr-badge">{done ? '✓' : d.n}</span>
                <span className="lr-title">{d.title}{d.light && <small className="muted"> · יום קל</small>}</span>
                <span className="lr-meta small muted">{doneCount(s, d)}/{d.blocks.length} · {Math.round(m.core / 6) / 10} ש'</span>
              </button>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function BpmLog({ day, block }: { day: number; block: PlanBlock }) {
  const s = useStore();
  const log = s.plan.bpm[planKey(day, block.id)] ?? [];
  const [val, setVal] = useState(String(log[log.length - 1] ?? block.bpm!.start));
  return (
    <div className="bpm-log">
      <span className="small">🎯 BPM: התחלה {block.bpm!.start} · יעד {block.bpm!.target}</span>
      <div className="row tight">
        <input type="number" inputMode="numeric" min={30} max={240} value={val} onChange={(e) => setVal(e.target.value)} aria-label="BPM שהגעתי" />
        <button className="btn small" onClick={() => { const n = Number(val); if (n >= 30 && n <= 240) logPlanBpm(day, block.id, n); }}>רשום</button>
      </div>
      {log.length > 0 && <div className="muted small" dir="ltr">{log.slice(-6).join(' → ')}</div>}
    </div>
  );
}

function BlockCard({ day, b }: { day: number; b: PlanBlock }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const done = !!s.plan.done[planKey(day, b.id)];
  const meta = KIND_META[b.kind];
  return (
    <div className={`plan-block ${done ? 'done' : ''}`}>
      <div className="pb-head">
        <button className={`pb-check ${done ? 'on' : ''}`} aria-label="סיימתי" onClick={() => togglePlanBlock(day, b.id)}>{done ? '✓' : ''}</button>
        <button className="pb-title" onClick={() => setOpen(!open)}>
          <span className="pb-kind">{meta.icon} {meta.label} · {b.min} דק'</span>
          <span className="pb-name">{blockTitle(b)}</span>
        </button>
        <button className="pb-toggle" onClick={() => setOpen(!open)} aria-label="פתח">{open ? '▴' : '▾'}</button>
      </div>
      {open && (
        <div className="pb-body">
          <Timer minutes={b.min} />
          <ol className="pb-steps">{b.steps.map((st, i) => <li key={i}>{rich(st)}</li>)}</ol>
          {b.songs && (
            <div className="b-see">
              {b.songs.map((id) => <button key={id} className="chip" onClick={() => go('songs/' + id)}>🎵 {SONG_BY_ID[id].title}</button>)}
            </div>
          )}
          {b.content && <Blocks blocks={b.content} />}
          {b.bpm && <BpmLog day={day} block={b} />}
          {!done && <button className="btn primary wide" onClick={() => { togglePlanBlock(day, b.id); setOpen(false); }}>✓ סיימתי את הבלוק</button>}
        </div>
      )}
    </div>
  );
}

export function PlanDayView({ n }: { n: number }) {
  const s = useStore();
  const d = PLAN.find((x) => x.n === n);
  if (!d) return <div className="screen"><p>יום לא נמצא</p></div>;
  const m = dayMinutes(d);
  const core = d.blocks.filter((b) => b.core);
  const extra = d.blocks.filter((b) => !b.core);
  const doneCore = core.filter((b) => s.plan.done[planKey(n, b.id)]).length;
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לכל הימים</button>
      <p className="muted">שבוע {d.week} · יום {d.n} מתוך {PLAN.length}</p>
      <h1>{d.title}</h1>
      <p className="lead">{d.focus}</p>
      <div className="bar"><div style={{ width: `${(doneCore / core.length) * 100}%` }} /></div>
      <p className="muted small">ליבה: {m.core} דק' ({doneCore}/{core.length}) · רשות: {m.extra} דק'</p>
      <h3 className="section-title">ליבה</h3>
      {core.map((b) => <BlockCard key={b.id} day={n} b={b} />)}
      {extra.length > 0 && (
        <>
          <h3 className="section-title">שעה נוספת (רשות)</h3>
          {extra.map((b) => <BlockCard key={b.id} day={n} b={b} />)}
        </>
      )}
      {doneCore === core.length && <div className="feedback right"><div className="fb-title">🎉 הליבה של היום הושלמה!</div></div>}
      <div className="row">
        {n > 1 && <button className="btn ghost" onClick={() => go('plan/' + (n - 1))}>→ יום {n - 1}</button>}
        {n < PLAN.length && <button className="btn ghost" onClick={() => go('plan/' + (n + 1))}>יום {n + 1} ←</button>}
      </div>
    </div>
  );
}
