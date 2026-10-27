import { useEffect, useMemo, useState } from 'react';
import { playCue } from '../audio/cue';
import { playChord, playNote } from '../audio/synth';
import type { Exercise } from '../engine/types';
import { GUITAR_TUNING, PC_SHARP, pc } from '../theory/theory';
import { ChordDiagram } from './ChordDiagram';
import { Fretboard, type FretMark } from './Fretboard';
import { Keyboard, type KeyMark } from './Keyboard';
import { MicChordTask, MicNoteTask } from './MicTasks';
import { Staff } from './Staff';
import { Blocks } from './Blocks';
import { rich } from './rich';
import { HELP } from '../data/help';
import { GLOSSARY_BY_ID } from '../data/glossary';

export type Outcome = 'right' | 'wrong' | 'skip';

/** Renders one exercise of any kind; calls onDone once the learner moves on. */
export function ExerciseView({ ex, genId, onDone }: { ex: Exercise; genId?: string; onDone: (o: Outcome) => void }) {
  const [result, setResult] = useState<Outcome | null>(null);
  const [help, setHelp] = useState(false);
  const finish = (o: Outcome) => setResult((r) => r ?? o);
  const h = genId ? HELP[genId] : undefined;
  return (
    <div className="exercise">
      <div className="prompt-row">
        <h2 className="prompt">{rich(ex.prompt)}</h2>
        {h && <button className="help-btn" aria-label="מה זה?" onClick={() => setHelp(true)}>?</button>}
      </div>
      {help && h && <HelpSheet tip={h.tip} topics={h.topics} onClose={() => setHelp(false)} />}
      {ex.kind === 'choice' && <ChoiceBody ex={ex} result={result} finish={finish} />}
      {ex.kind === 'keys' && <KeysBody ex={ex} result={result} finish={finish} />}
      {ex.kind === 'fret' && <FretBody ex={ex} result={result} finish={finish} />}
      {ex.kind === 'micNote' && (
        <MicNoteTask pc={ex.pc} midi={ex.midi} onSuccess={() => finish('right')} />
      )}
      {ex.kind === 'micChord' && (
        <>
          {ex.diagram && <ChordDiagram frets={ex.diagram} label={ex.symbol} />}
          <MicChordTask pcs={ex.pcs} names={ex.names} onSuccess={() => finish('right')} />
        </>
      )}
      {(ex.kind === 'micNote' || ex.kind === 'micChord') && !result && (
        <div className="row">
          <button className="btn ghost" onClick={() => onDone('skip')}>דלג (אין כלי כרגע)</button>
          <button className="btn ghost" onClick={() => finish('wrong')}>לא מצליח</button>
        </div>
      )}
      {result && (
        <div className={`feedback ${result}`}>
          <div className="fb-title">{result === 'right' ? '✓ נכון!' : result === 'wrong' ? '✗ לא בדיוק' : ''}</div>
          {ex.explain && <p className="explain">{rich(ex.explain)}</p>}
          {h && result === 'wrong' && <button className="btn ghost small" onClick={() => setHelp(true)}>❓ הסבר מלא על הנושא</button>}
          <button className="btn primary" autoFocus onClick={() => onDone(result)}>המשך</button>
        </div>
      )}
    </div>
  );
}

/** Bottom sheet with a short tip and glossary entries that open in place (the exercise keeps its state). */
function HelpSheet({ tip, topics, onClose }: { tip: string; topics: string[]; onClose: () => void }) {
  const [topic, setTopic] = useState<string | null>(null);
  const entry = topic ? GLOSSARY_BY_ID[topic] : null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="sheet-head">
          {entry ? <button className="back" onClick={() => setTopic(null)}>→ חזרה</button> : <b>❓ מה זה?</b>}
          <button className="sheet-close" aria-label="סגור" onClick={onClose}>✕</button>
        </div>
        {entry ? (
          <>
            <h2>{entry.icon} {entry.title}</h2>
            <Blocks blocks={entry.blocks} onTopic={setTopic} />
          </>
        ) : (
          <>
            <p className="b-tip">💡 {rich(tip)}</p>
            <p className="muted small">רוצה להבין לעומק? פתח את ההסבר המלא:</p>
            <div className="b-see">
              {topics.filter((t) => GLOSSARY_BY_ID[t]).map((t) => (
                <button key={t} className="chip" onClick={() => setTopic(t)}>{GLOSSARY_BY_ID[t].icon} {GLOSSARY_BY_ID[t].title}</button>
              ))}
            </div>
          </>
        )}
        <button className="btn primary wide" onClick={onClose}>חזרה לתרגיל</button>
      </div>
    </div>
  );
}

type BodyProps<K extends Exercise['kind']> = { ex: Extract<Exercise, { kind: K }>; result: Outcome | null; finish: (o: Outcome) => void };

function ChoiceBody({ ex, result, finish }: BodyProps<'choice'>) {
  const [picked, setPicked] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const play = () => {
    if (!ex.audio) return;
    setPlaying(true);
    const len = playCue(ex.audio, ex.timbre);
    setTimeout(() => setPlaying(false), len * 1000);
  };
  useEffect(() => {
    if (ex.audio) {
      const t = setTimeout(play, 350);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex]);
  return (
    <>
      {ex.staff && <Staff spec={ex.staff} />}
      {ex.diagram && <ChordDiagram frets={ex.diagram} />}
      {ex.audio && (
        <button className={`btn play ${playing ? 'playing' : ''}`} onClick={play}>🔊 השמע שוב</button>
      )}
      <div className={`options ${ex.options.length <= 3 ? 'few' : ''}`}>
        {ex.options.map((o, i) => {
          const cls = result ? (i === ex.answer ? 'right' : i === picked ? 'wrong' : 'dim') : '';
          return (
            <button key={i} className={`option ${cls}`} disabled={!!result}
              onClick={() => { setPicked(i); finish(i === ex.answer ? 'right' : 'wrong'); }}>
              <span>{rich(o)}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function KeysBody({ ex, result, finish }: BodyProps<'keys'>) {
  const [sel, setSel] = useState<number[]>([]);
  const single = ex.pcs.length === 1 && ex.bassPc === undefined;
  const check = (s: number[]) => {
    const set = new Set(s.map(pc));
    const ok = set.size === ex.pcs.length && ex.pcs.every((p) => set.has(p)) &&
      (ex.bassPc === undefined || pc(Math.min(...s)) === ex.bassPc);
    finish(ok ? 'right' : 'wrong');
    if (s.length > 1) playChord([...s].sort((a, b) => a - b), { dur: 1.2 });
  };
  const press = (m: number) => {
    if (result) return;
    playNote(m, { dur: 0.6 });
    if (single) {
      setSel([m]);
      check([m]);
      return;
    }
    setSel((s) => (s.includes(m) ? s.filter((x) => x !== m) : [...s, m]));
  };
  const marks: KeyMark[] = useMemo(() => {
    if (!result) return sel.map((m) => ({ midi: m, kind: 'sel' }));
    const out: KeyMark[] = sel.map((m) => ({ midi: m, kind: ex.pcs.includes(pc(m)) ? 'ok' : 'bad' }));
    if (result === 'wrong') {
      // Show a correct voicing from C4 (or the requested bass) upwards.
      const startPc = ex.bassPc ?? ex.pcs[0];
      let m = 48 + startPc;
      const order = [...ex.pcs].sort((a, b) => ((a - startPc + 12) % 12) - ((b - startPc + 12) % 12));
      for (const p of order) {
        while (pc(m) !== p) m++;
        if (!out.some((k) => k.midi === m)) out.push({ midi: m, kind: 'hint' });
      }
    }
    return out;
  }, [sel, result, ex]);
  return (
    <>
      {!single && <p className="hint-line">בחר {ex.pcs.length} קלידים{ex.bassPc !== undefined ? ' (שים לב איזה תו למטה)' : ''} ולחץ "בדוק"</p>}
      <Keyboard from={48} to={72} marks={marks} onPress={press} />
      {!single && !result && (
        <div className="row">
          <button className="btn ghost" onClick={() => setSel([])}>נקה</button>
          <button className="btn primary" disabled={sel.length === 0} onClick={() => check(sel)}>בדוק</button>
        </div>
      )}
      {result === 'wrong' && <p className="hint-line">התשובה הנכונה מסומנת בכחול: <span dir="ltr">{ex.pcs.map((p) => PC_SHARP[p]).join(' ')}</span></p>}
    </>
  );
}

function FretBody({ ex, result, finish }: BodyProps<'fret'>) {
  const [tap, setTap] = useState<{ s: number; f: number } | null>(null);
  const max = ex.maxFret ?? 12;
  const okAt = (s: number, f: number) => {
    const m = GUITAR_TUNING[s] + f;
    if (ex.string !== undefined && s !== ex.string) return false;
    if (ex.mark && ex.mark.s === s && ex.mark.f === f) return false;
    return ex.midis ? ex.midis.includes(m) : pc(m) === ex.pc;
  };
  const press = (s: number, f: number) => {
    if (result) return;
    playNote(GUITAR_TUNING[s] + f, { timbre: 'guitar', dur: 1 });
    setTap({ s, f });
    finish(okAt(s, f) ? 'right' : 'wrong');
  };
  const marks: FretMark[] = [];
  if (ex.mark) marks.push({ ...ex.mark, kind: 'mark' });
  if (tap) marks.push({ ...tap, kind: result === 'right' ? 'ok' : 'bad' });
  if (result === 'wrong') {
    for (let s = 0; s < 6; s++) for (let f = 0; f <= max; f++) if (okAt(s, f)) marks.push({ s, f, kind: 'hint' });
  }
  return (
    <>
      <Fretboard maxFret={max} marks={marks} onPress={press} highlightString={ex.string} />
      {ex.mark && !result && (
        <button className="btn ghost small" onClick={() => playNote(GUITAR_TUNING[ex.mark!.s] + ex.mark!.f, { timbre: 'guitar' })}>🔊 השמע את התו המסומן</button>
      )}
    </>
  );
}
