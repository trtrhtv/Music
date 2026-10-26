import { useEffect, useRef, useState } from 'react';
import { audio, playNote } from '../audio/synth';
import { detectOnsets, scoreTiming, type TimingResult } from '../audio/timing';
import { MicDenied } from './MicTasks';

/** Share of notes that must land on the grid to pass. */
export const TIMING_PASS = 0.85;
const BEATS = 4;

/**
 * Mic timing check: four count-in clicks, then the player continues alone for `bars` bars
 * (no click, so the speaker doesn't leak into the mic). Measures how steady the playing is.
 */
export function TimingCheck({ bpm, sub, bars = 8 }: { bpm: number; sub: number; bars?: number }) {
  const [phase, setPhase] = useState<'idle' | 'count' | 'rec' | 'done' | 'denied'>('idle');
  const [beat, setBeat] = useState(0);
  const [res, setRes] = useState<TimingResult | null>(null);
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);

  async function start() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch { setPhase('denied'); return; }
    const c = audio();
    const src = c.createMediaStreamSource(stream);
    const proc = c.createScriptProcessor(4096, 1, 1);
    const mute = c.createGain();
    mute.gain.value = 0;
    const chunks: Float32Array[] = [];
    proc.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    src.connect(proc).connect(mute).connect(c.destination);
    const t0 = c.currentTime;
    const spb = 60 / bpm;
    const first = t0 + 0.4;
    for (let i = 0; i < BEATS; i++) playNote(i === 0 ? 88 : 84, { at: first + i * spb, dur: 0.08, vel: 0.9 });
    const playStart = first + BEATS * spb;
    const end = playStart + bars * BEATS * spb + 0.3;
    const timers: number[] = [];
    for (let i = 0; i < BEATS; i++) timers.push(window.setTimeout(() => setBeat(i + 1), (first + i * spb - c.currentTime) * 1000));
    timers.push(window.setTimeout(() => setPhase('rec'), (playStart - c.currentTime) * 1000));
    let stopped = false;
    const stop = (analyse: boolean) => {
      if (stopped) return;
      stopped = true;
      timers.forEach(clearTimeout);
      src.disconnect(); proc.disconnect(); mute.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      if (!analyse) { setPhase('idle'); return; }
      const all = new Float32Array(chunks.reduce((n, a) => n + a.length, 0));
      let o = 0;
      for (const a of chunks) { all.set(a, o); o += a.length; }
      // Skip the count-in (and its echo): analyse from just before the first played beat.
      const from = Math.max(0, Math.round((playStart - 0.15 - t0) * c.sampleRate));
      setRes(scoreTiming(detectOnsets(all.subarray(from), c.sampleRate), spb / sub));
      setPhase('done');
    };
    timers.push(window.setTimeout(() => stop(true), (end - c.currentTime) * 1000));
    stopRef.current = () => stop(false);
    setRes(null);
    setBeat(0);
    setPhase('count');
  }

  if (phase === 'denied') return <MicDenied />;
  const expected = bars * BEATS;
  return (
    <div className="timing-check">
      <div className="small"><b>🎤 בדיקת קצב במיקרופון</b> · {bpm} BPM, {bars} תיבות</div>
      {phase === 'idle' && (
        <>
          <p className="small muted">שומעים 4 קליקים, ואז מנגנים לבד, בלי מטרונום, {bars} תיבות. האפליקציה מקשיבה ומודדת כמה הקצב יציב. הטלפון קרוב לגיטרה, בחדר שקט.</p>
          <button className="btn primary wide" onClick={start}>▶ התחל בדיקה</button>
        </>
      )}
      {phase === 'count' && <div className="count-in" dir="ltr">{beat || '…'}</div>}
      {phase === 'rec' && (
        <>
          <p className="small"><b>נגן!</b> שמור על הקצב של הקליקים.</p>
          <button className="btn ghost wide" onClick={() => stopRef.current()}>■ בטל</button>
        </>
      )}
      {phase === 'done' && res && (
        res.count < expected / 2 ? (
          <p className="small">לא שמעתי מספיק תווים ({res.count}). קרב את הטלפון לגיטרה ונסה שוב.</p>
        ) : (
          <>
            <p className={res.onTime >= TIMING_PASS ? 'ok-text' : 'small'}>
              <b>{Math.round(res.onTime * 100)}%</b> מהתווים בזמן (בטווח של ±{Math.round(res.tolMs)}ms) · סטייה ממוצעת {Math.round(res.meanMs)}ms
            </p>
            {Math.abs(res.driftMs) > 15 && <p className="small">{res.driftMs > 0 ? '🐢 נראה שהאטת לאורך הדרך.' : '🐇 נראה שהאצת לאורך הדרך.'}</p>}
            <p className="small">{res.onTime >= TIMING_PASS ? '✓ הקצב יציב מספיק למבחן.' : `צריך ${Math.round(TIMING_PASS * 100)}% כדי לעבור. נסה מהירות קצת נמוכה יותר, ואז חזור.`}</p>
          </>
        )
      )}
      {phase === 'done' && <button className="btn small ghost" onClick={start}>שוב</button>}
    </div>
  );
}
