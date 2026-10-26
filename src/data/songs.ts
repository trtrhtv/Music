import { list, p, tip, type Block } from './blocks';
import { tabFrom } from './guitarLib';

/**
 * Pieces for the fingerstyle track. Chords were cross-checked across several chord sites
 * (see `sources`); full arrangements, riffs and lyrics are linked rather than reproduced.
 */
export interface Song {
  id: string;
  title: string;
  artist: string;
  kind: 'song' | 'piece';
  /** verified = chords agreed across sources; link = sources disagree, use the linked chart. */
  status: 'verified' | 'link';
  key: string;
  capo?: number;
  how: string; // strum / fingerpick summary
  blocks: Block[];
  sources: { label: string; url: string }[];
}


// ───────── Romanza, section A (bars 1–16), written from the public-domain melody ─────────
type RomBar = { mel: [number, number, number]; s2: number; s3: number; bass: [number, number][] };
const rom = (mel: [number, number, number], s2: number, s3: number, bass: [number, number][] = [[6, 0]]): RomBar => ({ mel, s2, s3, bass });
const ROMANZA_A: RomBar[] = [
  rom([7, 7, 7], 0, 0), rom([7, 5, 3], 0, 0), rom([3, 2, 0], 0, 0), rom([0, 3, 7], 0, 0),
  rom([12, 12, 12], 0, 0), rom([12, 10, 8], 0, 0), rom([8, 7, 5], 5, 5, [[6, 5]]), rom([5, 7, 8], 5, 5, [[6, 5]]),
  rom([7, 8, 7], 7, 8, [[6, 7]]), rom([11, 8, 7], 7, 8, [[6, 7]]), rom([7, 5, 3], 0, 0), rom([3, 2, 0], 0, 0),
  rom([2, 2, 2], 0, 2, [[5, 2]]), rom([2, 3, 2], 0, 2, [[5, 2]]),
];
function romCols(b: RomBar): [number, number][][] {
  const cols: [number, number][][] = [];
  b.mel.forEach((m, beat) => {
    // Bass on beat 1; bar 15 has a walking bass on every beat.
    const bass = b.bass.length === 3 ? [b.bass[beat]] : beat === 0 ? b.bass : [];
    cols.push([[1, m], ...bass], [[2, b.s2]], [[3, b.s3]]);
  });
  return cols;
}
const BAR15: RomBar = { mel: [0, 0, 0], s2: 0, s3: 0, bass: [[4, 2], [5, 2], [6, 3]] };
const romTab = (from: number, to: number) => {
  const bars = [...ROMANZA_A, BAR15].slice(from - 1, to).map((b) => tabFrom(romCols(b), 3));
  return Array.from({ length: 6 }, (_, s) => bars.map((b) => b[s]).join('|'));
};
const ROMANZA_END = tabFrom([[[1, 0], [2, 0], [3, 0], [6, 0]]], 3);

// ───────── Romanza, section B (bars 17–32, E major) ─────────
// Here the melody sometimes moves to string 2 (bars 19–20), so each note names its own string.
type N = [number, number];
type RomBarB = { m: [N, N, N]; inner: [N, N]; bass: N[] };
const b = (m: [N, N, N], inner: [N, N], bass: N[]): RomBarB => ({ m, inner, bass });
const E6: N[] = [[6, 0]];
const ROMANZA_B: RomBarB[] = [
  /* 17 */ b([[1, 4], [1, 4], [1, 4]], [[2, 0], [3, 1]], E6),
  /* 18 */ b([[1, 4], [1, 2], [1, 0]], [[2, 0], [3, 1]], E6),
  /* 19 */ b([[2, 5], [2, 4], [2, 4]], [[3, 2], [4, 4]], E6),
  /* 20 */ b([[2, 4], [2, 3], [2, 4]], [[3, 2], [4, 4]], E6),
  /* 21 */ b([[1, 9], [1, 9], [1, 9]], [[2, 7], [3, 8]], [[6, 7]]),
  /* 22 */ b([[1, 9], [1, 11], [1, 9]], [[2, 7], [3, 8]], [[6, 7]]),
  /* 23 */ b([[1, 9], [1, 7], [1, 7]], [[2, 9], [3, 9]], E6),
  /* 24 */ b([[1, 7], [1, 9], [1, 11]], [[2, 9], [3, 9]], E6),
  /* 25 */ b([[1, 12], [1, 12], [1, 12]], [[2, 9], [3, 9]], E6),
  /* 26 */ b([[1, 12], [1, 11], [1, 10]], [[2, 9], [3, 9]], E6),
  /* 27 */ b([[1, 9], [1, 9], [1, 9]], [[2, 5], [3, 6]], [[5, 0]]),
  /* 28 */ b([[1, 9], [1, 7], [1, 5]], [[2, 5], [3, 6]], [[5, 0]]),
  /* 29 */ b([[1, 4], [1, 4], [1, 4]], [[2, 4], [3, 2]], [[5, 2]]),
  /* 30 */ b([[1, 4], [1, 5], [1, 2]], [[2, 4], [3, 2]], [[5, 2]]),
  /* 31 */ b([[1, 0], [1, 0], [1, 0]], [[2, 0], [3, 1]], [[4, 2], [5, 2], [6, 4]]),
];
function romColsB(x: RomBarB): N[][] {
  const cols: N[][] = [];
  x.m.forEach((mel, beat) => {
    const bass = x.bass.length === 3 ? [x.bass[beat]] : beat === 0 ? x.bass : [];
    cols.push([mel, ...bass], [x.inner[0]], [x.inner[1]]);
  });
  return cols;
}
const romTabB = (from: number, to: number) => {
  const bars = ROMANZA_B.slice(from - 17, to - 16).map((x) => tabFrom(romColsB(x), 3));
  return Array.from({ length: 6 }, (_, s) => bars.map((x) => x[s]).join('|'));
};
const ROMANZA_B_END = tabFrom([[[1, 0], [2, 0], [3, 1], [6, 0]]], 3);

export const SONGS: Song[] = [
  {
    id: 'romanza', title: 'Romanza (רומנסה ספרדית)', artist: 'אנונימי', kind: 'piece', status: 'verified', key: 'Em → E',
    how: 'ארפג\'ים בשלישיות, 3/4',
    blocks: [
      p('יצירה במשקל 3/4: כל פעמה היא **שלישייה** – המנגינה על מיתר 1 (אצבע a), ואחריה מיתר 2 (m) ומיתר 3 (i). על הפעמה הראשונה האגודל מנגן בס יחד עם המנגינה.'),
      p('היצירה בנויה משני חלקים: **חלק A במי מינור** (תיבות 1–16, כהה ועצוב) ו**חלק B במי מז\'ור** (תיבות 17–32, בהיר). אחרי חלק B חוזרים לחלק A, ומסיימים בתיבה 16. שני החלקים כתובים כאן בטאב.'),
      { t: 'tab', sub: 3, title: 'יד ימין על מיתרים פתוחים – בס+a, m, i', lines: tabFrom([[[6, 0], [1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]]], 3) },
      { t: 'tab', sub: 3, title: 'תיבות 1–4', lines: romTab(1, 4) },
      { t: 'tab', sub: 3, title: 'תיבות 5–8 (מ-7: הברה בסריג 5)', lines: romTab(5, 8) },
      { t: 'tab', sub: 3, title: 'תיבות 9–12 (9–10: הברה בסריג 7)', lines: romTab(9, 12) },
      { t: 'tab', sub: 3, title: 'תיבות 13–16 (ב-15 הבס יורד בכל פעמה)', lines: [...romTab(13, 15).map((l, i) => l + '|' + ROMANZA_END[i].slice(1))] },
      { t: 'h', text: 'חלק B – מי מז\'ור' },
      p('אותה תבנית של יד ימין: מנגינה, ואחריה שני תווים פנימיים. ההבדל: בתיבות 19–20 **המנגינה עוברת למיתר 2**, והתווים הפנימיים יורדים למיתרים 3 ו-4 – אז האצבעות של יד ימין זזות מיתר אחד למטה (a על מיתר 2, m על 3, i על 4).'),
      { t: 'tab', sub: 3, title: 'תיבות 17–20 (19–20: המנגינה על מיתר 2)', lines: romTabB(17, 20) },
      { t: 'tab', sub: 3, title: 'תיבות 21–24 (21–22: הברה בסריג 7)', lines: romTabB(21, 24) },
      { t: 'tab', sub: 3, title: 'תיבות 25–28 (25–26: עד סריג 12; 27–28: הברה בסריג 5, הבס = מיתר 5 פתוח)', lines: romTabB(25, 28) },
      { t: 'tab', sub: 3, title: 'תיבות 29–32 (29–30: הברה בסריג 2; ב-31 הבס יורד בכל פעמה)', lines: romTabB(29, 31).map((l, i) => l + '|' + ROMANZA_B_END[i].slice(1)) },
      list('**מהירות:** התחל ב-50 BPM, כשכל קליק = שלישייה אחת (3 תווים). היעד לסוף התוכנית: 80–90.', 'המנגינה צריכה להישמע **חזק יותר** מהמיתרים הפנימיים – זה כל הקסם.', 'בהברות (תיבות 7–10, 21–22, 27–30) – לחץ רק כמה שצריך כדי שהתווים יצלצלו, ושחרר את היד בין התיבות.'),
      tip('הטאב כאן נכתב לפי תווי היצירה (נחלת הכלל) ונבדק תיבה-תיבה מול המהדורה של Werner. את האצבוע של יד שמאל (איזו אצבע על כל תו) – כדאי לקחת מה-PDF.'),
    ],
    sources: [
      { label: 'Werner Guitar Editions – PDF', url: 'https://wernerguitareditions.com/products/spanish-romance-for-guitar-pdf' },
      { label: 'This is Classical Guitar – PDF + שיעור', url: 'https://www.thisisclassicalguitar.com/spanish-romance-tab-free-pdf/' },
    ],
  },
];

export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));
