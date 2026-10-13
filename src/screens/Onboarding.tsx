import { useState } from 'react';
import type { Profile } from '../state/store';

interface Q { key: keyof Profile; q: string; opts: string[]; bool?: boolean }

const QUESTIONS: Q[] = [
  { key: 'guitarExp', q: 'מה הניסיון שלך בגיטרה?', opts: ['לא ניגנתי בכלל', 'מכיר כמה אקורדים', 'מנגן שירים עם אקורדים פתוחים', 'גם אקורדי הברה וקצת סולו', 'מנגן שוטף, כולל אלתור'] },
  { key: 'pianoExp', q: 'ומה הניסיון שלך בפסנתר?', opts: ['לא ניגנתי בכלל', 'יודע למצוא תווים ולנגן מנגינה פשוטה', 'מנגן אקורדים בסיסיים', 'מנגן בשתי ידיים, קטעים פשוטים', 'מנגן שוטף'] },
  { key: 'readsNotes', q: 'קריאת תווים (חמשה)?', opts: ['בכלל לא', 'לאט, עם ספירת קווים', 'די בסדר', 'שוטף'] },
  { key: 'knowsTheory', q: 'כמה תיאוריה אתה מכיר?', opts: ['כמעט כלום', 'שמות תווים, מה זה סולם', 'מרווחים, סוגי אקורדים, סולמות', 'הרמוניה, דרגות, מודוסים'] },
  { key: 'goal', q: 'מה המטרה העיקרית שלך?', opts: ['ללוות שירים', 'לאלתר ולנגן סולואים', 'להבין מוזיקה לעומק', 'הכל ביחד'] },
  { key: 'hasGuitar', q: 'יש לך גיטרה זמינה עכשיו? (לחלק במבחן שמקשיב דרך המיקרופון)', opts: ['כן, היא לידי', 'לא כרגע'], bool: true },
  { key: 'hasPiano', q: 'ופסנתר זמין עכשיו?', opts: ['כן', 'לא כרגע'], bool: true },
];

export type StartMode = 'test' | 'pick';

// Questions after this index only matter for the placement test (is an instrument at hand for the mic part).
const TEST_ONLY_FROM = QUESTIONS.findIndex((q) => q.key === 'hasGuitar');

export function Onboarding({ onDone, onScratch }: { onDone: (p: Profile, mode: StartMode) => void; onScratch: () => void }) {
  const [i, setI] = useState(-1);
  const [ans, setAns] = useState<Partial<Profile>>({});
  const [askMode, setAskMode] = useState(false);

  if (i === -1) {
    return (
      <div className="screen center">
        <div className="hero">🎸🎹</div>
        <h1>ברוך הבא ל־Music Trainer</h1>
        <p className="lead">
          לפני שמתחילים: שאלון קצר על הניסיון שלך, ואז תבחר – מבחן רמה שמתאים את עצמו אליך (תיאוריה, שמיעה,
          גיטרה ופסנתר), או להתחיל בלי מבחן ולקבוע רמות לבד. בכל מקרה תקבל מסלול שמתחיל מהמקום הנכון.
        </p>
        <p className="muted">השאלון לוקח דקה; המבחן כ-10 דקות (מומלץ עם אוזניות).</p>
        <button className="btn primary big" onClick={() => setI(0)}>בוא נתחיל</button>
        <button className="btn ghost wide" onClick={onScratch}>לדלג על הכל ולהתחיל מאפס</button>
      </div>
    );
  }

  if (askMode) {
    return (
      <div className="screen">
        <div className="progress"><div style={{ width: `${(i / QUESTIONS.length) * 100}%` }} /></div>
        <h2 className="prompt">איך להמשיך?</h2>
        <div className="options col">
          <button className="option" onClick={() => { setAskMode(false); setI(TEST_ONLY_FROM); }}>
            <b>מבחן רמה (מומלץ)</b><br /><small className="muted">כ-10 דקות: תיאוריה, שמיעה, מקלדת וצוואר, ואם יש כלי – גם ניגון למיקרופון</small>
          </button>
          <button className="option" onClick={() => onDone({ ...ans, hasGuitar: false, hasPiano: false } as Profile, 'pick')}>
            <b>בלי מבחן</b><br /><small className="muted">הרמות ייקבעו לפי מה שענית בשאלון, ותוכל לתקן אותן ידנית</small>
          </button>
        </div>
        <button className="btn ghost" onClick={() => { setAskMode(false); setI(TEST_ONLY_FROM - 1); }}>→ חזרה</button>
      </div>
    );
  }

  const q = QUESTIONS[i];
  const choose = (k: number) => {
    const v = q.bool ? k === 0 : q.key === 'goal' ? q.opts[k] : k;
    const next = { ...ans, [q.key]: v };
    setAns(next);
    if (i + 1 === TEST_ONLY_FROM) setAskMode(true);
    else if (i + 1 < QUESTIONS.length) setI(i + 1);
    else onDone(next as Profile, 'test');
  };
  return (
    <div className="screen">
      <div className="progress"><div style={{ width: `${(i / QUESTIONS.length) * 100}%` }} /></div>
      <p className="muted">שאלון היכרות · {i + 1}/{QUESTIONS.length}</p>
      <h2 className="prompt">{q.q}</h2>
      <div className="options col">
        {q.opts.map((o, k) => (
          <button key={k} className="option" onClick={() => choose(k)}>{o}</button>
        ))}
      </div>
      {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>→ חזרה</button>}
    </div>
  );
}
