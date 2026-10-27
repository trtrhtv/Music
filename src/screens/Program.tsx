import { useEffect, useState } from 'react';
import { Blocks } from '../components/Blocks';
import { Recorder, Take } from '../components/Recorder';
import { Timer } from '../components/RhythmTools';
import { TimingCheck } from '../components/TimingCheck';
import { NoteCheck } from '../components/NoteCheck';
import { REVIEW_SIZE, useDueReviews } from '../state/reviewDue';
import { parseTab } from '../audio/tabPlayer';
import { rich } from '../components/rich';
import { LESSONS } from '../data/curriculum';
import { GLOSSARY_BY_ID } from '../data/glossary';
import {
  EXERCISE_HOME, SESSIONS, SESSION_BY_ID, TRACKS, TRACK_BY_ID, hoursText, nextSession, programIntro, sessionMinutes,
  type Exercise, type SessionBlock, type TrackId,
} from '../data/tracks';
import { go } from '../router';
import { useRecordings } from '../state/recordings';
import { HeardCtx } from '../state/heardContext';
import { ACTIONABLE, adviceAll, type Advice } from '../engine/coach';
import {
  PASS_DAYS, STAGES, finishSession, logExerciseBpm, markCoachSeen, passStageTest, placeProgram, setTrackStage, setTrackTempo, today, unpassStageTest, useStore, type State,
} from '../state/store';

const WEEK = 7 * 86400000;
/** Same number all day, changes every day – picks the daily variation. */
const dayIndex = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
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

/** What to aim for next time, from the last logged value. */
function nextHint(last: number, ex: Exercise) {
  const { target, unit } = ex.bpm!;
  if (last >= target) return '🎯 הגעת ליעד! עכשיו: לנגן את זה רגוע ונקי גם ביום אחר.';
  const next = Math.min(target, last + (unit === 'changes' ? 2 : 5));
  return unit === 'changes' ? `בפעם הבאה: נסה ${next} מעברים בדקה.` : `בפעם הבאה: חימום ב-${last}, ואז נסה ${next}. לא נקי? חזור ל-${last}.`;
}

function BpmLog({ ex }: { ex: Exercise }) {
  const s = useStore();
  const home = EXERCISE_HOME[ex.id];
  const tempo = home && s.prog.tempo[home.track];
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
      {log.length > 0 && <div className="small">{nextHint(log[log.length - 1], ex)}</div>}
      {tempo && !changes && (
        <div className="small coach-tempo">🎧 לפי מה ששמעתי: השבוע עבוד במסלול הזה סביב <b>{tempo} BPM</b>, ועלה 5 כשזה נקי פעמיים. <button className="link" onClick={() => setTrackTempo(home!.track, undefined)}>בטל</button></div>
      )}
    </div>
  );
}

/** Mic timing check inside an exercise, at the tempo being practised. */
function ExerciseTiming({ ex }: { ex: Exercise }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const home = EXERCISE_HOME[ex.id];
  const sub = home && TRACK_BY_ID[home.track].stages[home.stage - 1].timing?.sub;
  if (!ex.bpm || ex.bpm.unit === 'changes' || !sub) return null;
  const log = s.prog.bpm[ex.id] ?? [];
  const bpm = s.prog.tempo[home.track] ?? log[log.length - 1] ?? ex.bpm.start;
  return open ? <TimingCheck bpm={bpm} sub={sub} bars={4} />
    : <button className="btn small ghost" onClick={() => setOpen(true)}>🎤 בדיקת קצב ב-{bpm} BPM (4 תיבות)</button>;
}

function ExerciseCard({ ex, label, open: initial = false }: { ex: Exercise; label?: string; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  const home = EXERCISE_HOME[ex.id];
  return (
    <HeardCtx.Provider value={home ? { ...home, ex: ex.id } : null}>
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
          {(ex.basics || ex.learn) && (
            <details className="basics" open>
              <summary>📘 מה צריך לדעת לפני</summary>
              {ex.basics && <ul>{ex.basics.map((t, i) => <li key={i}>{rich(t)}</li>)}</ul>}
              {ex.learn && <Blocks blocks={[{ t: 'go', items: ex.learn }]} />}
            </details>
          )}
          <ol className="pb-steps">{ex.steps.map((st, i) => <li key={i}>{rich(st)}</li>)}</ol>
          {ex.vary && <p className="vary small">🔄 <b>הווריאציה של היום:</b> {rich(ex.vary[dayIndex() % ex.vary.length])}</p>}
          {ex.content && <Blocks blocks={ex.content} />}
          {ex.bpm && <BpmLog ex={ex} />}
          <ExerciseTiming ex={ex} />
        </div>
      )}
    </div>
    </HeardCtx.Provider>
  );
}

/** Mic check that the stage test's notes are right, in the order they are played. */
function StageNoteCheck({ tabs }: { tabs: string[][] }) {
  const [open, setOpen] = useState(false);
  const notes = tabs.flatMap((t) => parseTab(t).map((e) => e[0]));
  return open ? <NoteCheck notes={notes} onClose={() => setOpen(false)} />
    : <button className="btn small ghost" onClick={() => setOpen(true)}>🎯 בדיקת תווים במיקרופון ({notes.length} תווים)</button>;
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
    <HeardCtx.Provider value={{ track, stage: n }}>
    <div className="test-card">
      <div className="small"><b>🏁 מבחן השלב</b> · צריך לעבור ב-{PASS_DAYS} ימים שונים ({dates.length}/{PASS_DAYS})</div>
      <p>{rich(stage.test)}</p>
      {stage.timing && <TimingCheck key={`${track}${n}`} bpm={stage.timing.bpm} sub={stage.timing.sub} />}
      {stage.check && <StageNoteCheck key={`c${track}${n}`} tabs={stage.check} />}
      {passedToday
        ? <p className="small ok-text">✓ עברת היום. {dates.length < PASS_DAYS ? 'נסה שוב מחר – אם זה עדיין יושב, השלב מאחוריך.' : ''} <button className="link" onClick={() => { unpassStageTest(track); setMsg(''); }}>בטל</button></p>
        : <button className="btn primary wide" onClick={() => setMsg(passStageTest(track) ? `🎉 שלב ${n} הושלם! עוברים לשלב ${n + 1}.` : '')}>עברתי את המבחן היום</button>}
      {msg && <p className="small ok-text">{msg} <button className="link" onClick={() => { unpassStageTest(track); setMsg(''); }}>בטל</button></p>}
    </div>
    </HeardCtx.Provider>
  );
}

/** Glossary entries that explain a track's words. */
function HelpLinks({ track }: { track: TrackId }) {
  return (
    <div className="help-links small">
      <span className="muted">📖 מילה לא ברורה?</span>
      {TRACK_BY_ID[track].help.map((h) => <button key={h} className="link" onClick={() => go('glossary/' + h)}>{GLOSSARY_BY_ID[h].title}</button>)}
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
      <HelpLinks track={track} />
    </>
  );
}

/* ───────── Session ───────── */

function nextTheoryLesson(s: State) {
  // In course order (unit by unit), skipping the keyboard lessons while the piano is hidden.
  return LESSONS.filter((l) => l.domain === 'theory' && l.pages && !(l.piano && s.prefs.hidePiano))
    .sort((a, b) => (a.unit ?? 0) - (b.unit ?? 0))
    .find((l) => !s.lessons[l.id]?.passed);
}

function BlockView({ b, sessionId, onTimeUp }: { b: SessionBlock; sessionId: string; onTimeUp?: () => void }) {
  const s = useStore();
  const recs = useRecordings();
  const due = useDueReviews();
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
    const ear = LESSONS.find((x) => x.domain === 'ear' && !x.optional && !s.lessons[x.id]?.passed);
    body = (
      <>
        {head('📖', 'תיאוריה ושמיעה')}
        <p className="small">קודם חזרה קצרה על נושאים שלמדת (אם יש), ואז השיעור הבא בתיאוריה ובשמיעה – לפי הסדר.</p>
        <Blocks blocks={[{ t: 'go', items: [
          ...(due.length ? [{ label: `🔁 חזרה מרווחת (${Math.min(due.length, REVIEW_SIZE)} שאלות)`, to: 'review' }] : []),
          ...(l ? [{ label: `תיאוריה: ${l.title}`, to: 'lesson/' + l.id }] : []),
          ...(ear ? [{ label: `שמיעה: ${ear.title}`, to: 'lesson/' + ear.id }] : []),
          { label: 'תרגילים מהירים', to: 'practice' },
        ] }]} />
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
      <Timer minutes={b.min} onDone={onTimeUp} />
    </section>
  );
}

const MODE_KEY = 'session-mode';
const readMode = (): 'steps' | 'all' => { try { return localStorage.getItem(MODE_KEY) === 'all' ? 'all' : 'steps'; } catch { return 'steps'; } };

export function SessionView({ id }: { id: string }) {
  const s = useStore();
  const session = SESSION_BY_ID[id];
  const [mode, setModeState] = useState(readMode);
  const [step, setStep] = useState(0);
  const [timeUp, setTimeUp] = useState(false);
  const [note, setNote] = useState({ goal: '', good: '', next: '' });
  const [done, setDone] = useState(false);
  if (!session) return <div className="screen"><p>לא נמצא</p></div>;
  const setMode = (m: 'steps' | 'all') => { setModeState(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* storage unavailable */ } };
  const total = session.blocks.reduce((n, b) => n + b.min, 0);
  const already = done || (s.prog.sessions[today()] ?? []).includes(id);
  const lastNext = [...s.prog.journal].reverse().find((j) => j.next)?.next;
  const last = session.blocks.length + 1; // 0 = goal, 1..n = blocks, n+1 = reflection
  const turn = (n: number) => { setStep(n); setTimeUp(false); window.scrollTo(0, 0); };

  const goalCard = (
    <section className="session-block">
      <div className="sb-head"><h3>🎯 מטרה לשעה הזאת</h3><span className="muted small">חצי דקה</span></div>
      {lastNext && <p className="small">מה שרשמת בפעם הקודמת לפעם הבאה: <b>{lastNext}</b></p>}
      <p className="small muted">מטרה אחת, קטנה ומדידה. למשל: "פולק ב-85 נקי", "צורה 2 בלי להסתכל", "תיבות 5–8 של הרומנסה".</p>
      <textarea className="note" rows={2} value={note.goal} onChange={(e) => setNote({ ...note, goal: e.target.value })} placeholder="המטרה שלי עכשיו…" />
    </section>
  );
  const reflectCard = (
    <section className="session-block">
      <div className="sb-head"><h3>📝 רגע לפני שמסיימים</h3><span className="muted small">דקה</span></div>
      {note.goal && <p className="small">המטרה הייתה: <b>{note.goal}</b>. הגעת?</p>}
      <label className="small">מה הלך טוב, ומה היה קשה?</label>
      <textarea className="note" rows={2} value={note.good} onChange={(e) => setNote({ ...note, good: e.target.value })} />
      <label className="small">מה המטרה לפעם הבאה?</label>
      <textarea className="note" rows={2} value={note.next} onChange={(e) => setNote({ ...note, next: e.target.value })} />
      {already
        ? <div className="feedback right"><div className="fb-title">🎉 השעה נרשמה. כל הכבוד!</div></div>
        : <button className="btn primary wide big" onClick={() => { finishSession(id, note); setDone(true); }}>✓ סיימתי את השעה</button>}
    </section>
  );

  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>{session.title}</h1>
      <p className="muted small">{total} דקות · {session.desc}</p>
      <button className="link small" onClick={() => setMode(mode === 'steps' ? 'all' : 'steps')}>{mode === 'steps' ? '📄 להציג הכול בעמוד אחד' : '👣 צעד אחר צעד'}</button>
      {mode === 'all' ? (
        <>
          {goalCard}
          {session.blocks.map((b, i) => <BlockView key={i} b={b} sessionId={id} />)}
          {reflectCard}
        </>
      ) : (
        <>
          <div className="step-dots" aria-hidden>{Array.from({ length: last + 1 }, (_, k) => <span key={k} className={k === step ? 'on' : k < step ? 'done' : ''} />)}</div>
          {step === 0 ? goalCard : step === last ? reflectCard : <BlockView key={step} b={session.blocks[step - 1]} sessionId={id} onTimeUp={() => setTimeUp(true)} />}
          {timeUp && step < last && <p className="small ok-text">⏰ הזמן של החלק הזה נגמר. סיים את מה שאתה באמצעו, ועבור הלאה.</p>}
          <div className="step-nav">
            {step > 0 ? <button className="btn ghost" onClick={() => turn(step - 1)}>→ הקודם</button> : <span />}
            {step < last && <button className="btn primary" onClick={() => turn(step + 1)}>{step === last - 1 ? 'לסיום ←' : step === 0 ? 'מתחילים ←' : 'הבא ←'}</button>}
          </div>
        </>
      )}
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
  const next = nextSession(s.prog.sessions);
  const minToday = sessionMinutes(doneToday);
  return (
    <div className="screen">
      <h1>🎸 תוכנית גיטרה</h1>
      <h3 className="section-title">התרגול של היום</h3>
      <p className="muted small">השעות מתחלפות לפי הסדר – טכניקה ומקצב, צוואר ופינגרסטייל, חזרה ותיאוריה – כך שכל מסלול מקבל את שלו. כל שעה עומדת בפני עצמה: אפשר אחת עכשיו ואחת בערב. היום: {minToday ? `${hoursText(minToday)} ✓` : 'עוד לא התחלת'}.</p>
      {SESSIONS.map((ss) => {
        const done = doneToday.includes(ss.id);
        return (
          <button key={ss.id} className={`lesson-row ${ss.id === next ? 'open next' : done ? 'passed' : ''}`} onClick={() => go('plan/s/' + ss.id)}>
            <span className="lr-badge">{done ? '✓' : '▶'}</span>
            <span className="lr-title">
              {ss.id === next && <span className="next-chip">{done ? 'הבאה בסבב (כבר עשית היום)' : 'מומלץ עכשיו'}</span>}
              {ss.title}<br /><small className="muted">{ss.desc}</small>
            </span>
            <span className="lr-meta small muted">{ss.blocks.reduce((n, b) => n + b.min, 0)} דק'</span>
          </button>
        );
      })}
      <h3 className="section-title">המסלולים</h3>
      <div className="track-grid">
        {TRACKS.map((t) => {
          const n = stageOf(s, t.id);
          return (
            <button key={t.id} className="prog-card" onClick={() => go('plan/t/' + t.id)}>
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
        <button className="btn ghost" onClick={() => go('plan/coach')}>🎧 מה שמעתי</button>
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
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>{t.icon} {t.title}</h1>
      <p className="lead">{t.desc}</p>
      <HelpLinks track={id} />
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
        {stage.timing && <TimingCheck key={`${t.id}${k}`} bpm={stage.timing.bpm} sub={stage.timing.sub} />}
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

/** BPM over time for one exercise: a thin line with the target as a dashed reference. */
function BpmSpark({ log, target }: { log: number[]; target: number }) {
  const W = 120, H = 38, P = 5;
  const lo = Math.min(...log, target) - 5, hi = Math.max(...log, target) + 5;
  const x = (i: number) => (log.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (log.length - 1));
  const y = (v: number) => H - P - ((v - lo) * (H - 2 * P)) / (hi - lo);
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} role="img" aria-label={`BPM: ${log.join(', ')}; יעד ${target}`}>
      <line x1={P} x2={W - P} y1={y(target)} y2={y(target)} className="spark-target" />
      <polyline points={log.map((v, i) => `${x(i)},${y(v)}`).join(' ')} className="spark-line" />
      {log.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === log.length - 1 ? 4 : 2.5} className="spark-dot">
          <title>{`רישום ${i + 1}: ${v}`}</title>
        </circle>
      ))}
    </svg>
  );
}

export function ProgressView() {
  const s = useStore();
  const recs = useRecordings();
  const days = Object.keys(s.prog.sessions).length;
  const hours = sessionMinutes(Object.values(s.prog.sessions).flat()) / 60;
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
          <thead><tr><th>תרגיל</th><th>לאורך זמן</th><th>אחרון</th><th>יעד</th></tr></thead>
          <tbody>
            {exercises.map(({ t, i, ex, log }) => (
              <tr key={ex.id} className={log[log.length - 1] >= ex.bpm!.target ? 'hit' : ''}>
                <td>{t.icon} {ex.title} <small className="muted">(שלב {i + 1})</small></td>
                <td><BpmSpark log={log} target={ex.bpm!.target} /></td><td><b>{log[log.length - 1]}</b><br /><small className="muted">מ-{log[0]}</small></td><td>{ex.bpm!.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="section-title">יומן תרגול</h3>
      {s.prog.journal.length === 0 ? <p className="muted small">בתחילת כל שעה כותבים מטרה, ובסוף – מה הלך ומה הלאה. זה יופיע כאן.</p>
        : [...s.prog.journal].reverse().slice(0, 10).map((j, i) => (
          <div key={i} className="journal-row small">
            <div className="muted">{j.date.split('-').reverse().slice(0, 2).join('.')} · {SESSION_BY_ID[j.session]?.title ?? ''}</div>
            {j.goal && <div>🎯 {j.goal}</div>}
            {j.good && <div>📝 {j.good}</div>}
            {j.next && <div>➡️ {j.next}</div>}
          </div>
        ))}
      <h3 className="section-title">הקלטות</h3>
      <p className="small">ההקלטה השבועית נמצאת בסוף "שעה של חזרה" (פעם בשבוע). כאן אפשר להקשיב לכולן לפי הסדר.</p>
      {recs.length === 0 ? <p className="muted small">עוד אין הקלטות.</p> : recs.map((r) => <Take key={r.id} r={r} />)}
      <details className="plan-intro"><summary>הקלטה עכשיו</summary><Recorder day={weekKey()} /></details>
    </div>
  );
}

/* ───────── What I heard: level suggestions from the mic checks ───────── */

const ADVICE_ICON: Record<Advice['kind'], string> = { more: '👂', keep: '✅', slow: '🐢', down: '↩️', ready: '🏁', up: '🚀' };

function AdviceCard({ a }: { a: Advice }) {
  const s = useStore();
  const t = TRACK_BY_ID[a.track];
  const [done, setDone] = useState('');
  const tempo = s.prog.tempo[a.track];
  return (
    <div className={`advice ${ACTIONABLE.includes(a.kind) ? 'act' : ''}`}>
      <div className="small muted">{t.icon} {t.title} · שלב {a.stage}: {t.stages[a.stage - 1].title}</div>
      <b>{ADVICE_ICON[a.kind]} {a.title}</b>
      <ul className="small">{a.detail.map((d, i) => <li key={i}>{rich(d)}</li>)}</ul>
      {done ? <p className="small ok-text">{done}</p> : (
        <div className="row wrap tight">
          {a.kind === 'slow' && a.bpm && tempo !== a.bpm && <button className="btn small primary" onClick={() => { setTrackTempo(a.track, a.bpm); setDone(`✓ בתרגילי המסלול יופיע עכשיו: עבוד סביב ${a.bpm} BPM.`); }}>האט ל-{a.bpm} BPM</button>}
          {a.kind === 'down' && <button className="btn small primary" onClick={() => { setTrackStage(a.track, a.stage - 1); setDone(`✓ חזרת לשלב ${a.stage - 1}. השלב הנוכחי יחכה לך.`); }}>חזור לשלב {a.stage - 1}</button>}
          {a.kind === 'up' && <button className="btn small primary" onClick={() => { setTrackStage(a.track, a.stage + 1); setDone(`✓ עברת לשלב ${a.stage + 1}.`); }}>עבור לשלב {a.stage + 1}</button>}
          {(a.kind === 'ready' || a.kind === 'up' || a.kind === 'more') && <button className="btn small ghost" onClick={() => go('plan/t/' + a.track)}>{a.kind === 'more' ? 'לתרגילי המסלול' : 'למבחן השלב'}</button>}
        </div>
      )}
      {tempo && a.kind !== 'slow' && <p className="small muted">הצעת קצב פעילה: {tempo} BPM. <button className="link" onClick={() => setTrackTempo(a.track, undefined)}>בטל</button></p>}
    </div>
  );
}

export function CoachView() {
  const s = useStore();
  const [list] = useState(() => adviceAll(s, today()));
  useEffect(() => { markCoachSeen(); }, []);
  const act = list.filter((a) => ACTIONABLE.includes(a.kind));
  const rest = list.filter((a) => !ACTIONABLE.includes(a.kind));
  return (
    <div className="screen">
      <button className="back" onClick={() => go('plan')}>→ לגיטרה</button>
      <h1>🎧 מה שמעתי</h1>
      <p className="small muted">מכל בדיקות המיקרופון (קצב ותווים) של 3 השבועות האחרונים, בשלב שאתה נמצא בו בכל מסלול. אני רק מציע – אתה מחליט.</p>
      {act.length > 0 && <h3 className="section-title">הצעות</h3>}
      {act.map((a) => <AdviceCard key={a.track} a={a} />)}
      {rest.length > 0 && <h3 className="section-title">{act.length ? 'שאר המסלולים' : 'המסלולים'}</h3>}
      {rest.map((a) => <AdviceCard key={a.track} a={a} />)}
      {!list.length && <p>סיימת את כל המסלולים 🏆</p>}
    </div>
  );
}
