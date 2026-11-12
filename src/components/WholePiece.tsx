import { useState } from 'react';
import { ROMANZA_ALL } from '../data/songs';
import { TabFull } from './RhythmTools';

/** A button that opens the whole of Romanza straight in full screen. */
export function WholePieceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="lesson-row open" onClick={() => setOpen(true)}>
        <span className="lr-badge">🎼</span>
        <span className="lr-title">Romanza – היצירה המלאה<br /><small className="muted">כל 32 התיבות במסך מלא · אחרי 32 חוזרים ל-1 ומסיימים ב-16</small></span>
      </button>
      {open && <TabFull lines={ROMANZA_ALL} title="Romanza – תיבות 1–32 (אחרי 32 חוזרים ל-1 ומסיימים ב-16)" barFrom={1} sub={3} onClose={() => setOpen(false)} />}
    </>
  );
}
