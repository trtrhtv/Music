import type { Rhythm } from '../audio/rhythm';

/** Standard open/barre voicings, frets from string 6 (low E) → 1; -1 = muted. */
export const CH: Record<string, number[]> = {
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  'Am/G': [3, 0, 2, 2, 1, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  Asus2: [-1, 0, 2, 2, 0, 0],
  Asus4: [-1, 0, 2, 2, 3, 0],
  A5: [-1, 0, 2, 2, -1, -1],
  B5: [-1, 2, 4, 4, -1, -1],
  B7: [-1, 2, 1, 2, 0, 2],
  Bm: [-1, 2, 4, 4, 3, 2],
  Bm7b5: [-1, 2, 3, 2, 3, -1],
  C: [-1, 3, 2, 0, 1, 0],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  Cadd9: [-1, 3, 2, 0, 3, 0],
  'C/B': [-1, 2, 2, 0, 1, 0],
  'C#7': [-1, 4, 3, 4, 2, -1],
  D: [-1, -1, 0, 2, 3, 2],
  D6: [-1, -1, 0, 2, 0, 2],
  D7: [-1, -1, 0, 2, 1, 2],
  D9: [-1, 5, 4, 5, 5, 5],
  Dm: [-1, -1, 0, 2, 3, 1],
  Dm7: [-1, -1, 0, 2, 1, 1],
  E: [0, 2, 2, 1, 0, 0],
  E5: [0, 2, 2, -1, -1, -1],
  E6: [0, 2, 2, 1, 2, 0],
  E7: [0, 2, 0, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  'F#m': [2, 4, 4, 2, 2, 2],
  G: [3, 2, 0, 0, 0, 3],
  G7: [3, 2, 0, 0, 0, 1],
  'G/B': [-1, 2, 0, 0, 0, 3],
  Gm: [3, 5, 5, 3, 3, 3],
};

export const chords = (...names: string[]) => names.map((name) => ({ name, frets: CH[name] }));

/** Strum patterns used across the plan (written for this app, not taken from any song transcription). */
export const STRUMS: Record<string, { name: string; rhythm: Rhythm; desc: string }> = {
  quarters: { name: 'רבעים', rhythm: { slots: '>D - D - D - D -', sub: 2, beats: 4 }, desc: 'מכה אחת על כל פעמה. הבסיס לכל מקצב – וגם הדרך לפשט שיר שקשה.' },
  folk: { name: 'פולק קלאסי (D DU UDU)', rhythm: { slots: 'D - D U - U D U', sub: 2, beats: 4 }, desc: 'המקצב הנפוץ ביותר בפופ/פולק. שים לב: על ה-3 היד עוברת למטה בלי לפגוע.' },
  backbeat: { name: 'פולק עם הדגשה על 2 ו-4', rhythm: { slots: 'D - >D U - U >D U', sub: 2, beats: 4 }, desc: 'אותו מקצב, אבל ההדגשות על 2 ו-4 (איפה שהתוף "סנר") – זה מה שנותן גרוב.' },
  rock8: { name: 'שמיניות רוק', rhythm: { slots: 'D u >D u D u >D u', sub: 2, beats: 4 }, desc: 'יד רצה כל הזמן למטה-למעלה; למעלה חלש, הדגשות על 2 ו-4.' },
  ballad: { name: 'בלדה רכה', rhythm: { slots: 'D - - U - U d U', sub: 2, beats: 4 }, desc: 'מכה מלאה על ה-1, השאר רך. מנגנים קרוב לגשר או עם השתקת כף יד עדינה.' },
  sixEight: { name: '6/8 (או 12/8)', rhythm: { slots: '>D d u D d u >D d u D d u', sub: 3, beats: 4 }, desc: 'סופרים "1-2-3 4-5-6", כמו נדנדה. מכה חזקה על 1, מכה רגילה על 4, והשאר רך. בטבלה הסבב מופיע פעמיים.' },
  shuffle: { name: 'שאפל בלוז', rhythm: { slots: 'D u >D u D u >D u', sub: 2, beats: 4, swing: true }, desc: 'שמיניות "צולעות" (דא-דה, דא-דה): הראשונה ארוכה, השנייה קצרה.' },
  funk16: { name: 'פאנק בשש-עשריות', rhythm: { slots: 'D - X U - U X U D - X U - U X U', sub: 4, beats: 4 }, desc: 'יד ימין זזה כל הזמן בשש-עשריות. ✕ = מכה על מיתרים מושתקים (שחרר את הלחץ ביד שמאל).' },
  rumba: { name: 'רומבה פלמנקו', rhythm: { slots: '>D - X U D U X U', sub: 2, beats: 4 }, desc: '✕ = "גולפה": מכה עם כף היד על המיתרים שמשתיקה אותם ונותנת צליל הקשה.' },
};

/**
 * Builds tab lines from columns. Each column lists [string 1-6 (1 = high e), fret] pairs played together.
 * `w` = characters per column.
 */
export function tabFrom(cols: [number, number][][], w = 3): string[] {
  const lines = Array.from({ length: 6 }, () => '');
  for (const col of cols) {
    for (let s = 1; s <= 6; s++) {
      const hit = col.find(([ss]) => ss === s);
      const txt = hit ? String(hit[1]) : '';
      lines[s - 1] += (txt + '-'.repeat(w)).slice(0, Math.max(w, txt.length + 1));
    }
    // keep all strings the same length when a 2-digit fret appears
    const max = Math.max(...lines.map((l) => l.length));
    for (let s = 0; s < 6; s++) lines[s] = lines[s].padEnd(max, '-');
  }
  return lines.map((l) => '-' + l);
}

/** A run of single notes, e.g. a scale. */
export const notesTab = (notes: [number, number][], w = 3) => tabFrom(notes.map((n) => [n]), w);
