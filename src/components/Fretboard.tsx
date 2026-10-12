import { GUITAR_TUNING, PC_SHARP, pc } from '../theory/theory';

export interface FretMark { s: number; f: number; kind: 'mark' | 'ok' | 'bad' | 'hint'; label?: string }

const INLAYS = [3, 5, 7, 9, 12];

/**
 * Horizontal fretboard (LTR): high E string on top like tab, frets left → right.
 * String index 0 = low E (bottom row).
 */
export function Fretboard({
  maxFret = 12, marks = [], onPress, highlightString, showNames = false,
}: { maxFret?: number; marks?: FretMark[]; onPress?: (s: number, f: number) => void; highlightString?: number; showNames?: boolean }) {
  const frets = Array.from({ length: maxFret + 1 }, (_, i) => i);
  const markAt = (s: number, f: number) => marks.find((m) => m.s === s && m.f === f);
  return (
    <div className="fretboard-wrap" dir="ltr">
      <div className="fretboard" style={{ gridTemplateColumns: `28px repeat(${maxFret}, minmax(0, 1fr))` }}>
        {[5, 4, 3, 2, 1, 0].map((s) => (
          <div key={s} className={`fb-row ${highlightString === s ? 'hl' : ''}`} style={{ display: 'contents' }}>
            {frets.map((f) => {
              const m = markAt(s, f);
              return (
                <button key={f} className={`fb-cell ${f === 0 ? 'open' : ''} ${highlightString === s ? 'hl' : ''}`}
                  onClick={() => onPress?.(s, f)} aria-label={`מיתר ${6 - s} סריג ${f}`}>
                  <span className="string-line" style={{ height: `${2.6 - s * 0.35}px` }} />
                  {m ? <span className={`fb-dot ${m.kind}`}>{m.label ?? PC_SHARP[pc(GUITAR_TUNING[s] + f)]}</span>
                    : showNames ? <span className="fb-name">{PC_SHARP[pc(GUITAR_TUNING[s] + f)]}</span> : null}
                </button>
              );
            })}
          </div>
        ))}
        <div className="fb-num" />
        {frets.slice(1).map((f) => (
          <div key={f} className="fb-num">{INLAYS.includes(f) ? (f === 12 ? '••' : '•') : ''}<small>{f}</small></div>
        ))}
      </div>
    </div>
  );
}
