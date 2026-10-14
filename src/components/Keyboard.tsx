import { pc, PC_SHARP, SOLFEGE } from '../theory/theory';

const BLACK = new Set([1, 3, 6, 8, 10]);

export interface KeyMark { midi: number; kind: 'sel' | 'ok' | 'bad' | 'hint' }

/** Two-octave on-screen piano (always LTR). */
export function Keyboard({
  from = 48, to = 72, marks = [], onPress, labels = false,
}: { from?: number; to?: number; marks?: KeyMark[]; onPress?: (midi: number) => void; labels?: boolean | 'solfege' | 'both' }) {
  const name = (m: number) => {
    const l = PC_SHARP[pc(m)];
    if (labels === 'solfege') return l.length > 1 ? '' : SOLFEGE[l];
    if (labels === 'both') return l.length > 1 ? l : `${l}\n${SOLFEGE[l]}`;
    return l;
  };
  const whites: number[] = [];
  for (let m = from; m <= to; m++) if (!BLACK.has(pc(m))) whites.push(m);
  const ww = 100 / whites.length;
  const markOf = (m: number) => marks.find((k) => k.midi === m)?.kind;
  return (
    <div className="keyboard" dir="ltr">
      {whites.map((m, i) => (
        <button key={m} className={`key white ${markOf(m) ?? ''}`} style={{ left: `${i * ww}%`, width: `${ww}%` }}
          onPointerDown={(e) => { e.preventDefault(); onPress?.(m); }} aria-label={PC_SHARP[pc(m)]}>
          {labels ? <span className="kl">{name(m)}</span> : pc(m) === 0 && <span>C{Math.floor(m / 12) - 1}</span>}
        </button>
      ))}
      {whites.map((m, i) =>
        m + 1 <= to && BLACK.has(pc(m + 1)) ? (
          <button key={m + 1} className={`key black ${markOf(m + 1) ?? ''}`} style={{ left: `${(i + 1) * ww - ww * 0.32}%`, width: `${ww * 0.64}%` }}
            onPointerDown={(e) => { e.preventDefault(); onPress?.(m + 1); }} aria-label={PC_SHARP[pc(m + 1)]}>
            {labels && labels !== 'solfege' && <span>{name(m + 1)}</span>}
          </button>
        ) : null,
      )}
    </div>
  );
}
