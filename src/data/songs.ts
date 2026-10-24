import { list, p, tip, type Block } from './blocks';
import { CH, STRUMS, chords, notesTab, tabFrom } from './guitarLib';

/**
 * Songs and pieces for the practice plan. Chords were cross-checked across several chord sites
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

const strumBlock = (id: keyof typeof STRUMS, names: string[], bpm = 70, note?: string): Block => ({
  t: 'strum', name: STRUMS[id].name, rhythm: STRUMS[id].rhythm, bpm, chords: names.map((n) => CH[n]), chordNames: names, note: note ?? STRUMS[id].desc,
});

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
    id: 'sikui', title: 'יש לי סיכוי', artist: 'אביתר בנאי', kind: 'song', status: 'verified', key: 'Am',
    how: 'פריטה במקצב (פולק), 4/4',
    blocks: [
      p('שיר פופ-רוק ב-4/4, שבנוי על אקורדים מסולם **לה מינור**. מקצב הפולק הקלאסי עובד בו טוב – ובבתים אפשר לפשט אותו, ולהוסיף אנרגיה בפזמון.'),
      { t: 'chords', items: chords('Am', 'Dm', 'F', 'Em', 'G', 'Am/G', 'Dm7'), caption: 'האקורדים בשיר (לפי נגנו, Tab4U ושירונט)' },
      strumBlock('folk', ['Am', 'Dm', 'F', 'G']),
      list('**שלב 1:** מעברים בין האקורדים ברבעים בלבד, עד שאין עצירות.', '**שלב 2:** מקצב הפולק על כל אקורד.', '**שלב 3:** לנגן עם ההקלטה. בבתים – רך, בפזמון – הדגשות על 2 ו-4.', 'Am/G הוא Am עם התו G בבס: משאירים את Am ומוסיפים את הזרת על סריג 3 במיתר 6. כך הבס יורד A → G, וזה נשמע יפה.'),
      tip('את הסדר המדויק של האקורדים בכל שורה קח מ-Tab4U או מנגנו (קישור למטה). יש שם גם גרסה קלה ופתיחה.'),
    ],
    sources: [
      { label: 'Tab4U', url: 'https://www.tab4u.com/tabs/songs/233_%D7%90%D7%91%D7%99%D7%AA%D7%A8_%D7%91%D7%A0%D7%90%D7%99_-_%D7%99%D7%A9_%D7%9C%D7%99_%D7%A1%D7%99%D7%9B%D7%95%D7%99.html' },
      { label: 'נגנו', url: 'https://www.nagnu.co.il/%D7%90%D7%95%D7%9E%D7%A0%D7%99%D7%9D/%D7%90%D7%91%D7%99%D7%AA%D7%A8_%D7%91%D7%A0%D7%90%D7%99/%D7%99%D7%A9_%D7%9C%D7%99_%D7%A1%D7%99%D7%9B%D7%95%D7%99/%D7%90%D7%A7%D7%95%D7%A8%D7%93%D7%99%D7%9D' },
    ],
  },
  {
    id: 'mimaamakim', title: 'ממעמקים', artist: 'הפרויקט של עידן רייכל', kind: 'song', status: 'verified', key: 'Abm (צורות של Em)', capo: 4,
    how: 'בלדה רכה עם השתקה, קאפו 4',
    blocks: [
      p('שיר שקט ואינטימי. עם **קאפו בסריג 4** מנגנים צורות של מי מינור, והוא נשמע בסולם המקורי. כאן התרגיל הוא **דינמיקה**: לנגן חלש, נקי ויציב.'),
      { t: 'chords', items: chords('Em', 'Cmaj7', 'Am7', 'D', 'G', 'Bm'), caption: 'צורות האקורדים (עם קאפו 4). המקורות מסכימים על הקאפו והצורות' },
      strumBlock('ballad', ['Em', 'Cmaj7', 'Am7', 'Em'], 60, 'מכה מלאה ורכה על ה-1, השאר עדין. נסה גם עם השתקת כף יד (הצד של כף היד נוגע קלות במיתרים ליד הגשר).'),
      list('הקפד שה-Cmaj7 וה-Am7 מצלצלים – הם נותנים את הצבע ה"רך".', 'נסה לנגן את הבית חלש מאוד, ואת הפזמון קצת יותר מלא – אותו מקצב, עוצמה אחרת.'),
    ],
    sources: [
      { label: 'Songsterr (קאפו 4)', url: 'https://www.songsterr.com/a/wsa/idan-raichel-mimamakim-chords-s198551' },
      { label: 'נגנו', url: 'https://www.nagnu.co.il/%D7%90%D7%95%D7%9E%D7%A0%D7%99%D7%9D/%D7%94%D7%A4%D7%A8%D7%95%D7%99%D7%A7%D7%98_%D7%A9%D7%9C_%D7%A2%D7%99%D7%93%D7%9F_%D7%A8%D7%99%D7%99%D7%9B%D7%9C/%D7%9E%D7%9E%D7%A2%D7%9E%D7%A7%D7%99%D7%9D/%D7%90%D7%A7%D7%95%D7%A8%D7%93%D7%99%D7%9D' },
      { label: 'שירונט', url: 'https://shironet.mako.co.il/artist?type=chords&lang=1&prfid=1333&wrkid=13399' },
    ],
  },
  {
    id: 'hallelujah', title: 'Hallelujah', artist: 'Leonard Cohen', kind: 'song', status: 'verified', key: 'C',
    how: 'פריטה במקצב 6/8 (12/8)',
    blocks: [
      p('השיר הכי טוב שיש לתרגול **משקל משולש**: כל פעמה מתחלקת לשלוש ("1-2-3 4-5-6"). אם המקצב הזה יושב לך – יש לך בסיס להרבה בלדות, באנגלית ובעברית.'),
      { t: 'chords', items: chords('C', 'Am', 'F', 'G', 'E7'), caption: 'C, Am, F, G, E7 – כל המקורות מסכימים' },
      { t: 'table', head: ['חלק', 'מהלך (תיבה לכל אקורד)'], ltr: [1], rows: [['בית – פתיחה', 'C – Am – C – Am'], ['בית – המשך', 'F – G – C – G'], ['בית – העלייה', 'C – F – G – Am – F'], ['בית – הסוף', 'G – E7 – Am'], ['פזמון', 'F – Am – F – C – G – C']] },
      strumBlock('sixEight', ['C', 'Am', 'F', 'G'], 60),
      list('ספור בקול "1-2-3 4-5-6" ותן לרגל לנקוש רק על 1 ו-4.', 'התחל במכה אחת למטה על כל "1" ו-"4" בלבד; אחר כך הוסף את המכות הרכות שביניהן.', 'E7 לפני Am הוא רגע של מתח – תן לו להישמע.'),
    ],
    sources: [
      { label: 'Ultimate Guitar', url: 'https://tabs.ultimate-guitar.com/tab/leonard-cohen/hallelujah-chords-97663' },
      { label: 'Ukulele Magazine (ניתוח)', url: 'https://ukulelemagazine.com/lessons/watch-sarah-maisel-perform-leonard-cohens-hallelujah' },
    ],
  },
  {
    id: 'silence', title: 'The Sound of Silence', artist: 'Simon & Garfunkel', kind: 'song', status: 'verified', key: 'Ebm (צורות של Am)', capo: 6,
    how: 'פריטה באצבעות, קאפו 6',
    blocks: [
      p('פול סיימון מנגן עם **קאפו בסריג 6** וצורות של Am, G, F ו-C (מאושר גם בוויקיפדיה). הבית הראשון בפריטה באצבעות; בבתים הבאים אפשר לעבור לפריטה במקצב.'),
      { t: 'chords', items: chords('Am', 'G', 'F', 'C', 'C/B'), caption: 'C/B = ירידה בבס בין C ל-Am. אם F קשה – Fmaj7' },
      { t: 'tab', title: 'דפוס הפריטה (תרגיל) – בס ואז 3-2-3-1-3-2-3', lines: tabFrom([[[5, 0]], [[3, 2]], [[2, 1]], [[3, 2]], [[1, 0]], [[3, 2]], [[2, 1]], [[3, 2]], [], [[6, 3]], [[3, 0]], [[2, 0]], [[3, 0]], [[1, 3]], [[3, 0]], [[2, 0]], [[3, 0]]], 3) },
      list('האגודל מנגן את הבס (שורש האקורד), האצבעות i-m-a את מיתרים 3, 2, 1.', 'התחל לאט מאוד (50–60) ושמור על שמיניות שוות.', 'פתיחת השיר (הריף על Am) – ראה את הקישורים לשיעור המלא.'),
    ],
    sources: [
      { label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/The_Sound_of_Silence' },
      { label: 'Lauren Bateman – שיעור', url: 'https://www.laurenbateman.com/the-sound-of-silence-chord-chart/' },
      { label: 'Ultimate Guitar', url: 'https://tabs.ultimate-guitar.com/tab/simon-garfunkel/the-sound-of-silence-chords-1867833' },
    ],
  },
  {
    id: 'shape', title: 'Shape of My Heart', artist: 'Sting', kind: 'song', status: 'verified', key: 'F#m',
    how: 'פריטה באצבעות + הריף',
    blocks: [
      p('הריף של דומיניק מילר הוא כמעט יצירה בפני עצמה. השיר ב-**F#m** (או קאפו 2 עם צורות של Em). הלב שלו הוא הירידה **F#m – E6 – D6 – C#7**.'),
      { t: 'chords', items: chords('F#m', 'E6', 'D6', 'C#7'), caption: 'צורות בסיס לאקורדים (הגרסה המקורית מנגנת אותם בעמדות אחרות על הצוואר)' },
      list('**שלב 1:** לנגן את הירידה F#m–E6–D6–C#7 כארפג\'ים איטיים – בס ואז מיתרים 3-2-1.', '**שלב 2:** ללמוד את הריף המקורי מהטאב המלא (Songsterr) – הוא מבוסס על אותה ירידה.', '**שלב 3:** לחבר ריף ובית.'),
      tip('C#7 יוצר מתח שחוזר ל-F#m – זה הלב של השיר. תן לו זמן.'),
    ],
    sources: [
      { label: 'Songsterr (טאב מלא)', url: 'https://www.songsterr.com/a/wsa/sting-shape-of-my-heart-chords-s22055' },
      { label: 'Cifra Club', url: 'https://www.cifraclub.com/sting/shape-of-my-heart/' },
    ],
  },
  {
    id: 'dust', title: 'Dust in the Wind', artist: 'Kansas', kind: 'song', status: 'verified', key: 'C / Am',
    how: 'פריטת Travis',
    blocks: [
      p('כל השיר בנוי על **פריטת Travis**: האגודל עובר הלוך-חזור בין שני מיתרי בס, והאצבעות מנגנות ביניהם. הפתיחה זזה בין צורות של C ו-Am שבהן משנים רק אצבע אחת.'),
      { t: 'chords', items: chords('C', 'Cmaj7', 'Cadd9', 'Asus2', 'Asus4', 'Am'), caption: 'אקורדי הפתיחה (Heartwood, guitartabs.cc, Ultimate Guitar)' },
      { t: 'tab', title: 'תרגיל Travis על C – האגודל 5-4-5-4, האצבעות ביניהם', lines: tabFrom([[[5, 3], [2, 1]], [[3, 0]], [[4, 2]], [[2, 1]], [[5, 3]], [[3, 0]], [[4, 2]], [[2, 1]]], 3) },
      list('**שלב 1:** רק האגודל: 5-4-5-4 ביציבות מוחלטת.', '**שלב 2:** הוסף את האצבעות ביניהם.', '**שלב 3:** החלף בין C → Cmaj7 → Cadd9 → C תוך כדי – רק אצבע אחת זזה.', '**שלב 4:** אותו דבר על Asus2 → Asus4 → Asus2 (האגודל על מיתרים 5-4).', 'אקורדי הבית (C, G/B, Am, G, Dm…) – מהקישורים.'),
    ],
    sources: [
      { label: 'Heartwood Guitar', url: 'https://www.heartwoodguitar.com/chords/kansas-dust-in-the-wind/' },
      { label: 'guitartabs.cc', url: 'https://www.guitartabs.cc/tabs/k/kansas/dust_in_the_wind_tab.html' },
      { label: 'Ultimate Guitar', url: 'https://tabs.ultimate-guitar.com/tab/kansas/dust-in-the-wind-chords-874870' },
    ],
  },
  {
    id: 'blues', title: 'בלוז כנעני', artist: 'אהוד בנאי', kind: 'song', status: 'link',
    key: 'לא חד-משמעי (Dm / Em)', how: 'פריטה במקצב בלוז-רוק',
    blocks: [
      p('⚠️ **מקורות האקורדים לא מסכימים** על הסולם: Ultimate Guitar ונגנו כותבים Dm, ניתוח ההקלטה מצביע על Em, וקאבר ב-Chordify ב-D. לכן כאן **אין אקורדים** – קח אותם מ-Tab4U (עריכת צוות + שיעור וידאו), ובדוק מול ההקלטה.'),
      p('מה כן אפשר לתרגל כאן: את ה**פיל** – בלוז-רוק עם שמיניות "צולעות" והדגשות על 2 ו-4.'),
      strumBlock('shuffle', ['E7', 'A7', 'E7', 'B7'], 80, 'הקשב להקלטה: האם השמיניות "צולעות" (שאפל) או ישרות? אם ישרות – נגן את אותו דפוס בלי צליעה.'),
      tip('שלח לי צילום מסך של האקורדים מ-Tab4U – ואכניס כאן את הסולם, האקורדים ותרגילים מותאמים.'),
    ],
    sources: [
      { label: 'Tab4U (מומלץ)', url: 'https://www.tab4u.com/tabs/songs/326_%D7%90%D7%94%D7%95%D7%93_%D7%91%D7%A0%D7%90%D7%99_-_%D7%91%D7%9C%D7%95%D7%96_%D7%9B%D7%A0%D7%A2%D7%A0%D7%99.html' },
      { label: 'נגנו', url: 'https://www.nagnu.co.il/%D7%90%D7%95%D7%9E%D7%A0%D7%99%D7%9D/%D7%90%D7%94%D7%95%D7%93_%D7%91%D7%A0%D7%90%D7%99/%D7%91%D7%9C%D7%95%D7%96_%D7%9B%D7%A0%D7%A2%D7%A0%D7%99/%D7%90%D7%A7%D7%95%D7%A8%D7%93%D7%99%D7%9D' },
      { label: 'Songsterr', url: 'https://www.songsterr.com/a/wsa/ehud-banai-blues-knaani-canaanite-blues-tab-s479246' },
    ],
  },

  {
    id: 'dmama', title: 'מעליי דממה', artist: 'שי צברי', kind: 'song', status: 'verified', key: 'Bbm (צורות של Am)', capo: 1,
    how: 'פריטה רכה, קאפו 1',
    blocks: [
      p('Tab4U ו-Chordify מסכימים על האקורדים בסולם המקורי: **Bbm, Gb, Ab, Db**. בגיטרה זה בדיוק **קאפו בסריג 1** עם הצורות הנוחות **Am, F, G, C**.'),
      { t: 'chords', items: chords('Am', 'F', 'G', 'C'), caption: 'צורות עם קאפו 1 (= Bbm, Gb, Ab, Db)' },
      strumBlock('ballad', ['Am', 'F', 'G', 'C'], 70, 'שיר רגשי – התחל בבלדה רכה. הקשב להקלטה: אם יש בה דופק קבוע של שמיניות – עבור למקצב פולק בפזמון.'),
      list('את סדר האקורדים בכל שורה – מ-Tab4U.', 'F הוא אקורד הברה – אם קשה, Fmaj7 נשמע יפה גם כאן.'),
    ],
    sources: [
      { label: 'Tab4U', url: 'https://www.tab4u.com/tabs/songs/6882_%D7%A9%D7%99_%D7%A6%D7%91%D7%A8%D7%99_-_%D7%9E%D7%A2%D7%9C%D7%99%D7%99_%D7%93%D7%9E%D7%9E%D7%94.html' },
      { label: 'Chordify', url: 'https://chordify.net/chords/sy-zbry-songs/m-lyy-dmmh-chords' },
    ],
  },
  {
    id: 'babydoll', title: 'Babydoll', artist: 'Dominic Fike', kind: 'song', status: 'verified', key: 'Dm',
    how: 'פריטה במקצב, שלושה אקורדים',
    blocks: [
      p('שיר קצר ועכשווי על **שלושה אקורדים בלבד: Dm, A, Gm** (רוב המקורות מסכימים, בלי קאפו). האתגר הוא ה-**Gm** – אקורד הברה בסריג 3 – והמעבר המהיר אליו.'),
      { t: 'chords', items: chords('Dm', 'A', 'Gm') },
      strumBlock('folk', ['Dm', 'A', 'Gm', 'A'], 80),
      list('תרגל את המעבר A → Gm לבד ("דקת מעברים") – זה המקום שנתקעים בו.', 'התחל ב-70 BPM, ועלה בהדרגה עד שאתה מצליח לנגן יחד עם ההקלטה.', 'הלופ כאן הוא תרגיל על שלושת האקורדים. הסדר המדויק בשיר – מהקישורים.'),
    ],
    sources: [
      { label: 'e-chords', url: 'https://www.e-chords.com/chords/dominic-fike/babydoll' },
      { label: 'GuitarTuna', url: 'https://guitartuna.com/chords/babydoll-dominic-fike-easy-guitar-chords-61f01edc417f18615d06c0a5' },
      { label: 'noisechord', url: 'https://www.noisechord.com/noisechord/babydoll-chords-dominic-fike' },
    ],
  },

  /* ───────── Pieces ───────── */
  {
    id: 'romanza', title: 'Romanza (רומנסה ספרדית)', artist: 'אנונימי', kind: 'piece', status: 'verified', key: 'Em → E',
    how: 'ארפג\'ים בשלישיות, 3/4',
    blocks: [
      p('יצירה במשקל 3/4: כל פעמה היא **שלישייה** – המנגינה על מיתר 1 (אצבע a), ואחריה מיתר 2 (m) ומיתר 3 (i). על הפעמה הראשונה האגודל מנגן בס יחד עם המנגינה.'),
      p('היצירה בנויה משני חלקים: **חלק A במי מינור** (תיבות 1–16, כהה ועצוב) ו**חלק B במי מז\'ור** (תיבות 17–32, בהיר). אחרי חלק B חוזרים לחלק A, ומסיימים בתיבה 16. שני החלקים כתובים כאן בטאב.'),
      { t: 'tab', title: 'יד ימין על מיתרים פתוחים – בס+a, m, i', lines: tabFrom([[[6, 0], [1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]], [[1, 0]], [[2, 0]], [[3, 0]]], 3) },
      { t: 'tab', title: 'תיבות 1–4', lines: romTab(1, 4) },
      { t: 'tab', title: 'תיבות 5–8 (מ-7: הברה בסריג 5)', lines: romTab(5, 8) },
      { t: 'tab', title: 'תיבות 9–12 (9–10: הברה בסריג 7)', lines: romTab(9, 12) },
      { t: 'tab', title: 'תיבות 13–16 (ב-15 הבס יורד בכל פעמה)', lines: [...romTab(13, 15).map((l, i) => l + '|' + ROMANZA_END[i].slice(1))] },
      { t: 'h', text: 'חלק B – מי מז\'ור' },
      p('אותה תבנית של יד ימין: מנגינה, ואחריה שני תווים פנימיים. ההבדל: בתיבות 19–20 **המנגינה עוברת למיתר 2**, והתווים הפנימיים יורדים למיתרים 3 ו-4 – אז האצבעות של יד ימין זזות מיתר אחד למטה (a על מיתר 2, m על 3, i על 4).'),
      { t: 'tab', title: 'תיבות 17–20 (19–20: המנגינה על מיתר 2)', lines: romTabB(17, 20) },
      { t: 'tab', title: 'תיבות 21–24 (21–22: הברה בסריג 7)', lines: romTabB(21, 24) },
      { t: 'tab', title: 'תיבות 25–28 (25–26: עד סריג 12; 27–28: הברה בסריג 5, הבס = מיתר 5 פתוח)', lines: romTabB(25, 28) },
      { t: 'tab', title: 'תיבות 29–32 (29–30: הברה בסריג 2; ב-31 הבס יורד בכל פעמה)', lines: romTabB(29, 31).map((l, i) => l + '|' + ROMANZA_B_END[i].slice(1)) },
      list('**מהירות:** התחל ב-50 BPM, כשכל קליק = שלישייה אחת (3 תווים). היעד לסוף התוכנית: 80–90.', 'המנגינה צריכה להישמע **חזק יותר** מהמיתרים הפנימיים – זה כל הקסם.', 'בהברות (תיבות 7–10, 21–22, 27–30) – לחץ רק כמה שצריך כדי שהתווים יצלצלו, ושחרר את היד בין התיבות.'),
      tip('הטאב כאן נכתב לפי תווי היצירה (נחלת הכלל) ונבדק תיבה-תיבה מול המהדורה של Werner. את האצבוע של יד שמאל (איזו אצבע על כל תו) – כדאי לקחת מה-PDF.'),
    ],
    sources: [
      { label: 'Werner Guitar Editions – PDF', url: 'https://wernerguitareditions.com/products/spanish-romance-for-guitar-pdf' },
      { label: 'This is Classical Guitar – PDF + שיעור', url: 'https://www.thisisclassicalguitar.com/spanish-romance-tab-free-pdf/' },
    ],
  },
  {
    id: 'malaguena', title: 'Malagueña (גרסה עממית)', artist: 'עממי ספרדי', kind: 'piece', status: 'link', key: 'E פריגי',
    how: 'מנגינה בבס + E גבוה מזמזם, רסגאדו',
    blocks: [
      p('הצליל ה"ספרדי" של מלגניה בא מ**סולם פריגי על E** (E F G A B C D) – ה-F צמוד ל-E. המנגינה מנוגנת **באגודל על מיתרי הבס**, ו**מיתר E הגבוה הפתוח** מזמזם ביניהם (אצבע m).'),
      { t: 'tab', title: 'סולם E פריגי בעמדה פתוחה', lines: notesTab([[6, 0], [6, 1], [6, 3], [5, 0], [5, 2], [5, 3], [4, 0], [4, 2], [4, 3], [3, 0], [3, 2], [2, 0], [2, 1], [2, 3], [1, 0]]) },
      { t: 'tab', title: 'תרגיל המרקם: אגודל על הסולם, m על E פתוח ביניהם', lines: tabFrom([[[4, 2]], [[1, 0]], [[4, 3]], [[1, 0]], [[4, 2]], [[1, 0]], [[4, 0]], [[1, 0]], [[5, 3]], [[1, 0]], [[5, 2]], [[1, 0]], [[5, 0]], [[1, 0]], [[6, 1]], [[1, 0]], [[6, 0]], [[1, 0]]], 3) },
      { t: 'chords', items: chords('Am', 'G', 'F', 'E'), caption: 'המהלך האנדלוסי – הליווי הקלאסי לפלמנקו' },
      p('**רסגאדו (פתיחת מניפה):** קפוץ את האצבעות, ופתח אותן אחת-אחת על המיתרים – זרת, קמיצה, אמה, אצבע (e-a-m-i) – כך שיוצא "טררררם". אחר כך מכה למעלה עם i.'),
      list('**שלב 1:** סולם פריגי באגודל, לאט.', '**שלב 2:** תרגיל המרקם (אגודל + E פתוח).', '**שלב 3:** המנגינה המלאה – מהשיעורים המדורגים של GuitarNick (שיעור 1 קודם).', '**שלב 4:** בין המשפטים – רסגאדו על E.'),
      tip('לא כתבתי כאן את המנגינה עצמה, כי לא הצלחתי לאמת אותה מול מקור שאני יכול לקרוא. השתמש בשיעורים המקושרים.'),
    ],
    sources: [
      { label: 'GuitarNick – שיעורים מדורגים', url: 'https://www.guitarnick.com/malaguena-guitar-lesson.html' },
      { label: 'Tomas Michaud – גרסה קלה + PDF', url: 'https://tomasmichaud.com/malaguena/' },
      { label: 'Playable Guitar', url: 'https://www.playableguitar.com/malaguena.html' },
    ],
  },
];

export const SONG_BY_ID: Record<string, Song> = Object.fromEntries(SONGS.map((s) => [s.id, s]));
