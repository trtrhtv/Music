import { LESSONS, UNIT_TITLES, lessonsFor } from '../data/curriculum';
import { DOMAIN_ICON, DOMAIN_LABEL, LEVEL_LABEL, type Domain } from '../engine/types';
import { go } from '../router';
import { lessonStatus, streak, today, useStore, type State } from '../state/store';

function nextLesson(s: State, d: Domain) {
  return lessonsFor(d).find((l) => lessonStatus(s, l) === 'open');
}

export function Home() {
  const s = useStore();
  const st = streak(s.days);
  const order: Domain[] = ['theory', 'ear', 'guitar', 'piano'];
  const doneCount = LESSONS.filter((l) => s.lessons[l.id]?.passed).length;
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

      <button className="cta" onClick={() => go('practice')}>
        <span className="cta-icon">⚡</span>
        <span><b>תרגילים מהירים – 10 דקות</b><br /><small>שאלות קצרות בתיאוריה ובשמיעה, עם דגש על מה שהכי צריך חיזוק</small></span>
      </button>

      <h3 className="section-title">שיעורים באפליקציה</h3>
      <p className="muted small">שיעורים קצרים עם תרגילים על המסך. האימון עם הגיטרה ביד – בלשונית 🎸 גיטרה.</p>
      <div className="tracks">
        {order.map((d) => {
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
    </div>
  );
}
