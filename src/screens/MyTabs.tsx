import { useMemo, useState } from 'react';
import { ChordDiagram } from '../components/ChordDiagram';
import { BpmControl, TabFull, splitLike } from '../components/RhythmTools';
import { CH } from '../data/guitarLib';
import { parseTabText, type ParsedTab } from '../engine/tabText';
import { go } from '../router';
import { deleteMyTab, saveMyTab, setMyTabBpm, useStore, type MyTab } from '../state/store';

/**
 * "My tabs": tabs the player pastes in from anywhere (a tab site, a book). They're kept on this
 * device only and get the same tools as the built-in pieces – full screen, chords above the tab,
 * auto-scroll at the tempo.
 */

const BEATS = [3, 4, 6];
/** "Verse · מתיבה 3" when a section starts inside a row. */
export const sectionName = (name: string, bar: number, rowFrom: number) => `\u2066${name}\u2069${bar > rowFrom ? ` · מתיבה ${bar + 1}` : ''}`;
const NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

/** The tab in rows of a few bars, chord names above (the page view; full screen has its own layout). */
function TabRows({ t, perRow = innerWidth < 600 ? 2 : 4 }: { t: ParsedTab; perRow?: number }) {
  const bars = t.lines.map((l) => l.split('|'));
  const chords = t.chordLine ? splitLike(t.chordLine, t.lines[0]) : null;
  const rows = [];
  for (let i = 0; i < t.bars; i += perRow) {
    const ch = chords?.slice(i, i + perRow).join(' ').replace(/\s+$/, '');
    const secs = Object.entries(t.sections).filter(([b]) => +b >= i && +b < i + perRow).map(([b, n]) => sectionName(n, +b, i));
    rows.push(
      <div key={i} className="tf-row">
        {secs.map((n) => <div key={n} className="tf-section">{n}</div>)}
        <pre className="tab" dir="ltr">
          {ch && <b className="tab-chords">{`  ${ch}\n`}</b>}
          {bars.map((b, k) => `${NAMES[k]}|${b.slice(i, i + perRow).join('|')}|`).join('\n')}
        </pre>
      </div>,
    );
  }
  return <div className="tf-rows">{rows}</div>;
}

function Chords({ names }: { names: string[] }) {
  if (!names.length) return null;
  return (
    <div className="chord-row">
      {names.map((n) => (CH[n] ? <ChordDiagram key={n} label={n} frets={CH[n]} /> : <span key={n} className="chip" dir="ltr">{n}</span>))}
    </div>
  );
}

function Editor({ tab }: { tab?: MyTab }) {
  const [title, setTitle] = useState(tab?.title ?? '');
  const [text, setText] = useState(tab?.text ?? '');
  const [beats, setBeats] = useState(tab?.beats ?? 4);
  const parsed = useMemo(() => parseTabText(text), [text]);
  const save = () => {
    const id = saveMyTab({ id: tab?.id, title: title.trim() || 'טאב בלי שם', text, beats, bpm: tab?.bpm ?? 70 });
    go('mytabs/' + id);
  };
  return (
    <div className="screen">
      <button className="back" onClick={() => go(tab ? 'mytabs/' + tab.id : 'mytabs')}>→ חזרה</button>
      <h1>{tab ? 'עריכת טאב' : 'טאב חדש'}</h1>
      <details className="basics" open={!tab}>
        <summary>📘 איך מכניסים טאב</summary>
        <ol>
          <li>פתח את הטאב באתר (בדפדפן בטלפון או במחשב).</li>
          <li>סמן את הטקסט של הטאב – מהשורה שמעל ה-e| הראשון ועד הסוף – והעתק.</li>
          <li>הדבק בתיבה למטה. אפשר להדביק את כל הדף: האפליקציה לוקחת רק את שורות הטאב, את שמות האקורדים שמעליהן ואת שמות החלקים ([Chorus] וכו').</li>
          <li>בחר כמה פעמות יש בתיבה (רוב השירים: 4), ושמור.</li>
        </ol>
        <p className="small muted">הטאבים נשמרים רק במכשיר הזה – הם לא עולים לשום מקום.</p>
      </details>
      <label className="field">שם השיר<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: Shape of My Heart" /></label>
      <label className="field">הטאב
        <textarea className="tab-paste" dir="ltr" value={text} onChange={(e) => setText(e.target.value)} placeholder={'e|-----0-----|\nB|---1---1---|\nG|-2-------2-|\n...'} rows={12} spellCheck={false} />
      </label>
      <div className="row tight wrap">
        <span className="small">פעמות בתיבה:</span>
        {BEATS.map((n) => <button key={n} className={`btn small ${beats === n ? 'primary' : 'ghost'}`} onClick={() => setBeats(n)}>{n}</button>)}
      </div>
      {text.trim() && (parsed.staves
        ? <p className="small ok-text">✓ מצאתי {parsed.staves} שורות טאב · {parsed.bars} תיבות{parsed.chords.length ? <> · אקורדים: <bdi dir="ltr">{parsed.chords.join(' ')}</bdi></> : ''}{Object.keys(parsed.sections).length ? ` · ${Object.keys(parsed.sections).length} חלקים` : ''}</p>
        : <p className="small err-text">לא מצאתי שורות טאב. טאב הוא 6 שורות שמתחילות ב-e| B| G| D| A| E| (או רק ב-|) ובהן מקפים ומספרים.</p>)}
      {parsed.staves > 0 && <TabRows t={parsed} />}
      <div className="row tight">
        <button className="btn primary" disabled={!parsed.staves} onClick={save}>💾 שמור</button>
        {tab && <button className="btn ghost" onClick={() => { if (confirm(`למחוק את "${tab.title}"?`)) { deleteMyTab(tab.id); go('mytabs'); } }}>🗑 מחק</button>}
      </div>
    </div>
  );
}

function View({ tab }: { tab: MyTab }) {
  const t = useMemo(() => parseTabText(tab.text), [tab.text]);
  const [full, setFull] = useState(false);
  return (
    <div className="screen">
      <button className="back" onClick={() => go('mytabs')}>→ הטאבים שלי</button>
      <h1 dir="auto">{tab.title}</h1>
      <p className="small muted">{t.bars} תיבות · {tab.beats} פעמות בתיבה</p>
      <Chords names={t.chords} />
      <div className="row tight wrap">
        <BpmControl bpm={tab.bpm} setBpm={(n) => setMyTabBpm(tab.id, n)} />
        <button className="btn primary" onClick={() => setFull(true)}>⛶ מסך מלא + גלילה</button>
      </div>
      <p className="small muted">שים את הקצב שבו אתה מנגן; במסך המלא הגלילה זזה לפיו ({tab.beats} פעמות בכל תיבה).</p>
      <TabRows t={t} />
      <button className="btn ghost" onClick={() => go(`mytabs/${tab.id}/edit`)}>✏️ עריכה</button>
      {full && (
        <TabFull lines={t.lines} title={tab.title} chordLine={t.chordLine} sections={t.sections} beatsPerBar={tab.beats} bpm={tab.bpm}
          barFrom={1} onBpm={(n) => setMyTabBpm(tab.id, n)} onClose={() => setFull(false)} />
      )}
    </div>
  );
}

export function MyTabs({ id, mode }: { id?: string; mode?: string }) {
  const s = useStore();
  if (id === 'new') return <Editor />;
  const tab = id ? s.myTabs.find((x) => x.id === id) : undefined;
  if (id && !tab) return <div className="screen"><p>הטאב לא נמצא.</p><button className="btn" onClick={() => go('mytabs')}>→ הטאבים שלי</button></div>;
  if (tab) return mode === 'edit' ? <Editor key={tab.id} tab={tab} /> : <View tab={tab} />;
  return (
    <div className="screen">
      <button className="back" onClick={() => go('daily')}>→ לגיטרה</button>
      <h1>📝 הטאבים שלי</h1>
      <p className="muted small">טאבים שאתה מדביק מכל מקום – אתר, ספר, מורה. נשמרים רק במכשיר הזה, ומקבלים מסך מלא, אקורדים מעל הטאב וגלילה לפי הקצב.</p>
      <button className="btn primary wide" onClick={() => go('mytabs/new')}>➕ טאב חדש</button>
      {s.myTabs.length === 0 && <p className="small muted">עוד אין טאבים. לחץ "טאב חדש" והדבק טאב.</p>}
      {s.myTabs.map((x) => {
        const p = parseTabText(x.text);
        return (
          <button key={x.id} className="lesson-row open" onClick={() => go('mytabs/' + x.id)}>
            <span className="lr-badge">🎸</span>
            <span className="lr-title"><bdi>{x.title}</bdi><br /><small className="muted">{p.bars} תיבות{p.chords.length ? <> · <bdi dir="ltr">{p.chords.slice(0, 6).join(' ')}</bdi></> : ''} · {x.bpm} BPM</small></span>
          </button>
        );
      })}
    </div>
  );
}
