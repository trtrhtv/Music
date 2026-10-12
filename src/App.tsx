import { useState } from 'react';
import { DOMAINS, type Domain } from './engine/types';
import { go, useRoute } from './router';
import { Home } from './screens/Home';
import { LessonRunner } from './screens/LessonRunner';
import { Onboarding } from './screens/Onboarding';
import { Placement } from './screens/Placement';
import { Practice } from './screens/Practice';
import { Tools } from './screens/Tools';
import { Track } from './screens/Track';
import { finishPlacement, resetAll, useStore, type Profile } from './state/store';

function PlacementFlow() {
  const [profile, setProfile] = useState<Profile | null>(null);
  if (!profile) return <Onboarding onDone={setProfile} />;
  return <Placement profile={profile} onDone={(lv) => { finishPlacement(profile, lv); go(''); }} />;
}

function Settings() {
  return (
    <div className="screen">
      <h1>⚙️ הגדרות</h1>
      <button className="btn ghost wide" onClick={() => go('retest')}>לעשות את מבחן הרמה מחדש</button>
      <p className="muted small">ההתקדמות בשיעורים נשמרת; הרמות יתעדכנו לפי המבחן החדש.</p>
      <button className="btn danger wide" onClick={() => { if (confirm('למחוק את כל ההתקדמות?')) { resetAll(); go(''); } }}>איפוס מלא</button>
      <p className="muted small">כל הנתונים נשמרים רק במכשיר הזה.</p>
    </div>
  );
}

const NAV: [string, string, string][] = [['', '🏠', 'בית'], ['practice', '⚡', 'תרגול'], ['tools', '🧰', 'כלים'], ['settings', '⚙️', 'הגדרות']];

export default function App() {
  const s = useStore();
  const [page, arg] = useRoute();

  if (!s.placed || page === 'retest') return <main className="app"><PlacementFlow /></main>;

  let body;
  if (page === 'track' && DOMAINS.includes(arg as Domain)) body = <Track key={arg} domain={arg as Domain} />;
  else if (page === 'lesson' && arg) body = <LessonRunner key={arg} id={arg} />;
  else if (page === 'practice') body = <Practice />;
  else if (page === 'tools') body = <Tools />;
  else if (page === 'settings') body = <Settings />;
  else body = <Home />;

  return (
    <main className="app">
      {body}
      {page !== 'lesson' && (
        <nav className="tabbar">
          {NAV.map(([p, icon, label]) => (
            <button key={p} className={(page ?? '') === p || (p === '' && page === 'track') ? 'on' : ''} onClick={() => go(p)}>
              <span>{icon}</span><small>{label}</small>
            </button>
          ))}
        </nav>
      )}
    </main>
  );
}
