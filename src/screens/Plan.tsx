import { useState } from 'react';
import { Blocks } from '../components/Blocks';
import { rich } from '../components/rich';
import { Timer } from '../components/RhythmTools';
import { CHECKPOINT, KIND_META, PLAN, WEEK_TITLES, dayMinutes, planIntro, type PlanBlock } from '../data/plan';
import { SONG_BY_ID } from '../data/songs';
import { go } from '../router';
import { RATE_LABELS, coreDone, currentDay, doneCount, weakestSongs } from '../state/planProgress';
import { logPlanBpm, planKey, ratePlanSong, togglePlanBlock, useStore } from '../state/store';

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
      <div className="row">
        <button className="btn ghost" onClick={() => go('songs')}>🎵 השירים והיצירות</button>
        <button className="btn ghost" onClick={() => go('plan/progress')}>📈 ההתקדמות שלי</button>
      </div>
      <details className="plan-intro"><summary>איך עובדים עם התוכנית</summary><Blocks blocks={planIntro} /></details>
      {[1, 2, 3].map((w) => (
        <section key={w} className="unit">
          <h3>שבוע {w} · {WEEK_TITLES[w]}</h3>
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
      <span className="small">{block.bpm!.unit === 'changes'
        ? <>🎯 מעברים נקיים בדקה – כוון ל-{block.bpm!.target}. רשום את המספר שלך:</>
        : <>🎯 BPM (מהירות): התחלה {block.bpm!.start} · יעד {block.bpm!.target}. רשום לאן הגעת נקי:</>}</span>
      <div className="row tight">
        <input type="number" inputMode="numeric" min={1} max={240} value={val} onChange={(e) => setVal(e.target.value)} aria-label="המספר שהגעתי אליו" />
        <button className="btn small" onClick={() => { const n = Number(val); if (n >= 1 && n <= 240) logPlanBpm(day, block.id, n); }}>רשום</button>
      </div>
      {log.length > 0 && <div className="muted small" dir="ltr">{log.slice(-6).join(' → ')}</div>}
    </div>
  );
}

function RateSongs({ day, songs }: { day: number; songs: string[] }) {
  const s = useStore();
  return (
    <div className="rate-box">
      <div className="small"><b>ציון לכל שיר:</b> איך הוא יושב עכשיו?</div>
      {songs.map((id) => {
        const cur = s.plan.rate[planKey(day, id)];
        return (
          <div key={id} className="rate-row">
            <button className="rate-name" onClick={() => go('songs/' + id)}>{SONG_BY_ID[id].title}</button>
            <div className="rate-opts">
              {RATE_LABELS.map((l, i) => (
                <button key={i} className={`chip small ${cur === i ? 'on' : ''}`} onClick={() => ratePlanSong(day, id, i)}>{l}</button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PolishPick() {
  const s = useStore();
  const weak = weakestSongs(s);
  if (!weak.length) return <p className="muted small">עוד לא נתת ציונים ביום {CHECKPOINT}. <button className="link" onClick={() => go('plan/' + CHECKPOINT)}>לטבלת הציונים</button></p>;
  return (
    <div className="b-see">
      <span className="small">הכי צריכים ליטוש:</span>
      {weak.map((id) => <button key={id} className="chip" onClick={() => go('songs/' + id)}>🎵 {SONG_BY_ID[id].title}</button>)}
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
          {b.polish && <PolishPick />}
          {b.content && <Blocks blocks={b.content} />}
          {b.rate && <RateSongs day={day} songs={b.rate} />}
          {b.bpm && <BpmLog day={day} block={b} />}
          {meta.help && <button className="link small help-link" onClick={() => go('glossary/' + meta.help)}>📖 מילה לא ברורה? הסבר על {meta.label}</button>}
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

export function PlanProgress() {
  const s = useStore();
  const days = PLAN.filter((d) => coreDone(s, d)).length;
  const blocks = PLAN.flatMap((d) => d.blocks.map((b) => ({ d, b }))).filter(({ d, b }) => s.plan.done[planKey(d.n, b.id)]);
  const minutes = blocks.reduce((t, x) => t + x.b.min, 0);
  const rateDays = PLAN.filter((d) => d.blocks.some((b) => b.rate)).map((d) => d.n);
  const rated = [...new Set(PLAN.flatMap((d) => d.blocks.flatMap((b) => b.rate ?? [])))];
  const logs = PLAN.flatMap((d) => d.blocks.filter((b) => b.bpm && s.plan.bpm[planKey(d.n, b.id)]?.length).map((b) => ({ d, b, log: s.plan.bpm[planKey(d.n, b.id)] })));
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לתוכנית</button>
      <h1>📈 ההתקדמות שלי</h1>
      <div className="stats">
        <div><b>{days}</b><small>ימים הושלמו מתוך {PLAN.length}</small></div>
        <div><b>{blocks.length}</b><small>בלוקים</small></div>
        <div><b>{Math.round(minutes / 6) / 10}</b><small>שעות תרגול</small></div>
      </div>

      <h3 className="section-title">ציונים לשירים</h3>
      <p className="muted small">הציונים שנתת בימי הבדיקה. 0 = עוד לא, 3 = נקי ובטוח.</p>
      <table className="prog-table">
        <thead><tr><th>שיר</th>{rateDays.map((n) => <th key={n}>יום {n}</th>)}</tr></thead>
        <tbody>
          {rated.map((id) => (
            <tr key={id}>
              <td>{SONG_BY_ID[id].title}</td>
              {rateDays.map((n) => {
                const r = s.plan.rate[planKey(n, id)];
                return <td key={n} title={r === undefined ? '' : RATE_LABELS[r]}>{r === undefined ? '—' : '★'.repeat(r) + '☆'.repeat(3 - r)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="section-title">מהירות (BPM) ומעברים</h3>
      {logs.length === 0 ? <p className="muted small">עוד אין רישומים. בבלוקים טכניים יש יומן בתחתית – רושמים שם לאן הגעת.</p> : (
        <table className="prog-table">
          <thead><tr><th>תרגיל</th><th>ראשון</th><th>אחרון</th><th>יעד</th></tr></thead>
          <tbody>
            {logs.map(({ d, b, log }) => (
              <tr key={d.n + b.id} className={log[log.length - 1] >= b.bpm!.target ? 'hit' : ''}>
                <td><button className="link" onClick={() => go('plan/' + d.n)}>יום {d.n}</button> · {b.title || KIND_META[b.kind].label}{b.bpm!.unit === 'changes' ? ' (מעברים)' : ''}</td>
                <td>{log[0]}</td><td><b>{log[log.length - 1]}</b></td><td>{b.bpm!.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="section-title">ההקלטות</h3>
      <p className="small">ההקלטות נשמרות בטלפון שלך, לא באפליקציה. ההשוואה הכי חשובה: <b>יום 1 מול יום {CHECKPOINT} מול יום {PLAN.length}</b> – אותם תרגילים, ברצף.</p>
    </div>
  );
}
