import { Blocks } from '../components/Blocks';
import { GLOSSARY, GLOSSARY_BY_ID, GLOSSARY_GROUPS } from '../data/glossary';
import { go } from '../router';

export function Glossary({ id }: { id?: string }) {
  const entry = id ? GLOSSARY_BY_ID[id] : undefined;
  if (entry) {
    return (
      <div className="screen">
        <button className="back" onClick={() => history.length > 1 ? history.back() : go('glossary')}>→ חזרה</button>
        <h1>{entry.icon} {entry.title}</h1>
        <Blocks blocks={entry.blocks} />
        <button className="btn ghost wide" onClick={() => go('glossary')}>📚 לכל הנושאים במילון</button>
      </div>
    );
  }
  return (
    <div className="screen">
      <h1>📚 מילון</h1>
      <p className="lead">כל ההסברים במקום אחד: שמות התווים, סימנים, מרווחים, אקורדים, איך קוראים חמשה ודיאגרמות – עם דוגמאות לשמיעה.</p>
      {GLOSSARY_GROUPS.map((g) => (
        <section key={g} className="unit">
          <h3>{g}</h3>
          {GLOSSARY.filter((e) => e.group === g).map((e) => (
            <button key={e.id} className="lesson-row" onClick={() => go('glossary/' + e.id)}>
              <span className="lr-badge">{e.icon}</span>
              <span className="lr-title">{e.title}</span>
            </button>
          ))}
        </section>
      ))}
    </div>
  );
}
