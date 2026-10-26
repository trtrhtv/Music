import { useMemo, useState } from 'react';
import { Blocks } from '../components/Blocks';
import { rich } from '../components/rich';
import { playCue } from '../audio/cue';
import { ExerciseView, type Outcome } from '../components/ExerciseView';
import { LESSON_BY_ID, type Lesson } from '../data/curriculum';
import type { Block } from '../data/blocks';
import { THEORY_UNITS } from '../data/theoryCourse';
import { GEN_BY_ID } from '../engine/generators';
import { DOMAIN_ICON } from '../engine/types';
import { go } from '../router';
import { PASS, recordAnswer, recordLesson, useStore } from '../state/store';

/** A short listening question before any explanation; the answer is revealed on request. */
function ListenFirst({ l }: { l: NonNullable<Lesson['listen']> }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="listen-first">
      <p>{rich(l.q)}</p>
      <div className="demos">
        {l.sounds.map((d, k) => <button key={k} className="btn demo" onClick={() => playCue(d.cue, d.timbre)}>🔊 {d.label}</button>)}
      </div>
      <p className="muted small">הקשב כמה פעמים שצריך, ונסה לענות לעצמך – לפני שמסתכלים.</p>
      {shown ? <div className="summary-box">{rich(l.answer)}</div> : <button className="btn ghost" onClick={() => setShown(true)}>מה שמעתי?</button>}
    </div>
  );
}

export function LessonRunner({ id }: { id: string }) {
  const s = useStore();
  const lesson = LESSON_BY_ID[id];
  const [phase, setPhase] = useState<'intro' | 'drill' | 'done'>('intro');
  const [page, setPage] = useState(0);
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const queue = useMemo(
    () => lesson ? lesson.drills.flatMap(([g, n]) => Array.from({ length: n }, () => g)) : [],
    [lesson],
  );
  const ex = useMemo(() => (phase === 'drill' && queue[i] ? GEN_BY_ID[queue[i]].make() : null), [phase, i, queue]);

  if (!lesson) return <div className="screen"><p>שיעור לא נמצא</p></div>;

  const onDone = (o: Outcome) => {
    const next = { ...score };
    if (o !== 'skip') {
      recordAnswer(queue[i], o === 'right');
      next[o]++;
      setScore(next);
    }
    if (i + 1 < queue.length) setI(i + 1);
    else {
      const graded = next.right + next.wrong;
      // Skipping every exercise (e.g. no instrument at hand) doesn't count as completing the lesson.
      if (graded) recordLesson(lesson.id, lesson.domain, next.right / graded);
      setPhase('done');
    }
  };

  const back = () => go('track/' + lesson.domain);
  if (phase === 'intro' && lesson.pages) {
    // Sound before symbol: the listening question comes first, then the explanation pages.
    const pages = [
      ...(lesson.listen ? [{ title: '🎧 קודם להקשיב', blocks: [] as Block[], listen: lesson.listen }] : []),
      ...lesson.pages.map((pg) => ({ ...pg, listen: undefined })),
    ];
    const last = page === pages.length - 1;
    const turn = (n: number) => { setPage(n); window.scrollTo(0, 0); };
    return (
      <div className="screen">
        <button className="back" onClick={back}>→ לכל השיעורים</button>
        <p className="muted small">{DOMAIN_ICON[lesson.domain]} {lesson.unit ? `יחידה ${lesson.unit} · ${THEORY_UNITS[lesson.unit]}` : `רמה ${lesson.level}`}</p>
        <h1>{lesson.title}</h1>
        {page === 0 && lesson.why && <div className="why-box"><b>למה זה חשוב לך?</b> {rich(lesson.why)}</div>}
        <div className="step-dots" aria-hidden>{pages.map((_, k) => <span key={k} className={k === page ? 'on' : k < page ? 'done' : ''} />)}</div>
        <h2 className="step-title">שלב {page + 1} מתוך {pages.length}: {pages[page].title}</h2>
        {pages[page].listen ? <ListenFirst key={page} l={pages[page].listen!} /> : <Blocks blocks={pages[page].blocks} />}
        {last && (lesson.onGuitar || lesson.onPiano) && (
          <div className="on-instruments">
            {lesson.onGuitar && <div className="on-inst"><b>🎸 עכשיו על הגיטרה</b><ul>{lesson.onGuitar.map((t, i) => <li key={i}>{rich(t)}</li>)}</ul></div>}
            {lesson.onPiano && !s.prefs.hidePiano && <div className="on-inst"><b>🎹 ועל הפסנתר</b><ul>{lesson.onPiano.map((t, i) => <li key={i}>{rich(t)}</li>)}</ul></div>}
          </div>
        )}
        {last && lesson.summary && <div className="summary-box"><b>בקיצור:</b> {rich(lesson.summary)}</div>}
        {last && lesson.see && <Blocks blocks={[{ t: 'see', ids: lesson.see }]} />}
        <div className="step-nav">
          {page > 0 ? <button className="btn ghost" onClick={() => turn(page - 1)}>→ הקודם</button> : <span />}
          {last
            ? <button className="btn primary" onClick={() => setPhase('drill')}>לתרגול ({queue.length}) ←</button>
            : <button className="btn primary" onClick={() => turn(page + 1)}>הבא ←</button>}
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="screen">
        <button className="back" onClick={() => go('track/' + lesson.domain)}>→ חזרה</button>
        <p className="muted">{DOMAIN_ICON[lesson.domain]} רמה {lesson.level}</p>
        <h1>{lesson.title}</h1>
        <div className="lesson-text">{lesson.intro.map((p, k) => <p key={k}>{rich(p)}</p>)}</div>
        {lesson.extra && <Blocks blocks={lesson.extra} />}
        {lesson.demos && (
          <div className="demos">
            {lesson.demos.map((d, k) => (
              <button key={k} className="btn demo" onClick={() => playCue(d.cue, d.timbre)}>🔊 {d.label}</button>
            ))}
          </div>
        )}
        {lesson.see && <Blocks blocks={[{ t: 'see', ids: lesson.see }]} />}
        <button className="btn primary big" onClick={() => setPhase('drill')}>לתרגול ({queue.length} תרגילים)</button>
      </div>
    );
  }

  if (phase === 'done') {
    const graded = score.right + score.wrong;
    const pct = graded ? score.right / graded : 0;
    const passed = pct >= PASS;
    if (!graded) {
      return (
        <div className="screen center">
          <div className="hero">⏭️</div>
          <h1>דילגת על כל התרגילים</h1>
          <p className="muted">אפשר לחזור לשיעור הזה כשהכלי יהיה בהישג יד.</p>
          <button className="btn primary" onClick={() => go('track/' + lesson.domain)}>חזרה למסלול</button>
        </div>
      );
    }
    return (
      <div className="screen center">
        <div className="hero">{passed ? (pct >= 0.9 ? '🏆' : '⭐') : '💪'}</div>
        <h1>{passed ? 'כל הכבוד!' : 'כמעט!'}</h1>
        <p className="big-num">{Math.round(pct * 100)}%</p>
        <p className="muted">{score.right} נכונות מתוך {graded}{passed ? '' : ' · צריך 70% כדי לעבור'}</p>
        <div className="row">
          <button className="btn ghost" onClick={() => { setScore({ right: 0, wrong: 0 }); setI(0); setPhase('drill'); }}>שוב</button>
          <button className="btn primary" onClick={() => go('track/' + lesson.domain)}>המשך</button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="drill-head">
        <button className="back" onClick={() => go('track/' + lesson.domain)}>✕</button>
        <div className="progress grow"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>
        <span className="small muted">{i + 1}/{queue.length}</span>
      </div>
      {ex && <ExerciseView key={i} ex={ex} genId={queue[i]} onDone={onDone} />}
    </div>
  );
}
