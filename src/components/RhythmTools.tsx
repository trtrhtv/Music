import { useEffect, useRef, useState } from 'react';
import { Loop, countLabels, parseSlots, type Rhythm } from '../audio/rhythm';
import { audio, output } from '../audio/synth';
import { TabPlayer, parseTab } from '../audio/tabPlayer';
import { NoteCheck } from './NoteCheck';

function BpmControl({ bpm, setBpm }: { bpm: number; setBpm: (n: number) => void }) {
  const clamp = (n: number) => Math.max(30, Math.min(220, Math.round(n)));
  return (
    <div className="bpm-ctl" dir="ltr">
      <button onClick={() => setBpm(clamp(bpm - 5))} aria-label="איטי יותר">−5</button>
      <button onClick={() => setBpm(clamp(bpm - 1))} aria-label="איטי יותר">−</button>
      <span className="bpm-val">{bpm}<small> BPM</small></span>
      <button onClick={() => setBpm(clamp(bpm + 1))} aria-label="מהר יותר">+</button>
      <button onClick={() => setBpm(clamp(bpm + 5))} aria-label="מהר יותר">+5</button>
    </div>
  );
}

/** Stand-alone metronome. */
export function Metronome({ initial = 70, beats = 4, onBpm }: { initial?: number; beats?: number; onBpm?: (n: number) => void }) {
  const [bpm, setBpm] = useState(initial);
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(-1);
  const loop = useRef<Loop | null>(null);
  useEffect(() => () => loop.current?.stop(), []);
  useEffect(() => {
    loop.current?.update({ bpm });
    onBpm?.(bpm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpm]);
  const toggle = () => {
    if (on) {
      loop.current?.stop();
      setOn(false);
      setBeat(-1);
      return;
    }
    // All-rest eighths: only the beat clicks sound.
    const l = new Loop({ bpm, rhythm: { slots: Array(beats * 2).fill('-').join(' '), sub: 2, beats }, onSlot: (i) => setBeat(Math.floor(i / 2)) });
    loop.current = l;
    l.start();
    setOn(true);
  };
  return (
    <div className="rt-box">
      <div className="rt-head">⏱️ מטרונום</div>
      <BpmControl bpm={bpm} setBpm={setBpm} />
      <div className="beat-dots" dir="ltr">{Array.from({ length: beats }, (_, i) => <span key={i} className={i === beat ? 'on' : ''} />)}</div>
      <button className={`btn ${on ? 'ghost' : 'primary'} wide`} onClick={toggle}>{on ? '■ עצור' : '▶ הפעל'}</button>
    </div>
  );
}

const SLOT_GLYPH: Record<string, string> = { D: '↓', U: '↑', X: '✕', '-': '·' };

/** Visual + audible strum pattern. `chords` are fret voicings cycled once per bar. */
export function StrumPattern({ name, rhythm, bpm: initialBpm = 70, chords, chordNames, note }: {
  name: string; rhythm: Rhythm; bpm?: number; chords?: number[][]; chordNames?: string[]; note?: string;
}) {
  const [bpm, setBpm] = useState(initialBpm);
  const [on, setOn] = useState(false);
  const [cur, setCur] = useState(-1);
  const [withChords, setWithChords] = useState(true);
  const loop = useRef<Loop | null>(null);
  const slots = parseSlots(rhythm.slots);
  const labels = countLabels(rhythm);
  const defaultChord = [[0, 2, 2, 0, 0, 0]];
  useEffect(() => () => loop.current?.stop(), []);
  useEffect(() => { loop.current?.update({ bpm }); }, [bpm]);
  useEffect(() => { loop.current?.update({ chords: withChords ? (chords ?? defaultChord) : [] }); }, [withChords]); // eslint-disable-line react-hooks/exhaustive-deps
  const toggle = () => {
    if (on) {
      loop.current?.stop();
      setOn(false);
      setCur(-1);
      return;
    }
    const l = new Loop({ bpm, rhythm, chords: withChords ? (chords ?? defaultChord) : [], onSlot: setCur });
    loop.current = l;
    l.start();
    setOn(true);
  };
  return (
    <div className="rt-box">
      <div className="rt-head">🥁 {name}{rhythm.swing ? ' (שאפל)' : ''}</div>
      <div className="strum-grid" dir="ltr" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
        {slots.map((s, i) => (
          <div key={i} className={`sg-cell ${i === cur ? 'now' : ''} ${i % rhythm.sub === 0 ? 'beat' : ''}`}>
            <span className={`sg-glyph k-${s.kind} ${s.accent ? 'acc' : ''} ${s.soft ? 'soft' : ''}`}>{SLOT_GLYPH[s.kind]}</span>
            <span className="sg-count">{labels[i]}</span>
          </div>
        ))}
      </div>
      <div className="muted small">↓ למטה · ↑ למעלה · ✕ מיתרים מושתקים ("צ'יק") · · היד זזה בלי לפגוע · חץ גדול וצבעוני = חזק, קטן ושקוף = חלש</div>
      {chordNames && <div className="small">אקורדים בלופ: <bdi className="wrap">{chordNames.join(' → ')}</bdi> (אקורד אחד לכל סבב של הטבלה)</div>}
      {note && <p className="small">{note}</p>}
      <BpmControl bpm={bpm} setBpm={setBpm} />
      <label className="toggle small"><input type="checkbox" checked={withChords} onChange={(e) => setWithChords(e.target.checked)} /> להשמיע גם את הגיטרה (לא רק קליק)</label>
      <button className={`btn ${on ? 'ghost' : 'primary'} wide`} onClick={toggle}>{on ? '■ עצור' : '▶ השמע בלופ'}</button>
    </div>
  );
}

function chime() {
  const c = audio();
  [880, 1320].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = c.currentTime + i * 0.18;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(output());
    o.start(t);
    o.stop(t + 0.7);
  });
}

/** Countdown timer for a practice block. */
export function Timer({ minutes, onDone }: { minutes: number; onDone?: () => void }) {
  const [left, setLeft] = useState(minutes * 60);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setLeft((x) => {
      if (x <= 1) {
        setOn(false);
        chime();
        return 0;
      }
      return x - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [on]);
  // Tell the parent once the time is up (outside the state updater).
  useEffect(() => { if (left === 0) onDone?.(); }, [left, onDone]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="timer" dir="ltr">
      <span className={`timer-val ${left === 0 ? 'done' : ''}`}>{mm}:{ss}</span>
      <button className="btn small" onClick={() => setOn(!on)}>{on ? '⏸' : '▶'}</button>
      <button className="btn ghost small" onClick={() => { setOn(false); setLeft(minutes * 60); }}>↺</button>
    </div>
  );
}

/** Guitar tablature (6 lines, high e on top). */
const TAB_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

/** Full-screen tab, sized so the whole line fits the width; tries to turn the screen sideways. */
function TabFull({ lines, title, onClose }: { lines: string[]; title?: string; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [portrait, setPortrait] = useState(() => matchMedia('(orientation: portrait)').matches);
  // Keep the latest onClose without re-running the effect (that would leave full screen on every render).
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    const el = box.current;
    // Android: full screen + landscape lock. iPhone can't lock, so we show a hint instead.
    el?.requestFullscreen?.().then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape')).catch(() => {});
    const mq = matchMedia('(orientation: portrait)');
    const on = () => setPortrait(mq.matches);
    mq.addEventListener('change', on);
    const esc = () => { if (!document.fullscreenElement) close.current(); };
    document.addEventListener('fullscreenchange', esc);
    return () => {
      mq.removeEventListener('change', on);
      document.removeEventListener('fullscreenchange', esc);
      screen.orientation?.unlock?.();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);
  const perRow = portrait ? 2 : 99;
  const bars = lines.map((l) => l.split('|'));
  const rows: string[][] = [];
  for (let i = 0; i < bars[0].length; i += perRow) rows.push(bars.map((b) => b.slice(i, i + perRow).join('|')));
  return (
    <div className="tab-full" ref={box}>
      <div className="tab-full-bar">
        <span className="small">{title}</span>
        <button className="btn small" onClick={onClose}>✕ סגור</button>
      </div>
      {portrait && <p className="muted small">💡 סובב את הטלפון לרוחב – כל השורה תיכנס, והטאב יהיה גדול יותר.</p>}
      {/* Upright: two bars per row so it stays readable. Monospace glyphs are ~0.6em wide, so the font size is the one that fits a row. */}
      {rows.map((r, i) => (
        <pre key={i} className="tab" dir="ltr" style={{ fontSize: `min(calc((100vw - 48px) / ${(Math.max(...r.map((l) => l.length)) + 3) * 0.6}), 26px)` }}>
          {r.map((l, k) => `${TAB_NAMES[k]}|${l}|`).join('\n')}
        </pre>
      ))}
    </div>
  );
}

export function TabView({ lines, title, sub = 2 }: { lines: string[]; title?: string; sub?: number }) {
  const [full, setFull] = useState(false);
  const [bpm, setBpm] = useState(sub === 3 ? 50 : 60);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [checking, setChecking] = useState(false);
  const player = useRef<TabPlayer | null>(null);
  useEffect(() => () => player.current?.stop(), []);
  const events = parseTab(lines);
  // Single-note lines (scales, riffs) can be checked by ear through the mic.
  const melody = events.length >= 4 && events.every((e) => e.length === 1) ? events.map((e) => e[0]) : null;
  const toggle = () => {
    if (playing) { player.current?.stop(); return; }
    player.current = new TabPlayer(events, setStep, () => { setPlaying(false); setStep(-1); });
    player.current.start(bpm, sub);
    setPlaying(true);
  };
  const text = lines.map((l, i) => `${TAB_NAMES[i]}|${l}|`).join('\n');
  return (
    <figure className="tab-fig">
      <figcaption>
        <span>{title}</span>
        <button className="link small" onClick={() => setFull(true)}>⛶ מסך מלא</button>
      </figcaption>
      <div className="tab-play">
        <button className={`btn small ${playing ? 'ghost' : 'primary'}`} onClick={toggle}>{playing ? '■ עצור' : '▶ השמע'}</button>
        <BpmControl bpm={bpm} setBpm={(n) => { setBpm(n); if (playing) player.current?.stop(); }} />
        {playing && <span className="small muted" dir="ltr">{step + 1}/{events.length}</span>}
        {melody && !checking && <button className="btn small ghost" onClick={() => setChecking(true)}>🎤 בדוק אותי</button>}
      </div>
      {checking && melody && <NoteCheck notes={melody} onClose={() => setChecking(false)} />}
      <pre className="tab" dir="ltr">{text}</pre>
      {full && <TabFull lines={lines} title={title} onClose={() => setFull(false)} />}
    </figure>
  );
}
