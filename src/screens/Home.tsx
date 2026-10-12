import { LESSONS, UNIT_TITLES, lessonsFor } from '../data/curriculum';
import { DOMAIN_ICON, DOMAIN_LABEL, LEVEL_LABEL, type Domain } from '../engine/types';
import { go } from '../router';
import { lessonStatus, streak, useStore, type State } from '../state/store';

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
        <div className="streak" title="ימים ברצף">🔥 {st}</div>
      </header>

      <button className="cta" onClick={() => go('practice')}>
        <span className="cta-icon">⚡</span>
        <span><b>תרגול חכם – 10 דקות</b><br /><small>תרגילים מעורבים, עם דגש על מה שהכי צריך חיזוק</small></span>
      </button>

      <h3 className="section-title">המסלולים שלך</h3>
      <p className="muted small">תיאוריה ושמיעה משותפות לשני הכלים; גיטרה ופסנתר – מסלולי טכניקה נפרדים.</p>
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
