import { NATURALS } from '../theory/theory';
import type { StaffSpec } from '../engine/types';

const GAP = 12; // space between staff lines
const TOP = 40;

/** Diatonic index of the bottom staff line: E4 for treble, G2 for bass. */
const BOTTOM = { treble: 4 * 7 + 2, bass: 2 * 7 + 4 };

function parse(n: string) {
  const m = /^([A-G])(#{1,2}|b{1,2})?(\d)$/.exec(n)!;
  return { idx: Number(m[3]) * 7 + NATURALS.indexOf(m[1]), acc: m[2] ?? '' };
}

/** `labels` (optional) are printed under each note — used in explanations. */
export function Staff({ spec, labels }: { spec: StaffSpec; labels?: string[] }) {
  const bottomY = TOP + 4 * GAP;
  const yOf = (idx: number) => bottomY - (idx - BOTTOM[spec.clef]) * (GAP / 2);
  const notes = spec.notes.map(parse);
  const STEP = 34;
  const W = spec.chord ? 220 : Math.max(220, 110 + notes.length * STEP);
  const H = labels ? 150 : 130;
  return (
    <svg className="staff" viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: Math.max(320, W * 1.3) }} role="img" aria-label="חמשה">
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={10} x2={W - 10} y1={TOP + i * GAP} y2={TOP + i * GAP} />
      ))}
      <text className="clef" x={14} y={spec.clef === 'treble' ? TOP + 3.6 * GAP : TOP + 2.6 * GAP} fontSize={spec.clef === 'treble' ? 58 : 40}>
        {spec.clef === 'treble' ? '𝄞' : '𝄢'}
      </text>
      {notes.map((n, i) => {
        const x = spec.chord ? 130 : 105 + i * STEP;
        const y = yOf(n.idx);
        const rel = n.idx - BOTTOM[spec.clef];
        const ledgers: number[] = [];
        for (let r = -2; r >= rel; r -= 2) ledgers.push(r);
        for (let r = 10; r <= rel; r += 2) ledgers.push(r);
        return (
          <g key={i}>
            {ledgers.map((r) => (
              <line key={r} x1={x - 13} x2={x + 13} y1={bottomY - r * (GAP / 2)} y2={bottomY - r * (GAP / 2)} />
            ))}
            {n.acc && (
              <text className="acc" x={x - 24} y={y + 5} fontSize={18}>
                {n.acc.replace(/#/g, '♯').replace(/b/g, '♭')}
              </text>
            )}
            <ellipse className="head" cx={x} cy={y} rx={7.5} ry={5.5} transform={`rotate(-20 ${x} ${y})`} />
            <line className="stem" x1={rel >= 4 ? x - 7 : x + 7} x2={rel >= 4 ? x - 7 : x + 7} y1={y} y2={rel >= 4 ? y + 34 : y - 34} />
            {labels?.[i] && <text className="note-label" x={x} y={H - 8} textAnchor="middle" fontSize={13}>{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}
