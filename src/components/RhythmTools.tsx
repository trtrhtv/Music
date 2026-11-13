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
  // Follow a new starting tempo from outside (e.g. a practice plan raising the BPM), even while playing.
  useEffect(() => setBpm(initial), [initial]);
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

function chime(rounds = 1) {
  const c = audio();
  for (let r = 0; r < rounds; r++) {
    [880, 1320, 1760].forEach((f, i) => {
      const o = c.createOscillator();
      const g = c.createGain();
      const t = c.currentTime + r * 0.9 + i * 0.16;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      o.connect(g).connect(output());
      o.start(t);
      o.stop(t + 0.6);
    });
  }
}

/** The end of a practice block: an alarm you hear over the guitar (four rounds), and a buzz on phones. */
function timeUp() {
  chime(4);
  navigator.vibrate?.([400, 200, 400, 200, 400]);
}

export function Timer({ minutes, onDone }: { minutes: number; onDone?: () => void }) {
  const [left, setLeft] = useState(minutes * 60);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => setLeft((x) => {
      if (x <= 1) {
        setOn(false);
        timeUp();
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
      {left === 0 && <span className="timer-up">⏰ הזמן נגמר</span>}
    </div>
  );
}

/** Guitar tablature (6 lines, high e on top). */
const TAB_NAMES = ['e', 'B', 'G', 'D', 'A', 'E'];

/** Full-screen tab, sized so the whole line fits the width; tries to turn the screen sideways. */
type Orient = 'land' | 'port';
const ORIENT_KEY = 'tab-orient';
const savedOrient = (): Orient => { try { return localStorage.getItem(ORIENT_KEY) === 'port' ? 'port' : 'land'; } catch { return 'land'; } };
const PER_ROW = [2, 4, 6, 8];
const PER_ROW_KEY = 'tab-per-row';
/** Bars per row, chosen separately for upright and sideways (remembered). */
const savedPerRow = (): Record<Orient, number> => {
  try { return { port: 2, land: 4, ...JSON.parse(localStorage.getItem(PER_ROW_KEY) ?? '{}') }; } catch { return { port: 2, land: 4 }; }
};
/** The tempo the auto-scroll follows, when the tab doesn't come with one (remembered). */
const SCROLL_BPM_KEY = 'tab-scroll-bpm';
const savedBpm = (sub: number) => { try { return Number(localStorage.getItem(SCROLL_BPM_KEY)) || (sub === 3 ? 50 : 60); } catch { return sub === 3 ? 50 : 60; } };
type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };

/**
 * Full-screen tab, upright or sideways – the player chooses (and it's remembered).
 * Android can lock the screen that way; where it can't (iPhone, or a phone with rotation locked)
 * the tab itself is turned, so you just turn the phone.
 */
/** "תיבות 29–32 · ↩ שוב מההתחלה: 1–2" – a row's bar numbers, split where the music jumps back. */
function barsLabel(nums: number[], first: boolean) {
  const runs: number[][] = [];
  for (const n of nums) { const r = runs[runs.length - 1]; if (r && n === r[r.length - 1] + 1) r.push(n); else runs.push([n]); }
  const span = (r: number[]) => (r.length > 1 ? `${r[0]}–${r[r.length - 1]}` : `${r[0]}`);
  return runs.map((r, i) => (i === 0 && (first || r[0] !== 1) ? `תיבות ${span(r)}` : `${i === 0 ? '' : ' · '}↩ חוזרים להתחלה: תיבות ${span(r)}`)).join('');
}

export function TabFull({ lines, title, onClose, barFrom, bars: barNums, sub = 2, bpm: tabBpm }: { lines: string[]; title?: string; onClose: () => void; barFrom?: number; bars?: number[]; sub?: number; bpm?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [portrait, setPortrait] = useState(() => matchMedia('(orientation: portrait)').matches);
  const [orient, setOrient] = useState<Orient>(savedOrient);
  // Keep the latest onClose without re-running the effect (that would leave full screen on every render).
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    box.current?.requestFullscreen?.().catch(() => {});
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
  useEffect(() => {
    try { localStorage.setItem(ORIENT_KEY, orient); } catch { /* storage unavailable */ }
    // Ask the phone to turn the screen; if it can't, the CSS rotation below does it.
    const lock = () => (screen.orientation as LockableOrientation).lock?.(orient === 'land' ? 'landscape' : 'portrait').catch(() => {});
    if (document.fullscreenElement) lock(); else setTimeout(lock, 300);
  }, [orient]);
  // Turn the tab when the phone is held differently from the chosen orientation.
  const rotated = (orient === 'land') === portrait;
  const sideways = orient === 'land';
  const width = rotated ? '100vh' : '100vw';
  const [perRowBy, setPerRowBy] = useState<Record<Orient, number>>(savedPerRow);
  const perRow = perRowBy[orient];
  const choosePerRow = (n: number) => {
    const next = { ...perRowBy, [orient]: n };
    setPerRowBy(next);
    try { localStorage.setItem(PER_ROW_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };
  const bars = lines.map((l) => l.split('|'));
  const total = bars[0].length;
  const nums = barNums ?? (barFrom !== undefined ? Array.from({ length: total }, (_, i) => barFrom + i) : undefined);
  const inner = useRef<HTMLDivElement>(null);
  const rowsBox = useRef<HTMLDivElement>(null);
  const [scrolling, setScrolling] = useState(false);
  const [bpm, setBpmState] = useState(() => tabBpm ?? savedBpm(sub));
  const setBpm = (n: number) => { setBpmState(n); try { localStorage.setItem(SCROLL_BPM_KEY, String(n)); } catch { /* storage unavailable */ } };
  const rows: { from: number; lines: string[] }[] = [];
  for (let i = 0; i < total; i += perRow) rows.push({ from: i, lines: bars.map((b) => b.slice(i, i + perRow).join('|')) });
  // One size for every row (the widest one fits), so a short last row doesn't jump bigger.
  const widest = Math.max(...rows.flatMap((r) => r.lines.map((l) => l.length)));
  const fontSize = `min(calc((${width} - 48px) / ${(widest + 3) * 0.6}), 26px)`;
  // How long each row takes to play: every note column is 1/sub of a beat (as in the tab player).
  const rowSecs = rows.map((r) => (parseTab(r.lines).length / sub) * (60 / bpm));
  const rowBeats = rows.length ? Math.round(parseTab(rows[0].lines).length / sub) : 0;
  // Auto-scroll at the tempo: while you play a row, the one before it slides off the top, so the row
  // you're playing is always fully on screen and the next one is right under it. A finger can still
  // scroll; it carries on from there.
  const durs = useRef(rowSecs);
  durs.current = rowSecs;
  useEffect(() => {
    if (!scrolling) return;
    const el = rotated ? inner.current : box.current; // whichever box actually scrolls
    const list = rowsBox.current;
    const bar = list?.previousElementSibling as HTMLElement | null; // the sticky scroll controls
    if (!el || !list) return;
    const atEnd = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    if (atEnd()) el.scrollTop = 0;
    let pos = el.scrollTop;
    let last = performance.now();
    let raf = 0;
    let awake: { release: () => Promise<void> } | undefined;
    navigator.wakeLock?.request('screen').then((l) => { awake = l; }).catch(() => {});
    const speed = () => {
      const covered = bar?.offsetHeight ?? 0;
      // Scroll positions where each row reaches the top (just under the controls).
      const tops = [...list.children].map((c) => list.offsetTop + (c as HTMLElement).offsetTop - covered);
      tops.push(list.offsetTop + list.offsetHeight - covered);
      // Before row 0 reaches the top you're playing row 0; while row k leaves, you're playing row k+1.
      let k = -1;
      while (k + 1 < tops.length - 1 && pos >= tops[k + 1]) k++;
      const from = k < 0 ? 0 : tops[k];
      const to = tops[k + 1];
      const dur = Math.max(0.5, durs.current[Math.min(k + 1, durs.current.length - 1)] ?? 1);
      return Math.max(0, to - from) / dur;
    };
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000);
      last = t;
      if (Math.abs(el.scrollTop - pos) > 3) pos = el.scrollTop; // the player moved it by hand
      pos += speed() * dt;
      el.scrollTop = pos;
      if (atEnd()) { setScrolling(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); awake?.release().catch(() => {}); };
  }, [scrolling, rotated]);
  return (
    // The full-screen element itself can't be transformed (browsers force it upright), so an inner box turns.
    <div className={`tab-full ${rotated ? 'turned' : ''}`} ref={box}>
      <div ref={inner} className={`tf-inner ${rotated ? (sideways ? 'rot' : 'rot-back') : ''}`}>
      <div className="tab-full-bar">
        <span className="small">{title}</span>
        <div className="row tight">
          <button className={`btn small ${orient === 'port' ? 'primary' : 'ghost'}`} onClick={() => setOrient('port')}>▯ עומד</button>
          <button className={`btn small ${orient === 'land' ? 'primary' : 'ghost'}`} onClick={() => setOrient('land')}>▭ שוכב</button>
          <button className="btn small" onClick={onClose}>✕</button>
        </div>
      </div>
      {rotated && <p className="muted small">🔄 סובב את הטלפון {sideways ? 'לרוחב' : 'לאורך'}.</p>}
      {total > 2 && (
        <div className="row tight tf-per-row">
          <span className="small muted">תיבות בשורה:</span>
          {PER_ROW.filter((n) => n < total || n === PER_ROW[0]).map((n) => <button key={n} className={`btn small ${perRow === n ? 'primary' : 'ghost'}`} onClick={() => choosePerRow(n)}>{n}</button>)}
          <button className={`btn small ${perRow >= total ? 'primary' : 'ghost'}`} onClick={() => choosePerRow(99)}>הכול</button>
        </div>
      )}
      <div className="row tight tf-scroll">
        <button className={`btn small ${scrolling ? 'ghost' : 'primary'}`} onClick={() => setScrolling(!scrolling)}>{scrolling ? '⏸ עצור גלילה' : '⏬ גלילה אוטומטית'}</button>
        <BpmControl bpm={bpm} setBpm={setBpm} />
        {rows.length > 1 && <span className="small muted">= שורה ({Math.min(perRow, total)} תיבות{rowBeats ? `, ${rowBeats} פעמות` : ''}) כל {Math.round(rowSecs[0] * 10) / 10} שנ'</span>}
        {rows.length > 1 && !scrolling && <span className="small muted tf-scroll-how">שים את הקצב שבו אתה מנגן (כמו במטרונום), והגלילה תזוז בדיוק לפיו: בזמן שאתה מנגן שורה, השורה הקודמת יוצאת למעלה – כך השורה שאתה מנגן תמיד גלויה, והבאה מתחתיה.</span>}
      </div>
      {/* Monospace glyphs are ~0.6em wide, so the font size is the one that fits a row to the width. */}
      <div ref={rowsBox} className="tf-rows">
      {rows.map((r) => (
        <div key={r.from} className="tf-row">
          {nums && rows.length > 1 && <div className="tf-bars small muted">{barsLabel(nums.slice(r.from, r.from + perRow), r.from === 0)}</div>}
          <pre className="tab" dir="ltr" style={{ fontSize }}>
            {r.lines.map((l, k) => `${TAB_NAMES[k]}|${l}|`).join('\n')}
          </pre>
        </div>
      ))}
      </div>
      </div>
    </div>
  );
}

export function TabView({ lines, title, sub = 2, bpm: initialBpm, barFrom, bars }: { lines: string[]; title?: string; sub?: number; bpm?: number; barFrom?: number; bars?: number[] }) {
  const [full, setFull] = useState(false);
  const [bpm, setBpm] = useState(initialBpm ?? (sub === 3 ? 50 : 60));
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
      {full && <TabFull lines={lines} title={title} barFrom={barFrom} bars={bars} sub={sub} bpm={bpm} onClose={() => setFull(false)} />}
    </figure>
  );
}
