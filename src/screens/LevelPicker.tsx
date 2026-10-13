import { useState } from 'react';
import { UNIT_TITLES } from '../data/curriculum';
import { DOMAINS, DOMAIN_ICON, DOMAIN_LABEL, LEVEL_LABEL, type Domain } from '../engine/types';

/** Manual level selection per track — used instead of (or after) the placement test. */
export function LevelPicker({
  initial, title, lead, cta, onSave, onCancel,
}: {
  initial: Record<Domain, number>;
  title: string;
  lead: string;
  cta: string;
  onSave: (levels: Record<Domain, number>) => void;
  onCancel?: () => void;
}) {
  const [lv, setLv] = useState(initial);
  const set = (d: Domain, v: number) => setLv((x) => ({ ...x, [d]: Math.max(1, Math.min(5, v)) }));
  return (
    <div className="screen">
      {onCancel && <button className="back" onClick={onCancel}>→ חזרה</button>}
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      <div className="level-rows">
        {DOMAINS.map((d) => (
          <div key={d} className="level-row">
            <div className="lv-info">
              <div className="lv-name">{DOMAIN_ICON[d]} {DOMAIN_LABEL[d]}</div>
              <div className="muted small">רמה {lv[d]} · {LEVEL_LABEL[lv[d]]} — {UNIT_TITLES[d][lv[d]]}</div>
            </div>
            <div className="stepper">
              <button aria-label="הורד רמה" disabled={lv[d] <= 1} onClick={() => set(d, lv[d] - 1)}>−</button>
              <span>{lv[d]}</span>
              <button aria-label="העלה רמה" disabled={lv[d] >= 5} onClick={() => set(d, lv[d] + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>
      <p className="muted small">שיעורים מתחת לרמה שבחרת יסומנו כידועים, אבל יישארו פתוחים לחזרה. אפשר לשנות את זה תמיד בהגדרות.</p>
      <button className="btn primary big" onClick={() => onSave(lv)}>{cta}</button>
    </div>
  );
}
