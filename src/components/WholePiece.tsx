import { go } from '../router';
import { useStore } from '../state/store';
import { useState } from 'react';
import { ROMANZA_ALL, ROMANZA_ALL_BARS, ROMANZA_ALL_TITLE } from '../data/songs';
import { TabFull } from './RhythmTools';

/** A button that opens the whole of Romanza straight in full screen. */
/** Opens "my tabs" – the player's own pasted tabs. */
export function MyTabsButton() {
  const n = useStore().myTabs.length;
  return (
    <button className="lesson-row open" onClick={() => go('mytabs')}>
      <span className="lr-badge">📝</span>
      <span className="lr-title">הטאבים שלי<br /><small className="muted">{n ? `${n} טאבים · ` : ''}הדבק טאב מכל אתר – מסך מלא, אקורדים וגלילה לפי הקצב</small></span>
    </button>
  );
}

export function WholePieceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="lesson-row open" onClick={() => setOpen(true)}>
        <span className="lr-badge">🎼</span>
        <span className="lr-title">Romanza – היצירה המלאה<br /><small className="muted">במסך מלא, ברצף מההתחלה עד הסוף: A, A, B, B, A (80 תיבות)</small></span>
      </button>
      {open && <TabFull lines={ROMANZA_ALL} title={`Romanza – ${ROMANZA_ALL_TITLE}`} bars={ROMANZA_ALL_BARS} sub={3} onClose={() => setOpen(false)} />}
    </>
  );
}
