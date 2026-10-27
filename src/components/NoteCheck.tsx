import { useEffect, useRef, useState } from 'react';
import { MicListener } from '../audio/mic';
import { NoteTracker, matchNote, type Mark } from '../audio/noteTrack';
import { noteName } from '../theory/theory';
import { MicDenied } from './MicTasks';
import { useRecordHeard } from '../state/heardContext';

/** Listens while you play a single-note tab and checks each note against it. */
export function NoteCheck({ notes, onClose }: { notes: number[]; onClose: () => void }) {
  const [marks, setMarks] = useState<Mark[]>(() => notes.map(() => 'pending'));
  const [wrong, setWrong] = useState(0);
  const [heard, setHeard] = useState<number | null>(null);
  const [denied, setDenied] = useState(false);
  const st = useRef({ pos: 0, marks: notes.map((): Mark => 'pending'), wrong: 0 });
  // The parent rebuilds the array on every render; listen once, with the notes it opened with.
  const expected = useRef(notes);
  const record = useRef(useRecordHeard());

  useEffect(() => {
    const mic = new MicListener();
    const tracker = new NoteTracker((m) => {
      setHeard(m);
      const r = matchNote(expected.current, st.current.marks, st.current.pos, m);
      st.current = { pos: r.pos, marks: r.marks, wrong: st.current.wrong + (r.wrong ? 1 : 0) };
      setMarks(r.marks);
      setWrong(st.current.wrong);
      if (r.pos >= expected.current.length) {
        mic.stop();
        // Wrong notes count against the score: 12 right with 3 wrong = 12/15.
        const ok = r.marks.filter((m) => m === 'ok').length;
        record.current({ kind: 'notes', score: ok / (expected.current.length + st.current.wrong), wrong: st.current.wrong });
      }
    });
    mic.start((f) => tracker.frame(f, expected.current[st.current.pos])).catch(() => setDenied(true));
    return () => mic.stop();
  }, []);

  if (denied) return <MicDenied />;
  const done = st.current.pos >= notes.length;
  const ok = marks.filter((m) => m === 'ok').length;
  return (
    <div className="note-check">
      <div className="small"><b>🎤 בדיקת תווים</b> – נגן את הטאב לאט. כל תו נכון נצבע בירוק.</div>
      <div className="nc-notes" dir="ltr">
        {notes.map((n, i) => <span key={i} className={`nc-note ${marks[i]} ${i === st.current.pos ? 'now' : ''}`}>{noteName(n)}</span>)}
      </div>
      <div className="small muted">שמעתי: <b dir="ltr">{heard === null ? '—' : noteName(heard)}</b> · תווים לא נכונים: {wrong}</div>
      {done && <p className={ok === notes.length && wrong === 0 ? 'ok-text' : 'small'}>{ok}/{notes.length} נכונים, {wrong} טעויות. {ok === notes.length && wrong === 0 ? '✓ מושלם!' : 'נסה שוב לאט יותר.'}</p>}
      <button className="btn small ghost" onClick={onClose}>סגור</button>
    </div>
  );
}
