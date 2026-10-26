import { useEffect, useRef, useState } from 'react';
import { MicListener } from '../audio/mic';
import { playChord, playNote } from '../audio/synth';
import { ChordDiagram } from '../components/ChordDiagram';
import { Fretboard, type FretMark } from '../components/Fretboard';
import { NECK_ROOTS, NECK_SETS, neckMarks } from '../theory/neckMap';
import { Keyboard } from '../components/Keyboard';
import { MicDenied } from '../components/MicTasks';
import { Metronome } from '../components/RhythmTools';
import { CHORD_SHAPES } from '../engine/guitarChords';
import { GUITAR_TUNING, freqToMidiFloat, noteNameOct } from '../theory/theory';

type Tab = 'tuner' | 'metro' | 'piano' | 'neck' | 'chords';

export function Tools() {
  const [tab, setTab] = useState<Tab>('tuner');
  return (
    <div className="screen">
      <h1>🧰 כלים</h1>
      <div className="chips">
        {([['tuner', 'מכוון'], ['metro', 'מטרונום'], ['piano', 'מקלדת'], ['neck', 'צוואר'], ['chords', 'אקורדים']] as [Tab, string][]).map(([t, l]) => (
          <button key={t} className={`chip ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{l}</button>
        ))}
      </div>
      {tab === 'tuner' && <Tuner />}
      {tab === 'metro' && <><Metronome initial={70} /><Metronome initial={60} beats={3} /></>}
      {tab === 'piano' && <FreePiano />}
      {tab === 'neck' && <FreeNeck />}
      {tab === 'chords' && <ChordLib />}
    </div>
  );
}

function Tuner() {
  const [on, setOn] = useState(false);
  const [denied, setDenied] = useState(false);
  const [read, setRead] = useState<{ name: string; cents: number } | null>(null);
  const smooth = useRef<number | null>(null);
  useEffect(() => {
    if (!on) return;
    const mic = new MicListener();
    mic.start((f) => {
      if (!f.freq) return;
      const m = freqToMidiFloat(f.freq);
      smooth.current = smooth.current === null || Math.abs(smooth.current - m) > 0.7 ? m : smooth.current * 0.8 + m * 0.2;
      const r = Math.round(smooth.current);
      setRead({ name: noteNameOct(r), cents: Math.round((smooth.current - r) * 100) });
    }).catch(() => setDenied(true));
    return () => mic.stop();
  }, [on]);
  const inTune = read && Math.abs(read.cents) <= 5;
  return (
    <div className="tuner">
      {denied ? <MicDenied /> : !on ? (
        <button className="btn primary big" onClick={() => setOn(true)}>🎤 הפעל מכוון</button>
      ) : (
        <>
          <div className={`tuner-note ${inTune ? 'in' : ''}`} dir="ltr">{read?.name ?? '—'}</div>
          <div className="tuner-meter" dir="ltr">
            <div className="tuner-center" />
            <div className="tuner-needle" style={{ left: `${50 + (read?.cents ?? 0)}%` }} />
          </div>
          <div className="muted" dir="ltr">{read ? `${read.cents > 0 ? '+' : ''}${read.cents} cents` : 'נגן מיתר…'}</div>
          <button className="btn ghost" onClick={() => setOn(false)}>כבה</button>
        </>
      )}
      <h3 className="section-title">צלילי ייחוס – כיוון סטנדרטי</h3>
      <div className="row wrap" dir="ltr">
        {GUITAR_TUNING.map((m, i) => (
          <button key={m} className="btn demo" onClick={() => playNote(m, { timbre: 'guitar', dur: 2 })}>{6 - i}: {noteNameOct(m)}</button>
        ))}
      </div>
    </div>
  );
}

function FreePiano() {
  const [last, setLast] = useState<number | null>(null);
  return (
    <>
      <p className="muted">מקלדת חופשית לניסויים. {last !== null && <b dir="ltr">{noteNameOct(last)}</b>}</p>
      <Keyboard from={48} to={72} labels marks={last !== null ? [{ midi: last, kind: 'sel' }] : []} onPress={(m) => { setLast(m); playNote(m); }} />
    </>
  );
}

function FreeNeck() {
  const [names, setNames] = useState(false);
  const [root, setRoot] = useState('A');
  const [set, setSet] = useState('');
  const [show, setShow] = useState<'names' | 'degrees'>('degrees');
  const def = NECK_SETS.find((x) => x.id === set);
  const marks: FretMark[] = def ? neckMarks(root, def, show) : [];
  return (
    <>
      <p className="muted small">מפת צוואר: בחר סולם או אקורד, וראה את כל המקומות שלו על הצוואר – בשמות תווים או במספרי דרגות. לחיצה על משבצת משמיעה אותה.</p>
      <div className="neck-controls">
        <select value={root} onChange={(e) => setRoot(e.target.value)} aria-label="שורש" dir="ltr">{NECK_ROOTS.map((r) => <option key={r}>{r}</option>)}</select>
        <select value={set} onChange={(e) => setSet(e.target.value)} aria-label="מה להציג">
          <option value="">— צוואר ריק —</option>
          {NECK_SETS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
        </select>
        {def && (
          <div className="chips">
            <button className={`chip small ${show === 'degrees' ? 'on' : ''}`} onClick={() => setShow('degrees')}>דרגות (1, 3, 5)</button>
            <button className={`chip small ${show === 'names' ? 'on' : ''}`} onClick={() => setShow('names')}>שמות תווים</button>
          </div>
        )}
      </div>
      {def && <p className="small" dir="ltr">{root} · {def.spell(root).join(' ')}</p>}
      {!def && <label className="toggle"><input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} /> הצג את כל שמות התווים</label>}
      <Fretboard maxFret={def ? 15 : 12} marks={marks} showNames={!def && names} onPress={(st, f) => playNote(GUITAR_TUNING[st] + f, { timbre: 'guitar' })} />
      {def && <p className="muted small">הירוק = השורש (1). כדאי לסובב את הטלפון לרוחב – רואים את כל הצוואר.</p>}
    </>
  );
}

function ChordLib() {
  return (
    <div className="chord-lib">
      {CHORD_SHAPES.map((c) => (
        <button key={c.symbol} className="chord-tile" onClick={() => {
          const notes = c.frets.map((f, s) => (f < 0 ? -1 : GUITAR_TUNING[s] + f)).filter((n) => n > 0);
          playChord(notes, { timbre: 'guitar', spread: 0.035, dur: 2 });
        }}>
          <ChordDiagram frets={c.frets} label={c.symbol} />
        </button>
      ))}
    </div>
  );
}
