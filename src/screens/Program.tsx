import { useState } from 'react';
import { Blocks } from '../components/Blocks';
import { Recorder, Take } from '../components/Recorder';
import { Timer } from '../components/RhythmTools';
import { rich } from '../components/rich';
import { LESSONS } from '../data/curriculum';
import { GLOSSARY_BY_ID } from '../data/glossary';
import {
  SESSIONS, SESSION_BY_ID, TRACKS, TRACK_BY_ID, programIntro,
  type Exercise, type SessionBlock, type TrackId,
} from '../data/tracks';
import { go } from '../router';
import { useRecordings } from '../state/recordings';
import {
  PASS_DAYS, STAGES, finishSession, logExerciseBpm, passStageTest, placeProgram, setTrackStage, today, useStore, type State,
} from '../state/store';

const WEEK = 7 * 86400000;
const weekKey = () => Math.floor(Date.now() / WEEK);
const stageOf = (s: State, t: TrackId) => s.prog.stage[t];
const trackDone = (s: State, t: TrackId) => stageOf(s, t) > STAGES;

/** The track that most needs work: lowest stage, then fewest BPM entries. */
function weakestTrack(s: State): TrackId {
  const logs = (t: TrackId) => Object.entries(s.prog.bpm).filter(([k]) => k.startsWith(t === 'rhythm' ? 'rh' : t === 'finger' ? 'fi' : t)).reduce((n, [, v]) => n + v.length, 0);
  return [...TRACKS].filter((t) => !trackDone(s, t.id)).sort((a, b) => stageOf(s, a.id) - stageOf(s, b.id) || logs(a.id) - logs(b.id))[0]?.id ?? 'tech';
}

/** Exercises from stages already passed, a different handful each day (mixed review). */
function reviewExercises(s: State, n = 3): { ex: Exercise; track: TrackId }[] {
  const pool = TRACKS.flatMap((t) => t.stages.slice(0, Math.min(stageOf(s, t.id), STAGES + 1) - 1).flatMap((st) => st.exercises.map((ex) => ({ ex, track: t.id }))));
  let seed = [...today()].reduce((h, c) => h * 31 + c.charCodeAt(0), 7);
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  return [...pool].sort(() => rnd() - 0.5).slice(0, n);
}

/* ───────── Small pieces ───────── */

function BpmLog({ ex }: { ex: Exercise }) {
  const s = useStore();
  const log = s.prog.bpm[ex.id] ?? [];
  const [val, setVal] = useState(String(log[log.length - 1] ?? ex.bpm!.start));
  const changes = ex.bpm!.unit === 'changes';
  return (
    <div className="bpm-log">
      <span className="small">{changes ? `🎯 מעברים נקיים בדקה – יעד ${ex.bpm!.target}:` : `🎯 BPM: התחלה ${ex.bpm!.start} · יעד ${ex.bpm!.target}. לאן הגעת נקי?`}</span>
      <div className="row tight">
        <input type="number" inputMode="numeric" min={1} max={240} value={val} onChange={(e) => setVal(e.target.value)} aria-label="המספר שהגעתי אליו" />
        <button className="btn small" onClick={() => { const n = Number(val); if (n >= 1 && n <= 240) logExerciseBpm(ex.id, n); }}>רשום</button>
      </div>
      {log.length > 0 && <div className="muted small" dir="ltr">{log.slice(-6).join(' → ')}</div>}
    </div>
  );
}

function ExerciseCard({ ex, label, open: initial = false }: { ex: Exercise; label?: string; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="plan-block">
      <div className="pb-head">
        <button className="pb-title" onClick={() => setOpen(!open)}>
          {label && <span className="pb-kind">{label}</span>}
          <span className="pb-name">{ex.title}</span>
        </button>
        <button className="pb-toggle" onClick={() => setOpen(!open)} aria-label="פתח">{open ? '▴' : '▾'}</button>
      </div>
      {open && (
        <div className="pb-body">
          <ol className="pb-steps">{ex.steps.map((st, i) => <li key={i}>{rich(st)}</li>)}</ol>
          {ex.content && <Blocks blocks={ex.content} />}
          {ex.bpm && <BpmLog ex={ex} />}
        </div>
      )}
    </div>
  );
}

function StageTest({ track }: { track: TrackId }) {
  const s = useStore();
  const n = stageOf(s, track);
  const stage = TRACK_BY_ID[track].stages[n - 1];
  const [msg, setMsg] = useState('');
  if (!stage) return null;
  const dates = s.prog.passes[`${track}:${n}`] ?? [];
  const passedToday = dates.includes(today());
  return (
    <div className="test-card">
      <div className="small"><b>🏁 מבחן השלב</b> · צריך לעבור ב-{PASS_DAYS} ימים שונים ({dates.length}/{PASS_DAYS})</div>
      <p>{rich(stage.test)}</p>
      {passedToday
        ? <p className="small ok-text">✓ עברת היום. {dates.length < PASS_DAYS ? 'נסה שוב מחר – אם זה עדיין יושב, השלב מאחוריך.' : ''}</p>
        : <button className="btn primary wide" onClick={() => setMsg(passStageTest(track) ? `🎉 שלב ${n} הושלם! עוברים לשלב ${n + 1}.` : '✓ נרשם. עוד יום אחד ועברת את השלב.')}>עברתי את המבחן היום</button>}
      {msg && <p className="small ok-text">{msg}</p>}
    </div>
  );
}

/** Current stage of a track: goal, exercises, test. */
function StagePanel({ track, min }: { track: TrackId; min?: number }) {
  const s = useStore();
  const t = TRACK_BY_ID[track];
  const n = stageOf(s, track);
  if (n > STAGES) {
    const last = t.stages[STAGES - 1];
    return (
      <>
        <p className="small">🏆 סיימת את כל שלבי המסלול. מתחזקים: תרגילי השלב האחרון במהירות היעד.</p>
        {last.exercises.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
      </>
    );
  }
  const stage = t.stages[n - 1];
  const each = min ? Math.max(5, Math.floor(min / stage.exercises.length)) : undefined;
  return (
    <>
      <p className="small"><b>שלב {n}/{STAGES}: {stage.title}</b> – {stage.goal}</p>
      {stage.exercises.map((ex, i) => <ExerciseCard key={ex.id} ex={ex} label={each ? `כ-${each} דק'` : undefined} open={i === 0} />)}
      <StageTest track={track} />
    </>
  );
}

/* ───────── Session ───────── */

function nextTheoryLesson(s: State) {
  return LESSONS.find((l) => l.domain === 'theory' && l.pages && !s.lessons[l.id]?.passed);
}

function BlockView({ b, sessionId }: { b: SessionBlock; sessionId: string }) {
  const s = useStore();
  const recs = useRecordings();
  const head = (icon: string, title: string, sub?: string) => (
    <div className="sb-head"><h3>{icon} {title}</h3><span className="muted small">{b.min} דק'{sub ? ` · ${sub}` : ''}</span></div>
  );
  let body: React.ReactNode;
  if (b.kind === 'warm') {
    const st = TRACK_BY_ID.tech.stages[0];
    body = <>{head('🔥', 'חימום')}<p className="small">2 דקות מתיחות עדינות לאצבעות ולפרק כף היד, ואז תרגיל אחד – לאט ונקי.</p><ExerciseCard ex={st.exercises[stageOf(s, 'tech') % 2]} /></>;
  } else if (b.kind === 'track' || b.kind === 'weak') {
    const track = b.kind === 'track' ? b.track : weakestTrack(s);
    const t = TRACK_BY_ID[track];
    body = <>{head(t.icon, t.title, b.kind === 'weak' ? 'המסלול שהכי צריך חיזוק עכשיו' : undefined)}<StagePanel track={track} min={b.min} /></>;
  } else if (b.kind === 'review') {
    const list = reviewExercises(s);
    body = (
      <>
        {head('🔁', 'חזרה מעורבת')}
        <p className="small">תרגילים משלבים שכבר עברת, מעורבבים – 5 דקות לכל אחד, במהירות היעד. ערבוב כזה מחזק את הזיכרון לטווח ארוך.</p>
        {list.length ? list.map(({ ex, track }) => <ExerciseCard key={ex.id} ex={ex} label={TRACK_BY_ID[track].title} />)
          : <p className="muted small">עוד לא עברת שלבים. בינתיים: 5 דקות מכל מסלול על התרגיל הראשון של השלב הנוכחי.</p>}
      </>
    );
  } else if (b.kind === 'theory') {
    const l = nextTheoryLesson(s);
    body = (
      <>
        {head('📖', 'תיאוריה ושמיעה')}
        <p className="small">השיעור הבא בקורס התיאוריה, ואז כמה דקות של תרגול חכם.</p>
        <Blocks blocks={[{ t: 'go', items: [...(l ? [{ label: `שיעור: ${l.title}`, to: 'lesson/' + l.id }] : []), { label: 'תרגול חכם', to: 'practice' }] }]} />
      </>
    );
  } else {
    const due = !recs.length || Date.now() - recs[recs.length - 1].created > WEEK;
    body = (
      <>
        {head('🎧', 'נגינה חופשית')}
        <p className="small">בלי מטרונום ובלי מבחנים: שירים שאתה אוהב, ג'אם על לופ, אלתור, או סתם לנגן. זה החלק שמזכיר למה מנגנים.</p>
        {sessionId === 'C' && due && (
          <>
            <p className="small"><b>🎙️ הקלטה שבועית:</b> הקלט דקה מכל מסלול – התרגיל של השלב הנוכחי. בעוד שבוע תשמע את ההבדל.</p>
            <Recorder day={weekKey()} />
          </>
        )}
      </>
    );
  }
  return (
    <section className="session-block">
      {body}
      <Timer minutes={b.min} />
    </section>
  );
}

export function SessionView({ id }: { id: string }) {
  const s = useStore();
  const session = SESSION_BY_ID[id];
  const [done, setDone] = useState(false);
  if (!session) return <div className="screen"><p>לא נמצא</p></div>;
  const total = session.blocks.reduce((n, b) => n + b.min, 0);
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>{session.title}</h1>
      <p className="muted small">{total} דקות · {session.desc}</p>
      {session.blocks.map((b, i) => <BlockView key={i} b={b} sessionId={id} />)}
      {done || (s.prog.sessions[today()] ?? []).includes(id)
        ? <div className="feedback right"><div className="fb-title">🎉 השעה נרשמה. כל הכבוד!</div></div>
        : <button className="btn primary wide big" onClick={() => { finishSession(id); setDone(true); }}>✓ סיימתי את השעה</button>}
    </div>
  );
}

/* ───────── Program home ───────── */

export function ProgramHome() {
  const s = useStore();
  if (!s.prog.placed) {
    return (
      <div className="screen">
        <h1>🎸 תוכנית גיטרה</h1>
        <Blocks blocks={programIntro} />
        <button className="cta" onClick={() => go('plan/placement')}>
          <span className="cta-icon">🧭</span>
          <span><b>מבחן מיקום (כ-20 דקות)</b><br /><small>נבדוק מאיפה להתחיל בכל מסלול</small></span>
        </button>
        <button className="btn ghost wide" onClick={() => placeProgram({ tech: 1, rhythm: 1, neck: 1, finger: 1 })}>דלג – התחל משלב 1 בכל המסלולים</button>
      </div>
    );
  }
  const doneToday = s.prog.sessions[today()] ?? [];
  return (
    <div className="screen">
      <h1>🎸 תוכנית גיטרה</h1>
      <h3 className="section-title">התרגול של היום</h3>
      <p className="muted small">כל שעה עומדת בפני עצמה – אפשר אחת עכשיו ואחת בערב. היום: {doneToday.length ? `${doneToday.length} שעות ✓` : 'עוד לא התחלת'}.</p>
      {SESSIONS.map((ss) => (
        <button key={ss.id} className={`lesson-row ${doneToday.includes(ss.id) ? 'passed' : 'open'}`} onClick={() => go('plan/s/' + ss.id)}>
          <span className="lr-badge">{doneToday.includes(ss.id) ? '✓' : '▶'}</span>
          <span className="lr-title">{ss.title}<br /><small className="muted">{ss.desc}</small></span>
          <span className="lr-meta small muted">{ss.blocks.reduce((n, b) => n + b.min, 0)} דק'</span>
        </button>
      ))}
      <h3 className="section-title">המסלולים</h3>
      <div className="track-grid">
        {TRACKS.map((t) => {
          const n = stageOf(s, t.id);
          return (
            <button key={t.id} className="track-card" onClick={() => go('plan/t/' + t.id)}>
              <span className="tc-icon">{t.icon}</span>
              <b>{t.title}</b>
              <small className="muted">{n > STAGES ? 'הושלם 🏆' : `שלב ${n}: ${t.stages[n - 1].title}`}</small>
              <div className="bar"><div style={{ width: `${(Math.min(n - 1, STAGES) / STAGES) * 100}%` }} /></div>
            </button>
          );
        })}
      </div>
      <div className="row">
        <button className="btn ghost" onClick={() => go('plan/progress')}>📈 ההתקדמות שלי</button>
        <button className="btn ghost" onClick={() => go('songs/romanza')}>🎼 Romanza</button>
      </div>
      <details className="plan-intro"><summary>איך התוכנית עובדת</summary><Blocks blocks={programIntro} /></details>
    </div>
  );
}

/* ───────── One track: all stages ───────── */

export function TrackView({ id }: { id: TrackId }) {
  const s = useStore();
  const t = TRACK_BY_ID[id];
  const [peek, setPeek] = useState<number | null>(null);
  if (!t) return <div className="screen"><p>לא נמצא</p></div>;
  const n = stageOf(s, id);
  const help = GLOSSARY_BY_ID[t.help];
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>{t.icon} {t.title}</h1>
      <p className="lead">{t.desc}</p>
      {help && <button className="link small" onClick={() => go('glossary/' + t.help)}>📖 {help.title}</button>}
      {t.stages.map((st, i) => {
        const k = i + 1;
        const state = k < n ? 'passed' : k === n ? 'open' : '';
        return (
          <section key={k} className={`unit stage ${state}`}>
            <h3>{k < n ? '✓' : k === n ? '▶' : k} שלב {k}: {st.title}</h3>
            <p className="small muted">{st.goal}</p>
            {k === n ? <StagePanel track={id} />
              : peek === k ? (
                <>
                  {st.exercises.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
                  <p className="small"><b>🏁 מבחן:</b> {rich(st.test)}</p>
                  <button className="btn small ghost" onClick={() => { if (confirm(`לקבוע את שלב ${k} כשלב הנוכחי?`)) setTrackStage(id, k); }}>קבע כשלב הנוכחי</button>
                </>
              ) : <button className="link small" onClick={() => setPeek(k)}>הצג את השלב</button>}
          </section>
        );
      })}
    </div>
  );
}

/* ───────── Placement ───────── */

export function PlacementView() {
  const [ti, setTi] = useState(0);
  const [k, setK] = useState(1);
  const [result, setResult] = useState<Partial<Record<TrackId, number>>>({});
  const t = TRACKS[ti];
  const finishTrack = (stage: number) => {
    setResult({ ...result, [t.id]: stage });
    setTi(ti + 1);
    setK(1);
  };
  if (!t) {
    const r = result as Record<TrackId, number>;
    return (
      <div className="screen">
        <h1>🧭 תוצאות המבחן</h1>
        {TRACKS.map((tr) => (
          <div key={tr.id} className="lesson-row passed">
            <span className="lr-badge">{tr.icon}</span>
            <span className="lr-title">{tr.title}<br /><small className="muted">{r[tr.id] > STAGES ? 'עברת את כל השלבים' : `מתחילים בשלב ${r[tr.id]}: ${tr.stages[r[tr.id] - 1].title}`}</small></span>
          </div>
        ))}
        <button className="btn primary wide big" onClick={() => { placeProgram(r); go('plan'); }}>להתחיל לתרגל</button>
      </div>
    );
  }
  const stage = t.stages[k - 1];
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ חזרה</button>
      <p className="muted small">מבחן מיקום · מסלול {ti + 1} מתוך {TRACKS.length}</p>
      <h1>{t.icon} {t.title}</h1>
      <p className="small">נסה את המבחן של שלב {k}. אפשר להתחמם עם התרגיל לפני – אבל לא יותר מ-3 ניסיונות. היה כנה: "כמעט" = עוד לא.</p>
      <div className="test-card">
        <div className="small"><b>שלב {k}: {stage.title}</b></div>
        <p>{rich(stage.test)}</p>
      </div>
      <ExerciseCard key={stage.exercises[0].id} ex={stage.exercises[0]} open />
      <div className="row">
        <button className="btn ghost" onClick={() => finishTrack(k)}>עוד לא</button>
        <button className="btn primary" onClick={() => (k >= STAGES ? finishTrack(STAGES + 1) : setK(k + 1))}>עברתי ✓</button>
      </div>
    </div>
  );
}

/* ───────── Progress ───────── */

export function ProgressView() {
  const s = useStore();
  const recs = useRecordings();
  const days = Object.keys(s.prog.sessions).length;
  const hours = Object.values(s.prog.sessions).flat().reduce((n, id) => n + (SESSION_BY_ID[id]?.blocks.reduce((m, b) => m + b.min, 0) ?? 0), 0) / 60;
  const exercises = TRACKS.flatMap((t) => t.stages.flatMap((st, i) => st.exercises.filter((ex) => ex.bpm && s.prog.bpm[ex.id]?.length).map((ex) => ({ t, i, ex, log: s.prog.bpm[ex.id] }))));
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>📈 ההתקדמות שלי</h1>
      <div className="stats">
        <div><b>{days}</b><small>ימי תרגול</small></div>
        <div><b>{Math.round(hours * 10) / 10}</b><small>שעות</small></div>
        <div><b>{TRACKS.reduce((n, t) => n + Math.min(stageOf(s, t.id) - 1, STAGES), 0)}</b><small>שלבים מתוך {TRACKS.length * STAGES}</small></div>
      </div>
      <h3 className="section-title">שלבים</h3>
      {TRACKS.map((t) => (
        <div key={t.id} className="prog-track">
          <span>{t.icon} {t.title}</span>
          <div className="stage-dots">{t.stages.map((_, i) => <span key={i} className={i + 1 < stageOf(s, t.id) ? 'done' : i + 1 === stageOf(s, t.id) ? 'on' : ''} />)}</div>
        </div>
      ))}
      <h3 className="section-title">מהירות (BPM)</h3>
      {exercises.length === 0 ? <p className="muted small">עוד אין רישומים. בכל תרגיל יש יומן BPM בתחתית.</p> : (
        <table className="prog-table">
          <thead><tr><th>תרגיל</th><th>ראשון</th><th>אחרון</th><th>יעד</th></tr></thead>
          <tbody>
            {exercises.map(({ t, i, ex, log }) => (
              <tr key={ex.id} className={log[log.length - 1] >= ex.bpm!.target ? 'hit' : ''}>
                <td>{t.icon} {ex.title} <small className="muted">(שלב {i + 1})</small></td>
                <td>{log[0]}</td><td><b>{log[log.length - 1]}</b></td><td>{ex.bpm!.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="section-title">הקלטות</h3>
      <p className="small">ההקלטה השבועית נמצאת בסוף "שעה של חזרה" (פעם בשבוע). כאן אפשר להקשיב לכולן לפי הסדר.</p>
      {recs.length === 0 ? <p className="muted small">עוד אין הקלטות.</p> : recs.map((r) => <Take key={r.id} r={r} />)}
      <details className="plan-intro"><summary>הקלטה עכשיו</summary><Recorder day={weekKey()} /></details>
    </div>
  );
}
