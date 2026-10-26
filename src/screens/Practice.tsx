import { useMemo, useState } from 'react';
import { ExerciseView, type Outcome } from '../components/ExerciseView';
import { GENERATORS } from '../engine/generators';
import { isMicGen } from '../engine/placement';
import { DOMAINS, DOMAIN_ICON, DOMAIN_LABEL, type Domain, type Generator } from '../engine/types';
import { go } from '../router';
import { getState, recordAnswer, useStore, type State } from '../state/store';

const ROUND = 10;

/** Weighted pick favouring weak and not-recently-practised skills within unlocked levels. */
function smartQueue(s: State, filter: Domain | 'all', mic: boolean, n = ROUND): Generator[] {
  const pool = GENERATORS.filter((g) =>
    (filter === 'all' ? !(g.domain === 'piano' && s.prefs.hidePiano) : g.domain === filter) && g.tier <= s.levels[g.domain] && g.tier >= s.levels[g.domain] - 2 && (mic || !isMicGen(g)));
  if (!pool.length) return [];
  const weight = (g: Generator) => {
    const st = s.genStats[g.id];
    const acc = st ? (st.right + 1) / (st.total + 2) : 0.5;
    const days = st ? (Date.now() - st.last) / 864e5 : 3;
    return 0.3 + (1 - acc) * 3 + Math.min(days, 7) * 0.2 + (g.tier === s.levels[g.domain] ? 0.6 : 0);
  };
  const out: Generator[] = [];
  for (let k = 0; k < n; k++) {
    const ws = pool.map((g) => (out[out.length - 1]?.id === g.id ? 0.05 : weight(g)));
    let r = Math.random() * ws.reduce((a, b) => a + b, 0);
    let idx = 0;
    while (r > ws[idx] && idx < ws.length - 1) r -= ws[idx++];
    out.push(pool[idx]);
  }
  return out;
}

export function Practice() {
  const s = useStore();
  const [filter, setFilter] = useState<Domain | 'all'>('all');
  const [mic, setMic] = useState(false);
  const [round, setRound] = useState(0);
  const [running, setRunning] = useState(false);
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const queue = useMemo(() => smartQueue(getState(), filter, mic), [filter, mic, round]);
  const ex = useMemo(() => (running && queue[i] ? queue[i].make() : null), [running, i, queue]);

  const onDone = (o: Outcome) => {
    if (o !== 'skip') {
      recordAnswer(queue[i].id, o === 'right');
      setScore((x) => ({ ...x, [o]: x[o] + 1 }));
    }
    setI(i + 1);
  };

  if (running && i >= queue.length) {
    return (
      <div className="screen center">
        <div className="hero">⚡</div>
        <h1>סבב הושלם</h1>
        <p className="big-num">{score.right}/{score.right + score.wrong}</p>
        <div className="row">
          <button className="btn ghost" onClick={() => go('')}>בית</button>
          <button className="btn primary" onClick={() => { setRound(round + 1); setI(0); setScore({ right: 0, wrong: 0 }); }}>עוד סבב</button>
        </div>
      </div>
    );
  }

  if (running && ex) {
    return (
      <div className="screen">
        <div className="drill-head">
          <button className="back" onClick={() => { setRunning(false); setI(0); }}>✕</button>
          <div className="progress grow"><div style={{ width: `${(i / queue.length) * 100}%` }} /></div>
          <span className="small muted">{DOMAIN_ICON[queue[i].domain]} {queue[i].title}</span>
        </div>
        <ExerciseView key={`${round}-${i}`} ex={ex} genId={queue[i].id} onDone={onDone} />
      </div>
    );
  }

  // Weakest skills for the overview.
  const weak = GENERATORS.map((g) => ({ g, st: s.genStats[g.id] }))
    .filter((x) => x.st && x.st.total >= 3)
    .sort((a, b) => a.st!.right / a.st!.total - b.st!.right / b.st!.total)
    .slice(0, 4);

  return (
    <div className="screen">
      <h1>⚡ תרגילים מהירים</h1>
      <p className="lead">סבב של {ROUND} תרגילים מכל מה שפתוח לך, עם עדיפות למיומנויות החלשות ולמה שלא תרגלת מזמן.</p>
      <div className="chips">
        <button className={`chip ${filter === 'all' ? 'on' : ''}`} onClick={() => setFilter('all')}>הכל</button>
        {DOMAINS.map((d) => (
          <button key={d} className={`chip ${filter === d ? 'on' : ''}`} onClick={() => setFilter(d)}>{DOMAIN_ICON[d]} {DOMAIN_LABEL[d]}</button>
        ))}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={mic} onChange={(e) => setMic(e.target.checked)} />
        כולל תרגילי מיקרופון (צריך כלי ביד)
      </label>
      <button className="btn primary big" disabled={!queue.length} onClick={() => { setI(0); setScore({ right: 0, wrong: 0 }); setRunning(true); }}>התחל</button>
      {weak.length > 0 && (
        <>
          <h3 className="section-title">דורש חיזוק</h3>
          <ul className="weak-list">
            {weak.map(({ g, st }) => (
              <li key={g.id}>{DOMAIN_ICON[g.domain]} {g.title} <span className="muted">{Math.round((st!.right / st!.total) * 100)}%</span></li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
