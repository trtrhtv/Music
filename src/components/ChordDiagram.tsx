/** Vertical guitar chord box. Frets from string 6 → 1; -1 muted, 0 open. Rendered LTR (string 6 on the left). */
export function ChordDiagram({ frets, label }: { frets: number[]; label?: string }) {
  const played = frets.filter((f) => f > 0);
  const minF = played.length ? Math.min(...played) : 1;
  const start = Math.max(...frets) > 4 ? minF : 1;
  const sx = (s: number) => 22 + s * 18;
  const fy = (f: number) => 30 + (f - start + 0.5) * 22;
  // Barre: no open strings, and the lowest fret is held from its first string through string 1.
  const barreFrom = frets.findIndex((f) => f === minF);
  const isBarre = played.length > 0 && !frets.includes(0) && frets[5] === minF && frets.filter((f) => f === minF).length >= 2;
  return (
    <svg className="chord-diagram" viewBox="0 0 134 150" style={{ direction: 'ltr' }} role="img" aria-label={label ?? 'דיאגרמת אקורד'}>
      {label && <text x={67} y={12} textAnchor="middle" className="cd-label">{label}</text>}
      {start === 1 ? <rect x={20} y={27} width={94} height={4} className="nut" /> : <text x={4} y={fy(start) + 4} className="cd-fret">{start}</text>}
      {[0, 1, 2, 3, 4].map((i) => <line key={'f' + i} x1={22} x2={112} y1={30 + i * 22} y2={30 + i * 22} />)}
      {[0, 1, 2, 3, 4, 5].map((s) => <line key={'s' + s} x1={sx(s)} x2={sx(s)} y1={30} y2={118} />)}
      {isBarre && <rect x={sx(barreFrom) - 6} y={fy(minF) - 6} width={sx(5) - sx(barreFrom) + 12} height={12} rx={6} className="dot" />}
      {frets.map((f, s) =>
        f === -1 ? <text key={s} x={sx(s)} y={24} textAnchor="middle" className="cd-mark">×</text>
          : f === 0 ? <circle key={s} cx={sx(s)} cy={20} r={4.5} className="open" />
            : <circle key={s} cx={sx(s)} cy={fy(f)} r={7} className="dot" />,
      )}
      {['E', 'A', 'D', 'G', 'B', 'E'].map((n, s) => <text key={'n' + s} x={sx(s)} y={136} textAnchor="middle" className="cd-str">{n}</text>)}
    </svg>
  );
}
