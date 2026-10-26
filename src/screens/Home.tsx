import { LESSONS, UNIT_TITLES, lessonsFor } from '../data/curriculum';
import { DOMAIN_ICON, DOMAIN_LABEL, LEVEL_LABEL, type Domain } from '../engine/types';
import { go } from '../router';
import { lessonStatus, setHidePiano, streak, today, useStore, type State } from '../state/store';
import { useRecordings } from '../state/recordings';
import { REVIEW_SIZE, useDueReviews } from '../state/reviewDue';

function nextLesson(s: State, d: Domain) {
  return lessonsFor(d).find((l) => lessonStatus(s, l) === 'open');
}

export function Home() {
  const s = useStore();
  const st = streak(s.days);
  const order: Domain[] = ['theory', 'ear', 'guitar', 'piano'];
  const doneCount = LESSONS.filter((l) => s.lessons[l.id]?.passed).length;
  const recs = useRecordings();
  const due = useDueReviews();
  const recDue = s.prog.placed && (!recs.length || Date.now() - recs[recs.length - 1].created > 7 * 86400000);
  return (
    <div className="screen">
      <header className="home-head">
        <div>
          <h1>שלום! 👋</h1>
          <p className="muted">{doneCount} שיעורים הושלמו · {s.xp} XP</p>
        </div>
        <div className="row tight">
          <div className="streak" title="ימים ברצף">🔥 {st}</div>
          <button className="gear" aria-label="הגדרות" onClick={() => go('settings')}>⚙️</button>
        </div>
      </header>

      <button className="cta plan-cta" onClick={() => go('plan')}>
        <span className="cta-icon">🎸</span>
        <span><b>{s.prog.placed ? 'תרגול גיטרה – השעה הבאה' : 'תוכנית גיטרה – מבחן מיקום'}</b><br /><small>{s.prog.placed ? `היום: ${(s.prog.sessions[today()] ?? []).length} שעות תרגול` : 'נבדוק מאיפה להתחיל בכל מסלול'}</small></span>
      </button>

      {due.length > 0 && (
        <button className="lesson-row open" onClick={() => go('review')}>
          <span className="lr-badge">🔁</span>
          <span className="lr-title">חזרה מרווחת בתיאוריה<br /><small className="muted">{Math.min(due.length, REVIEW_SIZE)} שאלות על נושאים שלמדת – דקה-שתיים</small></span>
        </button>
      )}
      {recDue && (
        <button className="lesson-row open" onClick={() => go('plan/progress')}>
          <span className="lr-badge">🎙️</span>
          <span className="lr-title">הגיע הזמן להקלטה השבועית<br /><small className="muted">דקה מכל מסלול – כדי לשמוע את ההתקדמות</small></span>
        </button>
      )}

      <button className="cta" onClick={() => go('practice')}>
        <span className="cta-icon">⚡</span>
        <span><b>תרגילים מהירים – 10 דקות</b><br /><small>שאלות קצרות בתיאוריה ובשמיעה, עם דגש על מה שהכי צריך חיזוק</small></span>
      </button>

      <h3 className="section-title">שיעורים באפליקציה</h3>
      <p className="muted small">שיעורים קצרים עם תרגילים על המסך. האימון עם הגיטרה ביד – בלשונית 🎸 גיטרה.</p>
      <div className="tracks">
        {order.filter((d) => !(d === 'piano' && s.prefs.hidePiano)).map((d) => {
          const ls = lessonsFor(d);
          const done = ls.filter((l) => ['passed', 'known'].includes(lessonStatus(s, l))).length;
          const nl = nextLesson(s, d);
          return (
            <button key={d} className={`track-card t-${d}`} onClick={() => go('track/' + d)}>
              <div className="tc-top">
                <span className="tc-icon">{DOMAIN_ICON[d]}</span>
                <span className="tc-level">רמה {s.levels[d]} · {LEVEL_LABEL[s.levels[d]]}</span>
              </div>
              <div className="tc-name">{DOMAIN_LABEL[d]}</div>
              <div className="tc-unit muted small">{UNIT_TITLES[d][s.levels[d]]}</div>
              <div className="bar"><div style={{ width: `${(done / ls.length) * 100}%` }} /></div>
              <div className="tc-next small">{nl ? `הבא: ${nl.title}` : 'הכל הושלם 🎉'}</div>
            </button>
          );
        })}
      </div>
      <button className="link small" onClick={() => setHidePiano(!s.prefs.hidePiano)}>{s.prefs.hidePiano ? '🎹 הצג גם את הפסנתר' : '🎹 הסתר את הפסנתר בינתיים'}</button>
    </div>
  );
}
