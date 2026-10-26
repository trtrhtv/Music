import { UNIT_TITLES, lessonsFor, type Lesson } from '../data/curriculum';
import { THEORY_UNITS } from '../data/theoryCourse';
import { DOMAIN_ICON, DOMAIN_LABEL, type Domain } from '../engine/types';
import { go } from '../router';
import { lessonStatus, useStore } from '../state/store';

const BADGE = { passed: '✓', known: '✓', open: '▶', locked: '🔒' };

export function Track({ domain }: { domain: Domain }) {
  const s = useStore();
  const ls = lessonsFor(domain);
  const row = (l: Lesson, n?: number) => {
    const st = lessonStatus(s, l);
    const best = s.lessons[l.id]?.best;
    return (
      <button key={l.id} className={`lesson-row ${st}`} disabled={st === 'locked'} onClick={() => go('lesson/' + l.id)}>
        <span className="lr-badge">{st === 'open' && n !== undefined ? n : BADGE[st]}</span>
        <span className="lr-title">{l.title}{l.optional && <small className="muted"> · רשות</small>}</span>
        <span className="lr-meta small muted">
          {st === 'known' && !best ? 'ידוע לפי המבחן' : best !== undefined ? `${Math.round(best * 100)}%` : ''}
        </span>
      </button>
    );
  };
  if (domain === 'theory') {
    // The theory course is read in order, unit by unit; nothing is locked, so known topics can be skipped.
    return (
      <div className="screen">
        <button className="back" onClick={() => go('')}>→ בית</button>
        <h1>{DOMAIN_ICON[domain]} {DOMAIN_LABEL[domain]}</h1>
        <p className="muted small">קורס לפי הסדר: כל שיעור נשען רק על מה שלפניו. הכול פתוח – מה שאתה כבר יודע, אפשר לדלג.</p>
        {THEORY_UNITS.map((title, u) => u > 0 && (
          <section key={u} className="unit">
            <h3>יחידה {u} · {title}</h3>
            {ls.filter((l) => l.unit === u && !(l.piano && s.prefs.hidePiano)).map((l, k) => row(l, k + 1))}
          </section>
        ))}
      </div>
    );
  }
  return (
    <div className="screen">
      <button className="back" onClick={() => go('')}>→ בית</button>
      <h1>{DOMAIN_ICON[domain]} {DOMAIN_LABEL[domain]}</h1>
      {[1, 2, 3, 4, 5].map((lvl) => (
        <section key={lvl} className={`unit ${lvl > s.levels[domain] ? 'locked' : ''}`}>
          <h3>רמה {lvl} · {UNIT_TITLES[domain][lvl]}</h3>
          {ls.filter((l) => l.level === lvl).map((l) => {
            const st = lessonStatus(s, l);
            const best = s.lessons[l.id]?.best;
            return (
              <button key={l.id} className={`lesson-row ${st}`} disabled={st === 'locked'} onClick={() => go('lesson/' + l.id)}>
                <span className="lr-badge">{BADGE[st]}</span>
                <span className="lr-title">{l.title}{l.optional && <small className="muted"> · רשות</small>}</span>
                <span className="lr-meta small muted">
                  {st === 'known' && !best ? 'ידוע לפי המבחן' : best !== undefined ? `${Math.round(best * 100)}%` : ''}
                </span>
              </button>
            );
          })}
        </section>
      ))}
      {lvlHint(s.levels[domain])}
    </div>
  );
}

const lvlHint = (lvl: number) =>
  lvl < 5 ? <p className="muted small">משלימים את כל השיעורים ברמה (70% ומעלה) – והרמה הבאה נפתחת.</p> : null;
