import { useMemo, useState, type ReactNode } from 'react';
import { playCue } from '../audio/cue';
import { ExerciseView, type Outcome } from '../components/ExerciseView';
import { LESSON_BY_ID } from '../data/curriculum';
import { GEN_BY_ID } from '../engine/generators';
import { DOMAIN_ICON } from '../engine/types';
import { go } from '../router';
import { PASS, recordAnswer, recordLesson } from '../state/store';

/** Renders **bold** inline markup. */
function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith('**') ? <b key={i} className="term">{p.slice(2, -2)}</b> : p));
}

export function LessonRunner({ id }: { id: string }) {
  const lesson = LESSON_BY_ID[id];
  const [phase, setPhase] = useState<'intro' | 'drill' | 'done'>('intro');
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
      recordLesson(lesson.id, lesson.domain, graded ? next.right / graded : 1);
      setPhase('done');
    }
  };

  if (phase === 'intro') {
    return (
      <div className="screen">
        <button className="back" onClick={() => go('track/' + lesson.domain)}>→ חזרה</button>
        <p className="muted">{DOMAIN_ICON[lesson.domain]} רמה {lesson.level}</p>
        <h1>{lesson.title}</h1>
        <div className="lesson-text">{lesson.intro.map((p, k) => <p key={k}>{rich(p)}</p>)}</div>
        {lesson.demos && (
          <div className="demos">
            {lesson.demos.map((d, k) => (
              <button key={k} className="btn demo" onClick={() => playCue(d.cue, d.timbre)}>🔊 {d.label}</button>
            ))}
          </div>
        )}
        <button className="btn primary big" onClick={() => setPhase('drill')}>לתרגול ({queue.length} תרגילים)</button>
      </div>
    );
  }

  if (phase === 'done') {
    const graded = score.right + score.wrong;
    const pct = graded ? score.right / graded : 1;
    const passed = pct >= PASS;
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
      {ex && <ExerciseView key={i} ex={ex} onDone={onDone} />}
    </div>
  );
}
