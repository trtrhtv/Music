import { useState } from 'react';
import { DOMAINS, type Domain } from './engine/types';
import { go, useRoute } from './router';
import { Home } from './screens/Home';
import { LessonRunner } from './screens/LessonRunner';
import { Onboarding, type StartMode } from './screens/Onboarding';
import { Placement } from './screens/Placement';
import { Practice } from './screens/Practice';
import { Tools } from './screens/Tools';
import { Glossary } from './screens/Glossary';
import { PlacementView, ProgramHome, ProgressView, SessionView, TrackView } from './screens/Program';
import { SongView } from './screens/Songs';
import { ReviewRunner } from './screens/Review';
import { downloadBackup, restoreBackup } from './state/backup';
import type { TrackId } from './data/tracks';
import { Track } from './screens/Track';
import { finishPlacement, resetAll, resetProgram, setLevels, useStore, type Profile } from './state/store';
import { LevelPicker } from './screens/LevelPicker';
import { priorTiers } from './engine/placement';

const DEFAULT_PROFILE: Profile = { guitarExp: 0, pianoExp: 0, readsNotes: 0, knowsTheory: 0, goal: '', hasGuitar: false, hasPiano: false };

function PlacementFlow() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<StartMode>('test');
  const done = (p: Profile, lv: Record<Domain, number>) => { finishPlacement(p, lv); go(''); };
  if (!profile) {
    return <Onboarding onDone={(p, m) => { setProfile(p); setMode(m); }} onScratch={() => { setProfile(DEFAULT_PROFILE); setMode('pick'); }} />;
  }
  if (mode === 'pick') {
    return (
      <LevelPicker initial={priorTiers(profile)} title="בחירת רמות" cta="יאללה, למסלול שלי"
        lead="בלי מבחן: זו ההערכה לפי מה שסיפרת. תקן את הרמה של כל מסלול אם צריך."
        onSave={(lv) => done(profile, lv)} onCancel={() => setProfile(null)} />
    );
  }
  return <Placement profile={profile} onDone={(lv) => done(profile, lv)} />;
}

function Backup() {
  const [withRecs, setWithRecs] = useState(true);
  const [msg, setMsg] = useState('');
  return (
    <section className="unit">
      <h3>📦 גיבוי</h3>
      <p className="muted small">כל הנתונים נשמרים רק בדפדפן של המכשיר הזה. ניקוי נתוני הדפדפן או מעבר לטלפון אחר מוחקים אותם – לכן כדאי לשמור גיבוי מדי פעם (קובץ אחד, שאפשר לשמור בדרייב או לשלוח לעצמך).</p>
      <label className="toggle small"><input type="checkbox" checked={withRecs} onChange={(e) => setWithRecs(e.target.checked)} /> כולל ההקלטות (הקובץ יהיה גדול יותר)</label>
      <button className="btn primary wide" onClick={() => downloadBackup(withRecs).then(() => setMsg('✓ קובץ הגיבוי ירד.')).catch(() => setMsg('לא הצלחתי ליצור גיבוי.'))}>⬇️ שמור גיבוי</button>
      <label className="btn ghost wide file-btn">
        ⬆️ שחזר מגיבוי
        <input type="file" accept="application/json,.json" onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f || !confirm('השחזור יחליף את כל ההתקדמות הנוכחית במה שבקובץ. להמשיך?')) return;
          restoreBackup(f).then((n) => setMsg(`✓ שוחזר${n ? `, כולל ${n} הקלטות` : ''}.`)).catch(() => setMsg('זה לא נראה כמו קובץ גיבוי של האפליקציה.'));
        }} />
      </label>
      {msg && <p className="small">{msg}</p>}
    </section>
  );
}

function Settings() {
  return (
    <div className="screen">
      <h1>⚙️ הגדרות</h1>
      <Backup />
      <section className="unit">
        <h3>רמות ותוכנית</h3>
        <button className="btn ghost wide" onClick={() => go('retest')}>לעשות את מבחן הרמה מחדש</button>
        <button className="btn ghost wide" onClick={() => go('levels')}>לשנות רמות ידנית</button>
        <p className="muted small">ההתקדמות בשיעורים נשמרת; הרמות יתעדכנו לפי המבחן החדש.</p>
        <button className="btn ghost wide" onClick={() => { if (confirm('לאפס את תוכנית הגיטרה (שלבים, BPM ומבחן המיקום)?')) resetProgram(); }}>איפוס תוכנית הגיטרה</button>
        <button className="btn danger wide" onClick={() => { if (confirm('למחוק את כל ההתקדמות?')) { resetAll(); go(''); } }}>איפוס מלא</button>
      </section>
    </div>
  );
}

const NAV: [string, string, string][] = [['', '🏠', 'בית'], ['plan', '🎸', 'גיטרה'], ['practice', '⚡', 'תרגילים'], ['glossary', '📚', 'מילון'], ['tools', '🧰', 'כלים']];

export default function App() {
  const s = useStore();
  const [page, arg, arg2] = useRoute();

  if (!s.placed || page === 'retest') return <main className="app"><PlacementFlow /></main>;
  if (page === 'levels') {
    return (
      <main className="app">
        <LevelPicker initial={s.levels} title="שינוי רמות" cta="שמור" lead="קבע מאיזו רמה מתחיל כל מסלול."
          onSave={(lv) => { setLevels(lv); go(''); }} onCancel={() => go('settings')} />
      </main>
    );
  }

  let body;
  if (page === 'track' && DOMAINS.includes(arg as Domain)) body = <Track key={arg} domain={arg as Domain} />;
  else if (page === 'lesson' && arg) body = <LessonRunner key={arg} id={arg} />;
  else if (page === 'practice') body = <Practice />;
  else if (page === 'review') body = <ReviewRunner />;
  else if (page === 'tools') body = <Tools />;
  else if (page === 'glossary') body = <Glossary key={arg ?? ''} id={arg} />;
  else if (page === 'plan') {
    body = arg === 's' && arg2 ? <SessionView key={arg2} id={arg2} /> : arg === 't' && arg2 ? <TrackView key={arg2} id={arg2 as TrackId} />
      : arg === 'placement' ? <PlacementView /> : arg === 'progress' ? <ProgressView /> : <ProgramHome />;
  } else if (page === 'songs' && arg) body = <SongView key={arg} id={arg} />;
  else if (page === 'settings') body = <Settings />;
  else body = <Home />;

  return (
    <main className="app">
      {body}
      {page !== 'lesson' && page !== 'review' && (
        <nav className="tabbar">
          {NAV.map(([p, icon, label]) => (
            <button key={p} className={(page ?? '') === p || (p === '' && page === 'track') || (p === 'plan' && page === 'songs') ? 'on' : ''} onClick={() => go(p)}>
              <span>{icon}</span><small>{label}</small>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
