import { useEffect, useRef, useState } from 'react';
import { deleteRecording, saveRecording, useRecordings, type Recording } from '../state/recordings';
import { MicDenied } from './MicTasks';

const MIMES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ext = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm');

/**
 * Chrome's recorder writes WebM without a duration, so the seek bar doesn't work.
 * Seeking far past the end makes the browser scan the file and learn the real length.
 */
function fixDuration(e: React.SyntheticEvent<HTMLAudioElement>) {
  const a = e.currentTarget;
  if (a.duration !== Infinity) return;
  a.addEventListener('durationchange', () => { a.currentTime = 0; }, { once: true });
  a.currentTime = 1e7;
}

/** One saved take: player, date, download and delete. */
export function Take({ r, label }: { r: Recording; label?: string }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const u = URL.createObjectURL(r.blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [r.blob]);
  const when = new Date(r.created).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
  return (
    <div className="take">
      <div className="take-head small">
        <span>{label ? `${label} · ` : ''}{when} · {fmt(r.seconds)}</span>
        <span className="take-actions">
          {url && <a className="link" href={url} download={`הקלטה-${r.id}.${ext(r.mime)}`}>⬇️ שמור</a>}
          <button className="link" onClick={() => { if (confirm('למחוק את ההקלטה?')) deleteRecording(r.id); }}>🗑️</button>
        </span>
      </div>
      {url && <audio controls preload="metadata" src={url} onLoadedMetadata={fixDuration} />}
    </div>
  );
}

/** Record a take under a group key (e.g. the week) and list that group's takes. */
export function Recorder({ day }: { day: number }) {
  const takes = useRecordings(day);
  const [state, setState] = useState<'idle' | 'rec' | 'denied' | 'unsupported'>(typeof MediaRecorder === 'undefined' ? 'unsupported' : 'idle');
  const [secs, setSecs] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);

  useEffect(() => () => rec.current?.stream.getTracks().forEach((t) => t.stop()), []);
  useEffect(() => {
    if (state !== 'rec') return;
    const t0 = Date.now();
    const id = setInterval(() => setSecs((Date.now() - t0) / 1000), 250);
    return () => clearInterval(id);
  }, [state]);

  async function start() {
    let stream: MediaStream;
    try {
      // Raw sound: phone "voice" processing squashes a guitar.
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch { setState('denied'); return; }
    const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
    const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    const t0 = Date.now();
    mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = mr.mimeType || mime || 'audio/webm';
      if (chunks.length) saveRecording({ id: String(Date.now()), day, created: Date.now(), mime: type, seconds: (Date.now() - t0) / 1000, blob: new Blob(chunks, { type }) });
    };
    mr.start(1000);
    rec.current = mr;
    setSecs(0);
    setState('rec');
  }
  function stop() {
    rec.current?.stop();
    rec.current = null;
    setState('idle');
  }

  return (
    <div className="rt-box">
      <div className="rt-head">🎙️ הקלטה</div>
      {state === 'denied' ? <MicDenied /> : state === 'unsupported' ? (
        <p className="small">הדפדפן הזה לא תומך בהקלטה. הקלט באפליקציית ההקלטות של הטלפון.</p>
      ) : state === 'rec' ? (
        <button className="btn ghost wide rec-on" onClick={stop}>⏹ עצור ושמור · {fmt(secs)}</button>
      ) : (
        <button className="btn primary wide" onClick={start}>⏺ התחל להקליט</button>
      )}
      <p className="muted small">הטלפון במרחק של כמטר מהגיטרה, בחדר שקט. ההקלטות נשמרות בטלפון, בתוך האפליקציה. כדאי לשמור עותק (⬇️) של הקלטות חשובות – ניקוי נתוני הדפדפן מוחק אותן.</p>
      {takes.map((r, i) => <Take key={r.id} r={r} label={`הקלטה ${i + 1}`} />)}
    </div>
  );
}
