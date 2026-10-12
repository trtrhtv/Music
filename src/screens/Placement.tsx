import { useMemo, useState } from 'react';
import { ExerciseView, type Outcome } from '../components/ExerciseView';
import { PLACEMENT_LEN, estimateLevel, micSteps, nextTier, pickPlacementGen, priorTiers, type Answer } from '../engine/placement';
import { DOMAINS, DOMAIN_ICON, DOMAIN_LABEL, LEVEL_LABEL, type Domain, type Exercise } from '../engine/types';
import { UNIT_TITLES } from '../data/curriculum';
import type { Profile } from '../state/store';

const SECTION_INTRO: Record<Domain, string> = {
  theory: 'שאלות על תווים, סולמות, אקורדים והרמוניה. השאלות נעשות קשות יותר כשאתה עונה נכון, וקלות יותר כשלא – זה בסדר לטעות.',
  ear: 'האפליקציה תשמיע צלילים, מרווחים ואקורדים ותבקש לזהות אותם. מומלץ אוזניות. אפשר להשמיע שוב כמה שרוצים.',
  guitar: 'שאלות על הצוואר והאקורדים, וחלק מהן עם הגיטרה עצמה – האפליקציה תקשיב דרך המיקרופון. אם אין גיטרה, אפשר לדלג.',
  piano: 'מציאת תווים ואקורדים על מקלדת וירטואלית. אם הפסנתר זמין – גם שאלה עם המיקרופון.',
};

interface Item { domain: Domain; genId: string; tier: number; ex: Exercise; n: number }

export function Placement({ profile, onDone }: { profile: Profile; onDone: (levels: Record<Domain, number>) => void }) {
  const prior = useMemo(() => priorTiers(profile), [profile]);
  const [di, setDi] = useState(0);
  const [intro, setIntro] = useState(true);
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState(prior[DOMAINS[0]]);
  const [answers, setAnswers] = useState<Record<Domain, Answer[]>>({ theory: [], ear: [], guitar: [], piano: [] });
  const [counter, setCounter] = useState(0);
  const [result, setResult] = useState<Record<Domain, number> | null>(null);

  const domain = DOMAINS[di];
  const item: Item | null = useMemo(() => {
    if (intro || result) return null;
    const wantMic = micSteps(domain, profile).includes(step);
    const g = pickPlacementGen(domain, tier, wantMic);
    return { domain, genId: g.id, tier: g.tier, ex: g.make(), n: counter };
  }, [domain, tier, step, intro, result, counter, profile]);

  const total = DOMAINS.reduce((s, d) => s + PLACEMENT_LEN[d], 0);
  const doneSoFar = DOMAINS.slice(0, di).reduce((s, d) => s + PLACEMENT_LEN[d], 0) + step;

  const advance = (o: Outcome) => {
    if (!item) return;
    let a = answers;
    let t = tier;
    if (o !== 'skip') {
      a = { ...answers, [domain]: [...answers[domain], { tier: item.tier, right: o === 'right' }] };
      setAnswers(a);
      t = nextTier(item.tier, o === 'right');
    }
    setCounter((c) => c + 1);
    if (step + 1 < PLACEMENT_LEN[domain]) {
      setStep(step + 1);
      setTier(t);
      return;
    }
    if (di + 1 < DOMAINS.length) {
      const nd = DOMAINS[di + 1];
      setDi(di + 1);
      setStep(0);
      setTier(prior[nd]);
      setIntro(true);
      return;
    }
    setResult(Object.fromEntries(DOMAINS.map((d) => [d, estimateLevel(a[d])])) as Record<Domain, number>);
  };

  if (result) {
    return (
      <div className="screen">
        <h1>התוצאות שלך</h1>
        <p className="lead">לפי המבחן, כך נראית נקודת ההתחלה שלך. השיעורים שמתחת לרמה שלך פתוחים לחזרה, ואפשר תמיד לעשות את המבחן מחדש.</p>
        <div className="result-grid">
          {DOMAINS.map((d) => (
            <div key={d} className="result-card">
              <div className="rc-icon">{DOMAIN_ICON[d]}</div>
              <div className="rc-name">{DOMAIN_LABEL[d]}</div>
              <div className="rc-level">רמה {result[d]} · {LEVEL_LABEL[result[d]]}</div>
              <div className="dots">{[1, 2, 3, 4, 5].map((k) => <span key={k} className={k <= result[d] ? 'on' : ''} />)}</div>
              <div className="muted small">מתחילים ב: {UNIT_TITLES[d][result[d]]}</div>
            </div>
          ))}
        </div>
        <button className="btn primary big" onClick={() => onDone(result)}>יאללה, למסלול שלי</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="progress"><div style={{ width: `${(doneSoFar / total) * 100}%` }} /></div>
      <p className="muted">מבחן רמה · {DOMAIN_ICON[domain]} {DOMAIN_LABEL[domain]} · {intro ? 'הסבר' : `${step + 1}/${PLACEMENT_LEN[domain]}`}</p>
      {intro ? (
        <div className="section-intro">
          <div className="hero">{DOMAIN_ICON[domain]}</div>
          <h1>{DOMAIN_LABEL[domain]}</h1>
          <p className="lead">{SECTION_INTRO[domain]}</p>
          <button className="btn primary big" onClick={() => setIntro(false)}>התחל</button>
        </div>
      ) : item && (
        <ExerciseView key={item.n} ex={item.ex} onDone={advance} />
      )}
    </div>
  );
}
