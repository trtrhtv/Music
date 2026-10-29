import { useState } from 'react';
import { Blocks } from '../components/Blocks';
import { Timer } from '../components/RhythmTools';
import { rich } from '../components/rich';
import { DAILY, DAILY_INTRO, itemFor, type DailyCat } from '../data/daily';
import { go } from '../router';
import {
  dailyBase, dailySetsToday, markDailySeen, setDailyLevel, startNextDailySet, today, toggleDailyCheck, useStore,
} from '../state/store';

const HOURS: { hour: 1 | 2; title: string }[] = [
  { hour: 1, title: 'שעה 1 · הבסיס' },
  { hour: 2, title: 'שעה 2 · נגינה' },
];
const minutes = (hour: 1 | 2) => DAILY.filter((c) => c.hour === hour).reduce((n, c) => n + c.min, 0);

/** One line of the list: what to play today in this category, with everything needed to do it. */
function DailyRow({ cat, set, day }: { cat: DailyCat; set: number; day: number }) {
  const s = useStore();
  const level = Math.min(s.daily.level[cat.id] ?? 0, cat.levels.length - 1);
  const item = itemFor(cat, level, day);
  const done = (s.daily.checks[today()] ?? []).includes(`${set}:${cat.id}`);
  const seen = s.daily.seen.includes(item.id);
  const [open, setOpen] = useState(false);
  const [moved, setMoved] = useState('');
  const check = () => { toggleDailyCheck(set, cat.id); markDailySeen(item.id); if (!done) setOpen(false); };
  const next = cat.levels[level + 1];
  return (
    <div className={`daily-row ${done ? 'done' : ''}`}>
      <div className="dr-head">
        <button className="dr-check" onClick={check} aria-label={done ? 'בטל סימון' : 'סמן שסיימתי'}>{done ? '✓' : ''}</button>
        <button className="dr-main" onClick={() => setOpen(!open)}>
          <span className="dr-cat">{cat.icon} {cat.title} · {cat.min} דק'</span>
          <span className="dr-title">{rich(item.title)}</span>
        </button>
        <button className="pb-toggle" onClick={() => setOpen(!open)} aria-label="פתח">{open ? '▴' : '▾'}</button>
      </div>
      {open && (
        <div className="dr-body">
          {item.first && (
            <details className="basics" open={!seen}>
              <summary>📘 {seen ? 'הסבר מאפס' : 'פעם ראשונה? מה צריך לדעת'}</summary>
              <ul>{item.first.map((t, i) => <li key={i}>{rich(t)}</li>)}</ul>
            </details>
          )}
          <ol className="pb-steps">{item.how.map((t, i) => <li key={i}>{rich(t)}</li>)}</ol>
          {item.content && <Blocks blocks={item.content} />}
          <Timer minutes={cat.min} />
          <div className="row wrap tight dr-actions">
            <button className="btn small primary" onClick={check}>{done ? 'בטל ✓' : '✓ סיימתי'}</button>
            {next && <button className="btn small ghost" onClick={() => { setDailyLevel(cat.id, level + 1); setMoved(`עברת ל: ${next.name}. מחר תתחיל משם.`); }}>קל לי ← הבא</button>}
            {level > 0 && <button className="btn small ghost" onClick={() => { setDailyLevel(cat.id, level - 1); setMoved(`חזרת ל: ${cat.levels[level - 1].name}.`); }}>→ רמה קודמת</button>}
          </div>
          {moved && <p className="small ok-text">{moved}</p>}
          <p className="small muted">רמה {level + 1}/{cat.levels.length}: {cat.levels[level].name}. {cat.why}</p>
        </div>
      )}
    </div>
  );
}

function DailyList({ set, day }: { set: number; day: number }) {
  return (
    <>
      {HOURS.map(({ hour, title }) => (
        <section key={hour}>
          <h3 className="section-title">{title} <small className="muted">({minutes(hour)} דק')</small></h3>
          {DAILY.filter((c) => c.hour === hour).map((c) => <DailyRow key={c.id} cat={c} set={set} day={day} />)}
        </section>
      ))}
    </>
  );
}

export function DailyView() {
  const s = useStore();
  const base = dailyBase(s);
  const sets = dailySetsToday(s);
  const checks = s.daily.checks[today()] ?? [];
  const doneIn = (set: number) => DAILY.filter((c) => checks.includes(`${set}:${c.id}`)).length;
  const lastDone = doneIn(sets - 1) === DAILY.length;
  return (
    <div className="screen">
      <h1>🎸 התרגול של היום</h1>
      <p className="muted small">יום תרגול {base + 1} · {doneIn(0)}/{DAILY.length} הושלמו · כשעתיים</p>
      <details className="plan-intro"><summary>איך זה עובד</summary><Blocks blocks={DAILY_INTRO} /></details>

      <DailyList set={0} day={base} />

      {Array.from({ length: sets - 1 }, (_, k) => (
        <section key={k}>
          <h2 className="section-title">➕ תרגילי יום {base + k + 2} – כבר היום</h2>
          <DailyList set={k + 1} day={base + k + 1} />
        </section>
      ))}

      <section className="hour3">
        <h3 className="section-title">שעה 3 · אם יש זמן</h3>
        {lastDone && <p className="ok-text">🎉 סיימת את הרשימה! רוצה להמשיך?</p>}
        <button className="btn primary wide" onClick={startNextDailySet}>➕ להתחיל את תרגילי יום {base + sets + 1} עכשיו</button>
        <p className="small muted">או: להרחיב את מה שהכי צריך היום · שיעור תיאוריה · נגינה חופשית.</p>
        <div className="row wrap tight">
          <button className="btn small ghost" onClick={() => go('track/theory')}>📖 קורס התיאוריה</button>
          <button className="btn small ghost" onClick={() => go('songs/romanza')}>🎼 Romanza</button>
        </div>
      </section>

      <div className="row wrap tight">
        <button className="btn ghost" onClick={() => go('plan/progress')}>📈 ההתקדמות שלי</button>
        <button className="btn ghost" onClick={() => go('plan')}>🧭 התוכנית המפורטת (מסלולים ושלבים)</button>
      </div>
    </div>
  );
}
