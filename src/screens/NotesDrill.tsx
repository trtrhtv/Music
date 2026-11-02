import { useState } from 'react';
import { playChord, playNote } from '../audio/synth';
import { Keyboard, type KeyMark } from '../components/Keyboard';
import { Staff } from '../components/Staff';
import { KEYS, checkKeys, checkNames, makeDrillQ, type DrillOptions, type DrillQ } from '../engine/noteDrill';
import { NATURALS } from '../theory/theory';

/**
 * Piano note reading: see a note or a chord, write what it is (or what notes it's built from),
 * then find it on the keyboard.
 */

type Steps = 'both' | 'write' | 'play';
interface Settings extends DrillOptions { steps: Steps }
const KEY = 'notes-drill';
const DEFAULTS: Settings = { kind: 'note', clef: 'treble', accidentals: false, moreChords: false, chordShow: 'name', steps: 'both' };
const load = (): Settings => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULTS; } };
const nice = (n: string) => n.replace(/#/g, '♯').replace(/b/g, '♭');
const ROLE = ['שורש', 'טרצה', 'קווינטה', 'ספטימה'];

function Choice<T extends string | boolean>({ label, value, set, options }: { label: string; value: T; set: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="nd-opt">
      <span className="small muted">{label}</span>
      <div className="chips">{options.map(([v, l]) => <button key={String(v)} className={`chip ${value === v ? 'on' : ''}`} onClick={() => set(v)}>{l}</button>)}</div>
    </div>
  );
}

export function NotesDrill() {
  const [cfg, setCfg] = useState<Settings>(load);
  const [q, setQ] = useState<DrillQ>(() => makeDrillQ(load()));
  const [phase, setPhase] = useState<'write' | 'play'>(load().steps === 'play' ? 'play' : 'write');
  const [names, setNames] = useState<string[]>([]);
  const [accNext, setAccNext] = useState<'' | '#' | 'b'>('');
  const [written, setWritten] = useState<{ ok: boolean; enharmonic: boolean } | null>(null);
  const [keys, setKeys] = useState<number[]>([]);
  const [played, setPlayed] = useState<boolean | null>(null);
  const [score, setScore] = useState({ w: 0, wn: 0, p: 0, pn: 0 });

  const update = (patch: Partial<Settings>) => {
    const next = { ...cfg, ...patch };
    setCfg(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
    fresh(next);
  };
  function fresh(c = cfg) {
    setQ(makeDrillQ(c));
    setPhase(c.steps === 'play' ? 'play' : 'write');
    setNames([]); setAccNext(''); setWritten(null); setKeys([]); setPlayed(null);
  }
  const hear = () => (q.kind === 'note' ? playNote(q.midis[0], { dur: 1.2 }) : playChord(q.midis, { dur: 1.6 }));
  const need = q.names.length;

  const addLetter = (l: string) => {
    if (written) return;
    const n = l + accNext;
    setAccNext('');
    setNames(q.kind === 'note' ? [n] : names.length < need ? [...names, n] : names);
  };
  const checkWrite = () => {
    const r = checkNames(q, names);
    setWritten(r);
    setScore((s) => ({ ...s, w: s.w + (r.ok ? 1 : 0), wn: s.wn + 1 }));
    hear();
  };
  const pressKey = (m: number) => {
    if (played !== null) return;
    playNote(m, { dur: 0.6 });
    setKeys(q.kind === 'note' ? [m] : keys.includes(m) ? keys.filter((k) => k !== m) : [...keys, m]);
  };
  const checkPlay = () => {
    const ok = checkKeys(q, keys);
    setPlayed(ok);
    setScore((s) => ({ ...s, p: s.p + (ok ? 1 : 0), pn: s.pn + 1 }));
    hear();
  };
  const afterWrite = () => (cfg.steps === 'write' ? fresh() : setPhase('play'));

  const chordLine = q.kind === 'chord' ? q.names.map((n, i) => `${nice(n)} (${ROLE[i]})`).join(' · ') : '';
  const want = new Set(q.midis.map((m) => m % 12));
  const marks: KeyMark[] = played === null
    ? keys.map((m) => ({ midi: m, kind: 'sel' }))
    : [
      ...keys.map((m): KeyMark => ({ midi: m, kind: (q.kind === 'note' ? m === q.midis[0] : want.has(m % 12)) ? 'ok' : 'bad' })),
      ...q.midis.filter((m) => !keys.includes(m)).map((m): KeyMark => ({ midi: m, kind: 'hint' })),
    ];
  const [lo, hi] = KEYS[q.clef];

  return (
    <div className="notes-drill">
      <details className="plan-intro">
        <summary>⚙️ הגדרות התרגול</summary>
        <Choice label="מה לתרגל" value={cfg.kind} set={(v) => update({ kind: v })} options={[['note', 'תו בודד'], ['chord', 'אקורד'], ['mix', 'מעורב']]} />
        <Choice label="מפתח" value={cfg.clef} set={(v) => update({ clef: v })} options={[['treble', 'סול (יד ימין)'], ['bass', 'פה (יד שמאל)'], ['both', 'שניהם']]} />
        <Choice label="דיאזים ובמולים" value={cfg.accidentals} set={(v) => update({ accidentals: v })} options={[[false, 'בלי'], [true, 'עם ♯ ו-♭']]} />
        <Choice label="אקורדים" value={cfg.moreChords} set={(v) => update({ moreChords: v })} options={[[false, 'מז\'ור ומינור'], [true, '+ מוקטן, מוגדל ו-7']]} />
        <Choice label="איך מוצג אקורד" value={cfg.chordShow} set={(v) => update({ chordShow: v })} options={[['name', 'שם (Dm)'], ['staff', 'תווים על החמשה'], ['mix', 'מעורב']]} />
        <Choice label="שלבים" value={cfg.steps} set={(v) => update({ steps: v })} options={[['both', 'לכתוב ואז לנגן'], ['write', 'רק לכתוב'], ['play', 'רק לנגן']]} />
      </details>

      <p className="small muted">{cfg.steps !== 'play' && `כתיבה: ${score.w}/${score.wn}`}{cfg.steps === 'both' && ' · '}{cfg.steps !== 'write' && `מקלדת: ${score.p}/${score.pn}`}</p>

      <div className="nd-card">
        <div className="nd-prompt">
          {q.kind === 'note'
            ? (phase === 'play' && cfg.steps === 'play' ? 'מצא את התו על המקלדת – בדיוק את הקליד הזה:' : 'איזה תו כתוב כאן?')
            : q.show === 'name'
              ? <>מאילו תווים בנוי האקורד <b dir="ltr" className="nd-symbol">{nice(q.symbol!)}</b>?</>
              : 'אילו תווים כתובים כאן? (כולם ביחד = אקורד)'}
        </div>
        {(q.kind === 'note' || q.show === 'staff') && <Staff spec={{ clef: q.clef, notes: q.staff, chord: q.kind === 'chord' }} />}
        <p className="small muted">{q.clef === 'treble' ? '𝄞 מפתח סול' : '𝄢 מפתח פה'}</p>
      </div>

      {phase === 'write' && (
        <div className="nd-write">
          <div className="nd-answer" dir="ltr">
            {Array.from({ length: need }, (_, i) => <span key={i} className={`nd-slot ${names[i] ? 'full' : ''}`}>{names[i] ? nice(names[i]) : '?'}</span>)}
          </div>
          {!written && (
            <>
              <div className="row tight nd-acc">
                {([['b', '♭ במול'], ['', '♮'], ['#', '♯ דיאז']] as const).map(([a, l]) => <button key={a} className={`btn small ${accNext === a ? 'primary' : 'ghost'}`} onClick={() => setAccNext(a)}>{l}</button>)}
              </div>
              <div className="nd-letters" dir="ltr">
                {NATURALS.map((l) => <button key={l} className="btn" onClick={() => addLetter(l)}>{l}{accNext && <small>{nice(accNext)}</small>}</button>)}
              </div>
              <p className="small muted">{q.kind === 'chord' ? `בחר ${need} תווים, מהשורש למעלה. דיאז או במול – לחץ עליו לפני האות.` : 'דיאז או במול – לחץ עליו לפני האות.'}</p>
              <div className="row tight">
                <button className="btn ghost" onClick={() => setNames(names.slice(0, -1))} disabled={!names.length}>⌫ מחק</button>
                <button className="btn primary" onClick={checkWrite} disabled={names.length !== need}>בדוק</button>
              </div>
            </>
          )}
          {written && (
            <div className={`feedback ${written.ok ? 'right' : 'wrong'}`}>
              <p>{written.ok ? '✓ נכון!' : written.enharmonic ? '≈ כמעט – זה אותו קליד, אבל כאן הוא כתוב בשם אחר.' : '✗ לא בדיוק.'}</p>
              <p dir="auto">{q.kind === 'note' ? <>התו: <b dir="ltr">{nice(q.staff[0])}</b></> : <><b dir="ltr">{nice(q.symbol!)}</b> ({q.quality}) = {chordLine}</>}</p>
              <div className="row tight">
                <button className="btn ghost small" onClick={hear}>🔊 השמע</button>
                <button className="btn primary" onClick={afterWrite}>{cfg.steps === 'write' ? 'הבא ←' : 'עכשיו על המקלדת ←'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'play' && (
        <div className="nd-play">
          <p className="small">{q.kind === 'note' ? 'לחץ על הקליד של התו – באוקטבה הנכונה (C4 = C האמצעי).' : 'לחץ על כל תווי האקורד (באיזו אוקטבה שתרצה), ואז "בדוק". לחיצה שנייה מבטלת.'}</p>
          <Keyboard from={lo} to={hi} labels={played !== null} marks={marks} onPress={pressKey} />
          {played === null
            ? <button className="btn primary wide" onClick={checkPlay} disabled={!keys.length}>בדוק</button>
            : (
              <div className={`feedback ${played ? 'right' : 'wrong'}`}>
                <p>{played ? '✓ נכון!' : '✗ לא בדיוק – הקלידים הנכונים מסומנים.'} {q.kind === 'note' ? <span dir="ltr">{nice(q.staff[0])}</span> : <span>{chordLine}</span>}</p>
                <button className="btn primary" onClick={() => fresh()}>הבא ←</button>
              </div>
            )}
        </div>
      )}

    </div>
  );
}
