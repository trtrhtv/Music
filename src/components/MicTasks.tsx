import { useEffect, useRef, useState } from 'react';
import { MicListener } from '../audio/mic';
import { chromaMatchesChord } from '../audio/pitch';
import { PC_SHARP, freqToMidiFloat, noteNameOct } from '../theory/theory';

type Status = 'idle' | 'listening' | 'ok' | 'denied';

function useMic(active: boolean, onFrame: Parameters<MicListener['start']>[0]) {
  const [status, setStatus] = useState<Status>('idle');
  const ref = useRef(onFrame);
  ref.current = onFrame;
  useEffect(() => {
    if (!active) return;
    const mic = new MicListener();
    let alive = true;
    mic.start((f) => alive && ref.current(f)).then(
      () => alive && setStatus((s) => (s === 'idle' ? 'listening' : s)),
      () => alive && setStatus('denied'),
    );
    return () => {
      alive = false;
      mic.stop();
    };
  }, [active]);
  return [status, setStatus] as const;
}

export function MicDenied() {
  return <p className="warn">אין גישה למיקרופון. אפשר לאשר גישה בהגדרות הדפדפן, או לדלג על התרגיל.</p>;
}

/** Listens until the target pitch class is held steadily for ~0.25s. */
export function MicNoteTask({ pc, midi, onSuccess }: { pc: number; midi?: number; onSuccess: () => void }) {
  const [heard, setHeard] = useState<{ name: string; cents: number } | null>(null);
  const [done, setDone] = useState(false);
  const streak = useRef(0);
  const [status, setStatus] = useMic(!done, (f) => {
    if (!f.freq) {
      streak.current = Math.max(0, streak.current - 1);
      return;
    }
    const m = freqToMidiFloat(f.freq);
    const r = Math.round(m);
    setHeard({ name: noteNameOct(r), cents: Math.round((m - r) * 100) });
    const hit = ((r % 12) + 12) % 12 === pc && (midi === undefined || r === midi);
    streak.current = hit ? streak.current + 1 : 0;
    if (streak.current >= 8) {
      setDone(true);
      setStatus('ok');
      onSuccess();
    }
  });
  if (status === 'denied') return <MicDenied />;
  return (
    <div className={`mic-box ${status}`}>
      <div className="mic-pulse">{status === 'ok' ? '✓' : '🎤'}</div>
      <div className="mic-target">מטרה: <b>{PC_SHARP[pc]}</b></div>
      <div className="mic-heard">{status === 'ok' ? 'מעולה!' : heard ? `שומע: ${heard.name}` : 'מקשיב…'}</div>
    </div>
  );
}

/** Accumulates chroma while sound is present and checks it against the chord. */
export function MicChordTask({ pcs, names, onSuccess }: { pcs: number[]; names: string[]; onSuccess: () => void }) {
  const frames = useRef<number[][]>([]);
  const [heardPcs, setHeardPcs] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [status, setStatus] = useMic(!done, (f) => {
    if (f.level < 0.01) {
      if (frames.current.length > 0) frames.current = frames.current.slice(1);
      return;
    }
    frames.current.push(f.chroma);
    if (frames.current.length > 45) frames.current.shift();
    if (frames.current.length < 20) return;
    const avg = new Array(12).fill(0);
    for (const c of frames.current) c.forEach((v, i) => (avg[i] += v / frames.current.length));
    const max = Math.max(...avg);
    const norm = avg.map((v) => v / max);
    setHeardPcs(norm.map((v, i) => [v, i]).filter(([v]) => v > 0.45).sort((a, b) => b[0] - a[0]).slice(0, 4).map(([, i]) => i));
    if (chromaMatchesChord(norm, pcs).ok) {
      setDone(true);
      setStatus('ok');
      onSuccess();
    }
  });
  if (status === 'denied') return <MicDenied />;
  return (
    <div className={`mic-box ${status}`}>
      <div className="mic-pulse">{status === 'ok' ? '✓' : '🎤'}</div>
      <div className="mic-target">תווי האקורד: <b dir="ltr">{names.join(' ')}</b></div>
      <div className="mic-heard">
        {status === 'ok' ? 'מעולה! האקורד נשמע נקי' : heardPcs.length ? <>שומע: <span dir="ltr">{heardPcs.map((p) => PC_SHARP[p]).join(' ')}</span></> : 'פרוט את האקורד ותן לו לצלצל…'}
      </div>
    </div>
  );
}
