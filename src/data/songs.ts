import { list, p, tip, type Block } from './blocks';
import { tabFrom } from './guitarLib';
import { PD_PIECES } from './pieces';

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
  rom([12, 12, 12], 0, 0), rom([12, 10, 8], 0, 0), rom([8, 7, 5], 5, 5, [[5, 0]]), rom([5, 7, 8], 5, 5, [[5, 0]]),
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
  /* 19 */ b([[2, 5], [2, 4], [2, 4]], [[3, 2], [4, 4]], [[5, 2]]),
  /* 20 */ b([[2, 4], [2, 3], [2, 4]], [[3, 2], [4, 4]], [[5, 2]]),
  /* 21 */ b([[1, 9], [1, 9], [1, 9]], [[2, 7], [3, 8]], [[6, 7]]),
  /* 22 */ b([[1, 9], [1, 11], [1, 9]], [[2, 7], [3, 8]], [[6, 7]]),
  /* 23 */ b([[1, 9], [1, 7], [1, 7]], [[2, 9], [3, 9]], E6),
  /* 24 */ b([[1, 7], [1, 9], [1, 11]], [[2, 9], [3, 9]], E6),
  /* 25 */ b([[1, 12], [1, 12], [1, 12]], [[2, 9], [3, 9]], E6),
  /* 26 */ b([[1, 12], [1, 11], [1, 10]], [[2, 9], [3, 9]], E6),
  /* 27 */ b([[1, 9], [1, 9], [1, 9]], [[2, 5], [3, 6]], [[5, 0]]),
  /* 28 */ b([[1, 9], [1, 7], [1, 5]], [[2, 5], [3, 6]], [[5, 0]]),
  /* 29 */ b([[1, 4], [1, 4], [1, 4]], [[2, 0], [3, 1]], [[5, 2]]),
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

/** Romanza in 4-bar chunks, for the song page and for daily practice. */
export const ROMANZA_CHUNKS: { bars: [number, number]; title: string; lines: string[] }[] = [
  { bars: [1, 4], title: 'תיבות 1–4', lines: romTab(1, 4) },
  { bars: [5, 8], title: 'תיבות 5–8 (מ-7: הברה בסריג 5)', lines: romTab(5, 8) },
  { bars: [9, 12], title: 'תיבות 9–12 (9–10: הברה בסריג 7)', lines: romTab(9, 12) },
  { bars: [13, 16], title: 'תיבות 13–16 (ב-15 הבס יורד בכל פעמה)', lines: romTab(13, 15).map((l, i) => l + '|' + ROMANZA_END[i].slice(1)) },
  { bars: [17, 20], title: 'תיבות 17–20 (19–20: הברה בסריג 2, המנגינה על מיתר 2)', lines: romTabB(17, 20) },
  { bars: [21, 24], title: 'תיבות 21–24 (21–22: הברה בסריג 7)', lines: romTabB(21, 24) },
  { bars: [25, 28], title: 'תיבות 25–28 (25–26: עד סריג 12; 27–28: הברה בסריג 5, הבס = מיתר 5 פתוח)', lines: romTabB(25, 28) },
  { bars: [29, 32], title: 'תיבות 29–32 (30: הברה בסריג 2; ב-31 הבס יורד בכל פעמה)', lines: romTabB(29, 31).map((l, i) => l + '|' + ROMANZA_B_END[i].slice(1)) },
];

/**
 * The whole of Romanza written out in playing order, as the full editions have it: every part is
 * repeated – A A B B A A (JG Music Lessons; the classtab.org versions agree on the parts and repeats).
 */
const A_PART = ROMANZA_CHUNKS.slice(0, 4);
const B_PART = ROMANZA_CHUNKS.slice(4);
const PLAY_ORDER = [...A_PART, ...A_PART, ...B_PART, ...B_PART, ...A_PART, ...A_PART];
export const ROMANZA_ALL: string[] = Array.from({ length: 6 }, (_, k) => PLAY_ORDER.map((c) => c.lines[k]).join('|'));
/** The bar number of each bar of ROMANZA_ALL (1–16, 1–16, 17–32, 17–32, 1–16, 1–16). */
export const ROMANZA_ALL_BARS: number[] = PLAY_ORDER.flatMap((c) => Array.from({ length: c.bars[1] - c.bars[0] + 1 }, (_, i) => c.bars[0] + i));
export const ROMANZA_ALL_TITLE = 'כל היצירה ברצף – A, A, B, B, A, A (96 תיבות)';

export const SONGS: Song[] = [
  {
    id: 'romanza', title: 'Romanza (רומנסה ספרדית)', artist: 'אנונימי', kind: 'piece', status: 'verified', key: 'Em → E',
    how: 'ארפג\'ים בשלישיות, 3/4',
    blocks: [
      p('יצירה במשקל 3/4: כל פעמה היא **שלישייה** – המנגינה על מיתר 1 (אצבע a), ואחריה מיתר 2 (m) ומיתר 3 (i). על הפעמה הראשונה האגודל מנגן בס יחד עם המנגינה.'),
      p('היצירה בנויה משני חלקים: **חלק A במי מינור** (תיבות 1–16, כהה ועצוב) ו**חלק B במי מז\'ור** (תיבות 17–32, בהיר). בביצוע המלא כל חלק מנגנים פעמיים, וגם החזרה לחלק A בסוף היא פעמיים: **A, A, B, B, A, A**. בטאב "כל היצירה" הכול כתוב ברצף, כולל כל החזרות – אפשר לנגן מההתחלה עד הסוף בלי לקפוץ.'),
      { t: 'tab', sub: 3, title: 'יד ימין על מיתרים פתוחים – בס+a, m, i', lines: tabFrom([[[6, 0], [1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]]], 3) },
      { t: 'tab', sub: 3, beats: 3, title: ROMANZA_ALL_TITLE, lines: ROMANZA_ALL, bars: ROMANZA_ALL_BARS },
      ...ROMANZA_CHUNKS.slice(0, 4).map((c) => ({ t: 'tab' as const, sub: 3, title: c.title, lines: c.lines, barFrom: c.bars[0] })),
      { t: 'h', text: 'חלק B – מי מז\'ור' },
      p('אותה תבנית של יד ימין: מנגינה, ואחריה שני תווים פנימיים. ההבדל: בתיבות 19–20 **המנגינה עוברת למיתר 2**, והתווים הפנימיים יורדים למיתרים 3 ו-4 – אז האצבעות של יד ימין זזות מיתר אחד למטה (a על מיתר 2, m על 3, i על 4).'),
      ...ROMANZA_CHUNKS.slice(4).map((c) => ({ t: 'tab' as const, sub: 3, title: c.title, lines: c.lines, barFrom: c.bars[0] })),
      list('**מהירות:** התחל ב-50 BPM, כשכל קליק = שלישייה אחת (3 תווים). היעד לסוף התוכנית: 80–90.', 'המנגינה צריכה להישמע **חזק יותר** מהמיתרים הפנימיים – זה כל הקסם.', 'בהברות (תיבות 7–10, 19–22, 27–28, 30) – לחץ רק כמה שצריך כדי שהתווים יצלצלו, ושחרר את היד בין התיבות.'),
      tip('הטאב כאן נכתב לפי תווי היצירה (נחלת הכלל) ונבדק תיבה-תיבה מול המהדורה של Werner ומול הגרסאות ב-classtab.org. את האצבוע של יד שמאל (איזו אצבע על כל תו) – כדאי לקחת מה-PDF.'),
    ],
    sources: [
      { label: 'JG Music Lessons – המבנה המלא A A B B A A', url: 'https://jgmusiclessons.com/spanish-romance-romanza-guitar-arrangement' },
      { label: 'classtab.org – כמה גרסאות מלאות (טאב טקסט)', url: 'https://www.classtab.org/anon_romance_de_amor.txt' },
      { label: 'Werner Guitar Editions – PDF', url: 'https://wernerguitareditions.com/products/spanish-romance-for-guitar-pdf' },
      { label: 'This is Classical Guitar – PDF + שיעור', url: 'https://www.thisisclassicalguitar.com/spanish-romance-tab-free-pdf/' },
    ],
  },
  ...PD_PIECES,
];

export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));
