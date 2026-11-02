import { useMemo, useRef, useState } from 'react';
import { playChord, playNote } from '../audio/synth';
import { Keyboard, type KeyMark } from '../components/Keyboard';
import { Staff } from '../components/Staff';
import { KEYS, checkKeys, checkNames, drillDeck, type DrillOptions, type DrillQ } from '../engine/noteDrill';
import { CHORDS, NATURALS, SOLFEGE } from '../theory/theory';

/**
 * Piano note reading: see a note or a chord, write what it is (or what notes it's built from),
 * then find it on the keyboard.
 */

type Steps = 'both' | 'write' | 'play';
type Naming = 'both' | 'letters' | 'solfege';
interface Settings extends DrillOptions { steps: Steps; /** How notes are named: letters (C), do-re-mi (דו), or both. */ naming: Naming }
// v2: the defaults changed to notes and chords, both clefs.
const KEY = 'notes-drill-v2';
const DEFAULTS: Settings = { kind: 'mix', clef: 'both', accidentals: false, moreChords: false, chordShow: 'mix', steps: 'both', naming: 'both' };
const load = (): Settings => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return DEFAULTS; } };
const nice = (n: string) => n.replace(/#/g, '♯').replace(/b/g, '♭');
/** Do-re-mi name with its sign: "F#" → "פה♯". */
const sol = (n: string) => SOLFEGE[n[0]] + nice(n.slice(1)).replace(/\d/g, '');
const ROLE = ['שורש', 'טרצה', 'קווינטה', 'ספטימה'];

/** Four names to choose from for a chord read off the staff: the right one, the same root with another quality, and other roots. */
function nameOptions(q: DrillQ, more: boolean): string[] {
  const root = q.symbol!.match(/^[A-G][#b]?/)![0];
  const quals = (more ? ['maj', 'min', 'dim', 'aug', 'dom7', 'maj7', 'min7'] : ['maj', 'min']).map((k) => CHORDS[k].symbol);
  const others = [
    ...quals.map((qs) => root + qs),
    ...NATURALS.filter((l) => l !== root[0]).map((l) => l + q.symbol!.slice(root.length)),
  ].filter((x) => x !== q.symbol);
  const pickFrom = [...new Set(others)].sort(() => Math.random() - 0.5).slice(0, 3);
  return [q.symbol!, ...pickFrom].sort(() => Math.random() - 0.5);
}

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
  // Questions come from a shuffled deck: every one once before any repeats.
  const deck = useRef<() => DrillQ>(null as unknown as () => DrillQ);
  if (!deck.current) deck.current = drillDeck(cfg);
  const [q, setQ] = useState<DrillQ>(() => deck.current());
  const [namePick, setNamePick] = useState<string | null>(null);
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
    deck.current = drillDeck(next);
    fresh(next);
  };
  function fresh(c = cfg) {
    setQ(deck.current());
    setPhase(c.steps === 'play' ? 'play' : 'write');
    setNames([]); setAccNext(''); setWritten(null); setKeys([]); setPlayed(null); setNamePick(null);
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
  // A chord read off the staff: after its notes, also say what it's called.
  const askName = q.kind === 'chord' && q.show === 'staff';
  const options = useMemo(() => (q.kind === 'chord' ? nameOptions(q, cfg.moreChords) : []), [q, cfg.moreChords]);
  const pickName = (n: string) => {
    if (namePick) return;
    setNamePick(n);
    setScore((s) => ({ ...s, w: s.w + (n === q.symbol ? 1 : 0), wn: s.wn + 1 }));
  };
  const writeDone = written !== null && (!askName || namePick !== null);

  /** A note's name the way the player chose: letters, do-re-mi, or both. */
  // The letter part is isolated left-to-right, so "B♭" doesn't turn into "♭B" inside Hebrew text.
  const label = (n: string) => (
    <span className="nd-name">
      {cfg.naming !== 'solfege' && <bdi dir="ltr">{nice(n)}</bdi>}
      {cfg.naming === 'both' && ' '}
      {cfg.naming !== 'letters' && sol(n)}
    </span>
  );
  const octave = (n: string) => n.match(/\d$/)?.[0] ?? '';
  const chordLine = q.kind === 'chord' ? q.names.map((n, i) => <span key={i}>{i > 0 && ' · '}{label(n)} ({ROLE[i]})</span>) : null;
  const want = new Set(q.midis.map((m) => m % 12));
  const marks: KeyMark[] = played === null
    ? keys.map((m) => ({ midi: m, kind: 'sel' }))
    : [
      ...keys.map((m): KeyMark => ({ midi: m, kind: (q.kind === 'note' ? m === q.midis[0] : want.has(m % 12)) ? 'ok' : 'bad' })),
      ...q.midis.filter((m) => !keys.includes(m)).map((m): KeyMark => ({ midi: m, kind: 'hint' })),
    ];
  const [lo, hi] = KEYS[q.clef];
  const keyLabels = cfg.naming === 'letters' ? true : cfg.naming;
  /** All three together: the name, how it's written, and where it is on the keys. */
  const reveal = (withKeys: boolean) => (
    <div className="nd-reveal">
      <p className="small"><b>{q.kind === 'chord' ? <><bdi dir="ltr">{nice(q.symbol!)}</bdi> ({q.quality})</> : label(q.names[0])}</b> – כך זה כתוב{withKeys ? ', וכאן זה על המקלדת' : ''}:</p>
      <Staff spec={{ clef: q.clef, notes: q.staff, chord: q.kind === 'chord' }} labels={q.names.map((n) => (cfg.naming === 'solfege' ? sol(n) : nice(n)))} />
      {withKeys && <Keyboard from={lo} to={hi} labels={keyLabels} marks={q.midis.map((m) => ({ midi: m, kind: 'ok' as const }))} onPress={(m) => playNote(m, { dur: 0.6 })} />}
    </div>
  );

  return (
    <div className="notes-drill">
      <details className="plan-intro">
        <summary>⚙️ הגדרות התרגול</summary>
        <Choice label="מה לתרגל" value={cfg.kind} set={(v) => update({ kind: v })} options={[['note', 'תו בודד'], ['chord', 'אקורד'], ['mix', 'מעורב']]} />
        <Choice label="מפתח" value={cfg.clef} set={(v) => update({ clef: v })} options={[['treble', 'סול (יד ימין)'], ['bass', 'פה (יד שמאל)'], ['both', 'שניהם']]} />
        <Choice label="דיאזים ובמולים" value={cfg.accidentals} set={(v) => update({ accidentals: v })} options={[[false, 'בלי'], [true, 'עם ♯ ו-♭']]} />
        <Choice label="אקורדים" value={cfg.moreChords} set={(v) => update({ moreChords: v })} options={[[false, 'מז\'ור ומינור'], [true, '+ מוקטן, מוגדל ו-7']]} />
        <Choice label="איך מוצג אקורד" value={cfg.chordShow} set={(v) => update({ chordShow: v })} options={[['name', 'שם (Dm)'], ['staff', 'תווים על החמשה'], ['mix', 'מעורב']]} />
        <Choice label="שמות התווים" value={cfg.naming} set={(v) => update({ naming: v })} options={[['both', 'גם וגם (C דו)'], ['letters', 'אותיות (C D E)'], ['solfege', 'דו רה מי']]} />
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
            {Array.from({ length: need }, (_, i) => (
              <span key={i} className={`nd-slot ${names[i] ? 'full' : ''}`}>
                {!names[i] ? '?' : cfg.naming === 'solfege' ? sol(names[i]) : nice(names[i])}
                {names[i] && cfg.naming === 'both' && <small>{sol(names[i])}</small>}
              </span>
            ))}
          </div>
          {!written && (
            <>
              <div className="row tight nd-acc">
                {([['b', '♭ במול'], ['', '♮'], ['#', '♯ דיאז']] as const).map(([a, l]) => <button key={a} className={`btn small ${accNext === a ? 'primary' : 'ghost'}`} onClick={() => setAccNext(a)}>{l}</button>)}
              </div>
              <div className="nd-letters" dir="ltr">
                {NATURALS.map((l) => (
                  <button key={l} className="btn nd-letter" onClick={() => addLetter(l)}>
                    <span>{cfg.naming === 'solfege' ? SOLFEGE[l] : l}{accNext && nice(accNext)}</span>
                    {cfg.naming === 'both' && <small>{SOLFEGE[l]}</small>}
                  </button>
                ))}
              </div>
              <p className="small muted">{q.kind === 'chord' ? `בחר ${need} תווים, מהשורש למעלה. דיאז או במול – לחץ עליו לפני התו.` : 'דיאז או במול – לחץ עליו לפני התו.'}</p>
              <div className="row tight">
                <button className="btn ghost" onClick={() => setNames(names.slice(0, -1))} disabled={!names.length}>⌫ מחק</button>
                <button className="btn primary" onClick={checkWrite} disabled={names.length !== need}>בדוק</button>
              </div>
            </>
          )}
          {written && (
            <div className={`feedback ${written.ok ? 'right' : 'wrong'}`}>
              <p>{written.ok ? '✓ נכון!' : written.enharmonic ? '≈ כמעט – זה אותו קליד, אבל כאן הוא כתוב בשם אחר.' : '✗ לא בדיוק.'}</p>
              {q.kind === 'note'
                ? <p>התו: <b>{label(q.names[0])}</b> <span className="muted" dir="ltr">({nice(q.staff[0])})</span></p>
                : <p>התווים: {chordLine}</p>}
              {askName && (
                <div className="nd-namepick">
                  <p className="small"><b>ואיך קוראים לאקורד הזה?</b></p>
                  <div className="nd-names" dir="ltr">
                    {options.map((o) => (
                      <button key={o} className={`btn ${namePick === null ? 'ghost' : o === q.symbol ? 'primary' : o === namePick ? 'bad' : 'ghost'}`} onClick={() => pickName(o)}>{nice(o)}</button>
                    ))}
                  </div>
                  {namePick && <p className="small">{namePick === q.symbol ? '✓ נכון!' : '✗ לא.'} זה <bdi dir="ltr">{nice(q.symbol!)}</bdi> – {q.quality}.</p>}
                </div>
              )}
              {writeDone && (cfg.steps === 'write' || q.show === 'name') && reveal(cfg.steps === 'write')}
              <div className="row tight">
                <button className="btn ghost small" onClick={hear}>🔊 השמע</button>
                <button className="btn primary" onClick={afterWrite} disabled={!writeDone}>{cfg.steps === 'write' ? 'הבא ←' : 'עכשיו על המקלדת ←'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'play' && (
        <div className="nd-play">
          <p className="small">{q.kind === 'note' ? 'לחץ על הקליד של התו – באוקטבה הנכונה (C4 = C האמצעי).' : 'לחץ על כל תווי האקורד (באיזו אוקטבה שתרצה), ואז "בדוק". לחיצה שנייה מבטלת.'}</p>
          <Keyboard from={lo} to={hi} labels={played === null ? false : cfg.naming === 'letters' ? true : cfg.naming} marks={marks} onPress={pressKey} />
          {played === null
            ? <button className="btn primary wide" onClick={checkPlay} disabled={!keys.length}>בדוק</button>
            : (
              <div className={`feedback ${played ? 'right' : 'wrong'}`}>
                <p>{played ? '✓ נכון!' : '✗ לא בדיוק – הקלידים הנכונים מסומנים.'} {q.kind === 'note' ? <b>{label(q.names[0])} <span dir="ltr">{octave(q.staff[0])}</span></b> : <span>{chordLine}</span>}</p>
                {reveal(false)}
                <button className="btn primary" onClick={() => fresh()}>הבא ←</button>
              </div>
            )}
        </div>
      )}

    </div>
  );
}
