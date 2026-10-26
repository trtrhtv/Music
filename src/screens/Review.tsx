import { useMemo, useState } from 'react';
import { ExerciseView, type Outcome } from '../components/ExerciseView';
import { LESSON_BY_ID } from '../data/curriculum';
import { GEN_BY_ID } from '../engine/generators';
import { go } from '../router';
import { REVIEW_SIZE, THEORY_IDS } from '../state/reviewDue';
import { answerReview, dueReviews, recordAnswer, useStore } from '../state/store';

/** Spaced review: one question from each due theory lesson (up to five), oldest first. */
export function ReviewRunner() {
  const s = useStore();
  // Fix the list when the screen opens, so answering doesn't reshuffle it.
  const [ids] = useState(() => dueReviews(s, THEORY_IDS).slice(0, REVIEW_SIZE));
  const [i, setI] = useState(0);
  const [right, setRight] = useState(0);
  const lesson = LESSON_BY_ID[ids[i]];
  const genId = useMemo(() => (lesson ? lesson.drills[Math.floor(Math.random() * lesson.drills.length)][0] : ''), [lesson]);
  const ex = useMemo(() => (genId ? GEN_BY_ID[genId].make() : null), [genId]);

  if (!ids.length) {
    return (
      <div className="screen center">
        <div className="hero">✅</div>
        <h1>אין חזרות להיום</h1>
        <p className="muted">שיעור תיאוריה שעברת חוזר לחזרה אחרי יום, 3 ימים, שבוע, שבועיים, חודש וחודשיים – כל עוד אתה עונה נכון.</p>
        <button className="btn primary" onClick={() => go('track/theory')}>לקורס התיאוריה</button>
      </div>
    );
  }
  if (i >= ids.length) {
    return (
      <div className="screen center">
        <div className="hero">🔁</div>
        <h1>החזרה של היום הושלמה</h1>
        <p className="big-num">{right}/{ids.length}</p>
        <p className="muted">מה שענית נכון יחזור בעוד יותר זמן. מה שטעית בו – כבר מחר.</p>
        <button className="btn primary" onClick={() => (history.length > 1 ? history.back() : go(''))}>חזרה</button>
      </div>
    );
  }
  const onDone = (o: Outcome) => {
    if (o !== 'skip') {
      recordAnswer(genId, o === 'right');
      answerReview(lesson.id, o === 'right');
      if (o === 'right') setRight(right + 1);
    }
    setI(i + 1);
  };
  return (
    <div className="screen">
      <div className="drill-head">
        <button className="back" onClick={() => (history.length > 1 ? history.back() : go(''))}>✕</button>
        <div className="progress grow"><div style={{ width: `${(i / ids.length) * 100}%` }} /></div>
        <span className="small muted">{i + 1}/{ids.length}</span>
      </div>
      <p className="muted small">🔁 חזרה על: {lesson.title}</p>
      {ex && <ExerciseView key={i} ex={ex} genId={genId} onDone={onDone} />}
    </div>
  );
}
