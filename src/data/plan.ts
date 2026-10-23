import { list, p, tip, type Block } from './blocks';
import { CH, STRUMS, notesTab, tabFrom } from './guitarLib';

export type BlockKind = 'warm' | 'strum' | 'finger' | 'song' | 'piece' | 'improv' | 'style' | 'app' | 'record' | 'free';
export const KIND_META: Record<BlockKind, { icon: string; label: string }> = {
  warm: { icon: '🔥', label: 'חימום' },
  strum: { icon: '🥁', label: 'פריטה במקצב' },
  finger: { icon: '🖐️', label: 'פריטה באצבעות' },
  song: { icon: '🎤', label: 'שיר' },
  piece: { icon: '🎼', label: 'יצירה' },
  improv: { icon: '🎸', label: 'אלתור' },
  style: { icon: '🌍', label: 'סגנון' },
  app: { icon: '📱', label: 'שמיעה ותיאוריה' },
  record: { icon: '🎙️', label: 'הקלטה' },
  free: { icon: '🎧', label: 'חופשי' },
};

export interface PlanBlock {
  id: string;
  kind: BlockKind;
  title: string;
  min: number;
  /** Core blocks make up the ~2h daily minimum; the rest are the optional extra hour. */
  core: boolean;
  steps: string[];
  content?: Block[];
  songs?: string[];
  /** Show a BPM log for this block (e.g. 60 → 80). */
  bpm?: { start: number; target: number };
}

export interface PlanDay { n: number; week: 1 | 2; title: string; focus: string; light?: boolean; blocks: PlanBlock[] }

/* ───────── Reusable material ───────── */

const strum = (id: keyof typeof STRUMS, names: string[], bpm = 70, note?: string): Block => ({
  t: 'strum', name: STRUMS[id].name, rhythm: STRUMS[id].rhythm, bpm, chords: names.map((n) => CH[n]), chordNames: names, note: note ?? STRUMS[id].desc,
});
const go = (...items: [string, string][]): Block => ({ t: 'go', items: items.map(([label, to]) => ({ label, to })) });

// Warm-ups (frets 1–4, one finger per fret).
const CHROMATIC = notesTab([6, 5, 4, 3, 2, 1].flatMap((s) => [1, 2, 3, 4].map((f) => [s, f] as [number, number])), 2);
const SPIDER = notesTab([6, 5, 4, 3, 2, 1].flatMap((s) => [1, 3, 2, 4].map((f) => [s, f] as [number, number])), 2);
const PIMA_AM = tabFrom([[[5, 0]], [[3, 2]], [[2, 1]], [[1, 0]], [[2, 1]], [[3, 2]]], 3);
const PIMA_C = tabFrom([[[5, 3]], [[3, 0]], [[2, 1]], [[1, 0]], [[2, 1]], [[3, 0]]], 3);
const PIMA_EM = tabFrom([[[6, 0]], [[3, 0]], [[2, 0]], [[1, 0]], [[2, 0]], [[3, 0]]], 3);
const TRAVIS_C = tabFrom([[[5, 3], [2, 1]], [[3, 0]], [[4, 2]], [[2, 1]], [[5, 3]], [[3, 0]], [[4, 2]], [[2, 1]]], 3);
const SILENCE_AM = tabFrom([[[5, 0]], [[3, 2]], [[2, 1]], [[3, 2]], [[1, 0]], [[3, 2]], [[2, 1]], [[3, 2]]], 3);

// Scales.
const PENTA1 = notesTab([[6, 5], [6, 8], [5, 5], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [2, 5], [2, 8], [1, 5], [1, 8]]);
const PENTA2 = notesTab([[6, 8], [6, 10], [5, 7], [5, 10], [4, 7], [4, 10], [3, 7], [3, 9], [2, 8], [2, 10], [1, 8], [1, 10]]);
const BLUES_A = notesTab([[6, 5], [6, 8], [5, 5], [5, 6], [5, 7], [4, 5], [4, 7], [3, 5], [3, 7], [3, 8], [2, 5], [2, 8], [1, 5], [1, 8]]);
const DORIAN_A = notesTab([[6, 5], [6, 7], [6, 8], [5, 5], [5, 7], [5, 9], [4, 5], [4, 7], [4, 9], [3, 5], [3, 7], [3, 9], [2, 7], [2, 8], [2, 10], [1, 7], [1, 8], [1, 10]]);
const PHRYG_E = notesTab([[6, 0], [6, 1], [6, 3], [5, 0], [5, 2], [5, 3], [4, 0], [4, 2], [4, 3], [3, 0], [3, 2], [2, 0], [2, 1], [2, 3], [1, 0]]);
// Hammer-on / pull-off lick in box 1 (h/p marked in the title).
const HP_LICK = ['---------------5-8p5-----', '------5-8p5--------8-5---', '-5h7--------------------7', '-------------------------', '-------------------------', '-------------------------'];

// Rhythm figures.
const SHUFFLE_E = tabFrom([[[6, 0], [5, 2]], [[6, 0], [5, 2]], [[6, 0], [5, 4]], [[6, 0], [5, 4]], [[6, 0], [5, 2]], [[6, 0], [5, 2]], [[6, 0], [5, 4]], [[6, 0], [5, 4]]], 3);
const SHUFFLE_A = tabFrom([[[5, 0], [4, 2]], [[5, 0], [4, 2]], [[5, 0], [4, 4]], [[5, 0], [4, 4]], [[5, 0], [4, 2]], [[5, 0], [4, 2]], [[5, 0], [4, 4]], [[5, 0], [4, 4]]], 3);
const BOSSA_CMAJ7 = tabFrom([[[5, 3], [4, 2], [3, 0], [2, 0]], [], [], [[4, 2], [3, 0], [2, 0]], [[6, 3]], [], [[4, 2], [3, 0], [2, 0]], []], 3);
const BLUES12 = ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'];

const STRUM_METHOD = list(
  '**1. משקל:** הקשב ונקוש ברגל. סופר "1-2-3-4" (4/4) או "1-2-3 4-5-6" (6/8)? אם ה"1" חוזר כל 3 – זה 3/4.',
  '**2. הדגשות:** איפה התוף החזק (סנר)? בפופ/רוק כמעט תמיד על 2 ו-4 – לשם הולכות ההדגשות שלך.',
  '**3. צפיפות:** כמה "תנועה" יש בשיר? שקט ← רבעים או בלדה. רגיל ← שמיניות (פולק). קצבי ← שש-עשריות.',
  '**4. התחל פשוט:** רבעים עם הדגשות במקום הנכון – זה תמיד נשמע נכון. רק אחר כך מוסיפים מכות.',
  '**5. קשט בחלקים:** בית פשוט יותר, פזמון מלא יותר. זה מה שנגנים טובים עושים – לא "המקצב הנכון" אחד.',
);

/* ───────── Block factories (keep the day list readable) ───────── */

const warm = (id: string, kind: 'chromatic' | 'spider' | 'changes', changes?: string[]): PlanBlock => ({
  id, kind: 'warm', title: kind === 'changes' ? `חימום + "דקת מעברים" (${changes!.join(', ')})` : kind === 'chromatic' ? 'חימום כרומטי 1-2-3-4' : 'חימום "עכביש" 1-3-2-4', min: 10, core: true,
  bpm: kind === 'changes' ? undefined : { start: 60, target: 100 },
  steps: kind === 'changes'
    ? ['2 דקות מתיחות עדינות לאצבעות ולפרק כף היד.', 'לכל זוג אקורדים: כמה מעברים מלאים אתה עושה בדקה אחת? (מכה אחת על כל אקורד). רשום את המספר – מחר תנסה לשבור אותו.', 'אם יש זוג שנתקע – 2 דקות רק עליו.']
    : ['2 דקות מתיחות עדינות.', 'אצבע אחת לכל סריג, כל תו נקי. שמיניות על המטרונום.', 'כשזה נקי 2 סבבים – העלה 5 BPM. רשום לאיזה BPM הגעת.'],
  content: kind === 'changes' ? [{ t: 'chords', items: changes!.map((n) => ({ name: n, frets: CH[n] })) }]
    : [{ t: 'tab', title: kind === 'chromatic' ? 'מלמטה (מיתר 6) למעלה, ואז חזרה' : 'אצבעות 1-3-2-4 על כל מיתר', lines: kind === 'chromatic' ? CHROMATIC : SPIDER }, { t: 'metronome', bpm: 60 }],
});

const songBlock = (id: string, song: string, min: number, steps: string[], core = true): PlanBlock => ({
  id, kind: 'song', title: '', min, core, songs: [song], steps,
});

const appBlock = (id: string, what: string, links: [string, string][], min = 15): PlanBlock => ({
  id, kind: 'app', title: what, min, core: true,
  steps: ['באפליקציה – בלי גיטרה. אפשר גם בנסיעה או בהפסקה.', 'אם משהו לא ברור – כפתור ❓ או המילון.'],
  content: [go(...links)],
});

const free = (id: string, min: number, title = 'נגינה חופשית'): PlanBlock => ({
  id, kind: 'free', title, min, core: false,
  steps: ['נגן מה שבא לך – שירים שאתה כבר מכיר, ג\'אם, או מה שלמדת היום. בלי מטרונום ובלי לחץ.', 'זה החלק שמזכיר למה אנחנו מנגנים.'],
});

const romanza = (id: string, bars: string, min: number, core: boolean, extra: string[] = []): PlanBlock => ({
  id, kind: 'piece', title: `Romanza – ${bars}`, min, core, songs: ['romanza'], bpm: { start: 50, target: 90 },
  steps: [`מתמקדים ב${bars}. קודם יד שמאל לבד (רק המעברים), אחר כך שתי הידיים לאט.`, 'המנגינה (מיתר 1) חזקה מהמיתרים הפנימיים.', ...extra, 'רשום את ה-BPM שבו זה נקי לגמרי.'],
});

/* ───────── The 14 days ───────── */

export const PLAN: PlanDay[] = [
  {
    n: 1, week: 1, title: 'חזרה לגיטרה + המקצב הבסיסי', focus: 'לחמם את הידיים, להחזיר את המקצב, שיר ראשון',
    blocks: [
      warm('w', 'chromatic'),
      {
        id: 's', kind: 'strum', title: 'מרבעים לפולק', min: 20, core: true, bpm: { start: 60, target: 90 },
        steps: ['5 דק\': רבעים על Am–F–C–G, סופר בקול 1-2-3-4.', '10 דק\': מקצב הפולק. **היד לא עוצרת לרגע** – למטה על כל מספר, למעלה על כל "ו" – ופוגעת רק במקומות המסומנים.', '5 דק\': להחליף אקורד כל תיבה בלי לאבד את המקצב. רשום BPM.'],
        content: [strum('quarters', ['Am', 'F', 'C', 'G'], 60), strum('folk', ['Am', 'F', 'C', 'G'], 60)],
      },
      {
        id: 'f', kind: 'finger', title: 'ארפז\'ים p-i-m-a', min: 20, core: true, bpm: { start: 60, target: 90 },
        steps: ['p (אגודל) = בס, i = מיתר 3, m = מיתר 2, a = מיתר 1.', 'כל אקורד 4 פעמים, אחר כך מעבר. שמיניות שוות, כל תו באותה עוצמה.', 'יד ימין רגועה – האצבעות זזות, לא כל היד.'],
        content: [{ t: 'tab', title: 'Am', lines: PIMA_AM }, { t: 'tab', title: 'C', lines: PIMA_C }, { t: 'tab', title: 'Em', lines: PIMA_EM }, { t: 'metronome', bpm: 60 }],
      },
      songBlock('song', 'sikui', 35, ['10 דק\': לעבור על האקורדים (לפי Tab4U) וללמוד את סדר השורות.', '15 דק\': ברבעים, ואז במקצב פולק – עם ההקלטה ברקע.', '10 דק\': בית + פזמון ברצף. אל תעצור על טעויות.']),
      {
        id: 'i', kind: 'improv', title: 'פנטטוני לה מינור – תיבה 1', min: 20, core: true, bpm: { start: 60, target: 100 },
        steps: ['5 דק\': הסולם למעלה ולמטה עם המטרונום, אצבע אחת לכל סריג (5-6-7-8).', '15 דק\': הפעל את הלופ (Am–G) ואלתר. כלל אחד: משפטים קצרים של 3–4 תווים, ואז שתיקה. הסיום על A = "הביתה".'],
        content: [{ t: 'tab', title: 'A מינור פנטטוני, סריגים 5–8', lines: PENTA1 }, strum('rock8', ['Am', 'G'], 80, 'לופ ליווי – הגיטרה של האפליקציה מנגנת, אתה מאלתר מעליה.')],
      },
      appBlock('a', 'אימון שמיעה: מרווחים בסיסיים', [['שיעור: מרווחים ראשונים', 'lesson/ear2a'], ['תרגול חכם', 'practice']]),
      { id: 'rec', kind: 'record', title: 'הקלטת בסיס', min: 10, core: false, steps: ['הקלט בטלפון: את "יש לי סיכוי" (כמה שיש) ודקה של אלתור.', 'אל תקשיב עכשיו. נשווה ביום 6 וביום 14 – זה הכי מעודד שיש.'] },
      romanza('rom', 'יד ימין + תיבות 1–2', 25, false, ['קודם רק תרגיל יד ימין על מיתרים פתוחים (בעמוד היצירה).']),
      free('free', 25),
    ],
  },
  {
    n: 2, week: 1, title: 'הדגשות ומשקל 6/8', focus: 'להרגיש את 2 ו-4, להיכנס למשקל משולש',
    blocks: [
      warm('w', 'changes', ['C', 'G', 'Am', 'F']),
      {
        id: 's', kind: 'strum', title: 'הדגשות + היכרות עם 6/8', min: 20, core: true, bpm: { start: 60, target: 90 },
        steps: ['10 דק\': פולק עם הדגשה על 2 ו-4 – השאר רך. שים לב כמה זה פתאום "מתנדנד".', '10 דק\': 6/8 – ספור "1-2-3 4-5-6". קודם רק מכה על 1 ועל 4, אחר כך הוסף את המכות הרכות.'],
        content: [strum('backbeat', ['C', 'G', 'Am', 'F'], 70), strum('sixEight', ['C', 'Am'], 55)],
      },
      romanza('f', 'תיבות 1–4', 20, true, ['תרגיל יד ימין על מיתרים פתוחים – 5 דק\' לפני התיבות.']),
      songBlock('song', 'hallelujah', 35, ['10 דק\': מהלך הבית ברבעים (מכה על 1 ו-4).', '15 דק\': מקצב 6/8 על הבית והפזמון.', '10 דק\': עם ההקלטה; שים לב לרגע של E7 → Am.']),
      {
        id: 'i', kind: 'improv', title: 'האמר-און ופול-אוף', min: 20, core: true,
        steps: ['h = מנגנים את התו הראשון ו"מכים" באצבע של יד שמאל על הסריג הגבוה – בלי לפרוט שוב.', 'p = מנגנים את התו הגבוה ו"מושכים" את האצבע מהמיתר כך שהנמוך נשמע.', 'שלב את הליק באלתור מעל הלופ.'],
        content: [{ t: 'tab', title: 'ליק בתיבה 1 (h = האמר-און, p = פול-אוף)', lines: HP_LICK }, { t: 'tab', title: 'תזכורת – הסולם', lines: PENTA1 }, strum('rock8', ['Am', 'G'], 80)],
      },
      appBlock('a', 'תיאוריה: אקורדים בסולם (למה בשיר יש בדיוק את האקורדים האלה)', [['שיעור: אקורדים בתוך סולם', 'lesson/th4a'], ['מילון: דרגות', 'glossary/roman']]),
      songBlock('song2', 'sikui', 25, ['חזרה על מה שלמדת אתמול, הפעם עם הדגשות על 2 ו-4.'], false),
      free('free', 35),
    ],
  },
  {
    n: 3, week: 1, title: 'דינמיקה, השתקות ו-Travis', focus: 'לנגן חלש ונקי, להכיר את פריטת Travis',
    blocks: [
      warm('w', 'changes', ['Em', 'Cmaj7', 'Am7', 'D']),
      {
        id: 's', kind: 'strum', title: 'בלדה רכה והשתקת כף יד', min: 20, core: true,
        steps: ['5 דק\': בלדה בעוצמה מלאה. 5 דק\': אותו דבר כמה שיותר חלש – אבל יציב.', '10 דק\': השתקת כף יד – הצד של כף היד נח קלות על המיתרים ליד הגשר. מעט לחץ = "פאמפ" עמום; יותר מדי = אין צליל.'],
        content: [strum('ballad', ['Em', 'Cmaj7', 'Am7', 'D'], 60)],
      },
      {
        id: 'f', kind: 'finger', title: 'פריטת Travis – בסיס', min: 20, core: true, bpm: { start: 50, target: 80 },
        steps: ['5 דק\': רק אגודל: מיתרים 5-4-5-4, ביציבות מוחלטת, כמו מטרונום.', '15 דק\': להוסיף את האצבעות בין פעמות האגודל (לפי הטאב). אם מתבלבל – חזור לאגודל לבד.'],
        content: [{ t: 'tab', title: 'Travis על C', lines: TRAVIS_C }, { t: 'metronome', bpm: 50 }],
      },
      songBlock('song', 'mimaamakim', 35, ['קאפו 4. 10 דק\': אקורדים ומעברים (Cmaj7 ו-Am7 צריכים לצלצל).', '15 דק\': מקצב בלדה, בית חלש מאוד.', '10 דק\': עם ההקלטה, פזמון מעט מלא יותר.']),
      {
        id: 'i', kind: 'improv', title: 'בלוז 12 תיבות ב-A', min: 20, core: true,
        steps: ['הלופ מנגן 12 תיבות בלוז (A7–D7–E7). ספור את התיבות – התבנית הזאת מופיעה באלפי שירים.', 'אלתר עם סולם הבלוז: כמו פנטטוני + תו אחד "כחול" (Eb).', 'נסה לשנות את המשפט כשהאקורד מתחלף ל-D7.'],
        content: [{ t: 'tab', title: 'A בלוז, תיבה 1 (סריג 6 במיתר 5 וסריג 8 במיתר 3 = התו הכחול)', lines: BLUES_A }, strum('shuffle', BLUES12, 80, 'לופ של 12 תיבות: A7 ×4, D7 ×2, A7 ×2, E7, D7, A7, E7.')],
      },
      appBlock('a', 'שמיעה: מז\'ור או מינור', [['שיעור: מז\'ור או מינור', 'lesson/ear2b']]),
      romanza('rom', 'תיבות 5–8', 25, false, ['תיבות 7–8: הברה קטנה בסריג 5 – לחץ רק כמה שצריך.']),
      songBlock('song2', 'hallelujah', 20, ['חזרה, ונסה לשיר.'], false),
      free('free', 15),
    ],
  },
  {
    n: 4, week: 1, title: 'איך מוצאים את המקצב של שיר', focus: 'השיטה – והשיר הראשון בפריטה באצבעות',
    blocks: [
      warm('w', 'spider'),
      {
        id: 's', kind: 'strum', title: 'שיטה: למצוא את המקצב של שיר', min: 25, core: true,
        steps: ['5 דק\': קרא את השיטה.', '10 דק\': החל אותה על "יש לי סיכוי" – מה המשקל? איפה ההדגשות? אילו מכות "חייבות"?', '10 דק\': החל על "עיר מקלט" – נסה את שלושת המקצבים ובחר מה הכי קרוב.'],
        content: [STRUM_METHOD, strum('quarters', ['Em', 'Am'], 90), strum('backbeat', ['Em', 'Am'], 90), strum('rock8', ['Em', 'Am'], 90)],
      },
      {
        id: 'f', kind: 'finger', title: 'הדפוס של The Sound of Silence', min: 20, core: true, bpm: { start: 50, target: 80 },
        steps: ['בס (אגודל) ואז 3-2-3-1-3-2-3. שמיניות שוות.', 'קודם על Am בלבד עד שזה אוטומטי, אחר כך Am ↔ G.'],
        content: [{ t: 'tab', title: 'Am', lines: SILENCE_AM }, { t: 'metronome', bpm: 50 }],
      },
      songBlock('song', 'silence', 30, ['קאפו 6. 10 דק\': אקורדים + הירידה C/B.', '15 דק\': הבית הראשון בפריטה באצבעות.', '5 דק\': בתים הבאים בפריטה במקצב רכה.']),
      {
        id: 'i', kind: 'improv', title: 'תיבה 2 וחיבור לתיבה 1', min: 20, core: true,
        steps: ['למד את תיבה 2 (סריגים 7–10).', 'עלה בתיבה 1 ועבור לתיבה 2 בלי עצירה – מצא את התווים המשותפים.', 'אלתר מעל הלופ ונסה "לטייל" בין התיבות.'],
        content: [{ t: 'tab', title: 'תיבה 2', lines: PENTA2 }, strum('rock8', ['Am', 'G'], 80)],
      },
      appBlock('a', 'תרגול חכם', [['תרגול חכם', 'practice']]),
      romanza('rom', 'תיבות 1–8 ברצף', 25, false),
      songBlock('song2', 'miklat', 20, ['בונוס: שני אקורדים, כל האנרגיה מיד ימין.'], false),
      free('free', 15),
    ],
  },
  {
    n: 5, week: 1, title: 'שש-עשריות ו-Dust in the Wind', focus: 'יד ימין מהירה ומדויקת',
    blocks: [
      warm('w', 'chromatic'),
      {
        id: 's', kind: 'strum', title: 'מבוא לשש-עשריות', min: 20, core: true, bpm: { start: 50, target: 80 },
        steps: ['ספור "1-e-&-a 2-e-&-a". היד זזה למטה-למעלה כפול מהר מבשמיניות.', 'התחל ב-50 ומכות מושתקות בלבד (כל המכות ✕), אחר כך הכנס את המכות המלאות.'],
        content: [strum('funk16', ['Am7', 'Am7'], 50, 'בינתיים על Am7 בלבד. ביום 10 נעשה מזה פאנק אמיתי.')],
      },
      {
        id: 'f', kind: 'finger', title: 'Travis עם החלפת צבעים', min: 20, core: true, bpm: { start: 50, target: 80 },
        steps: ['אותו Travis מיום 3, אבל כל תיבה אקורד אחר: C → Cmaj7 → Cadd9 → C. רק אצבע אחת זזה.', 'אחר כך Asus2 → Asus4 → Asus2 (האגודל על 5-4).'],
        content: [{ t: 'tab', title: 'Travis על C', lines: TRAVIS_C }, { t: 'chords', items: ['C', 'Cmaj7', 'Cadd9', 'Asus2', 'Asus4'].map((n) => ({ name: n, frets: CH[n] })) }],
      },
      songBlock('song', 'dust', 35, ['10 דק\': הפתיחה, לאט.', '15 דק\': הבית (אקורדים מהקישורים) באותו דפוס.', '10 דק\': עם ההקלטה, אפילו אם רק חלק.']),
      {
        id: 'i', kind: 'improv', title: 'שאלה ותשובה', min: 20, core: true,
        steps: ['נגן משפט של 2 תיבות ("שאלה"), ואז משפט שעונה לו ("תשובה") שנגמר על A.', 'מותר לחזור על אותו משפט עם שינוי קטן – זה מה שהופך אלתור למוזיקה.'],
        content: [strum('folk', ['Am', 'G', 'F', 'G'], 80)],
      },
      appBlock('a', 'שמיעה: סוגי אקורדים', [['שיעור: ארבעה סוגי אקורדים', 'lesson/ear3b']]),
      romanza('rom', 'תיבות 9–12', 25, false, ['תיבות 9–10: הברה בסריג 7 – D# (סריג 11) עם הזרת.']),
      songBlock('song2', 'mimaamakim', 20, ['חזרה על ממעמקים או Hallelujah – מה שפחות יושב.'], false),
      free('free', 15),
    ],
  },
  {
    n: 6, week: 1, title: 'חזרה והקלטה', focus: 'לחבר הכל, לראות כמה התקדמת',
    blocks: [
      warm('w', 'spider'),
      {
        id: 's', kind: 'strum', title: 'מבחן מקצבים', min: 20, core: true,
        steps: ['כל אחד מהמקצבים שלמדת – 2 דקות עם המטרונום, בלי לעצור.', 'רשום ליד כל מקצב את ה-BPM הכי גבוה שבו הוא נקי.'],
        content: [strum('folk', ['Am', 'F', 'C', 'G']), strum('backbeat', ['C', 'G', 'Am', 'F']), strum('sixEight', ['C', 'Am'], 60), strum('ballad', ['Em', 'Cmaj7', 'Am7', 'D'], 60)],
      },
      { id: 'f', kind: 'finger', title: 'חזרה: Travis + Sound of Silence', min: 20, core: true, steps: ['10 דק\' לכל דפוס, בקצב האחרון שהיה נקי.'], content: [{ t: 'tab', title: 'Travis', lines: TRAVIS_C }, { t: 'tab', title: 'Silence', lines: SILENCE_AM }] },
      { id: 'song', kind: 'song', title: 'ריצה על כל השירים', min: 35, core: true, songs: ['sikui', 'hallelujah', 'mimaamakim', 'silence', 'dust'], steps: ['כל שיר פעם אחת מההתחלה עד הסוף, בלי לעצור על טעויות.', 'סמן לעצמך איפה נתקעת – שם תתמקד בשבוע הבא.'] },
      { id: 'i', kind: 'improv', title: 'ג\'אם בלוז חופשי', min: 20, core: true, steps: ['אלתר על 12 התיבות. השתמש בכל מה שלמדת: שתי תיבות, האמר-און/פול-אוף, שאלה-תשובה.'], content: [strum('shuffle', BLUES12, 80)] },
      { id: 'rec', kind: 'record', title: 'הקלטה והשוואה', min: 15, core: true, steps: ['הקלט את אותו דבר כמו ביום 1 + שיר אחד חדש.', 'עכשיו הקשב לשתי ההקלטות. רשום 2 דברים שהשתפרו ודבר אחד לשבוע הבא.'] },
      romanza('rom', 'תיבות 13–16 + כל חלק A', 25, false),
      free('free', 35),
    ],
  },
  {
    n: 7, week: 1, title: 'יום קל', focus: 'מנוחה פעילה – הידיים מתאוששות', light: true,
    blocks: [
      { ...free('free', 30, 'לנגן להנאה'), core: true },
      {
        id: 'listen', kind: 'free', title: 'האזנה לקראת שבוע 2', min: 15, core: true,
        steps: ['האזן לדוגמאות של הסגנונות של השבוע הבא – ונסה לזהות משקל והדגשות לפי השיטה.', 'בלוז: אהוד בנאי – בלוז כנעני. פאנק/גרוב: Santana – Oye Como Va. בוסה: Jobim – The Girl from Ipanema. רומבה פלמנקו: Gipsy Kings. פינגרסטייל: Tobias Rauscher, Estas Tonne.'],
      },
      { ...appBlock('a', 'חזרה באפליקציה', [['תרגול חכם', 'practice']]), core: false },
    ],
  },
  {
    n: 8, week: 2, title: 'בלוז ורוק', focus: 'שאפל, ריף בלוז, בלוז כנעני',
    blocks: [
      {
        id: 'w', kind: 'warm', title: 'חימום: ריף השאפל', min: 10, core: true, bpm: { start: 70, target: 110 },
        steps: ['הריף הקלאסי של בלוז: מיתר בס פתוח + "נדנדה" בין סריג 2 ל-4 במיתר שמעליו.', 'שמיניות צולעות (שאפל). E ואחר כך A.'],
        content: [{ t: 'tab', title: 'שאפל על E', lines: SHUFFLE_E }, { t: 'tab', title: 'שאפל על A', lines: SHUFFLE_A }, { t: 'metronome', bpm: 70 }],
      },
      {
        id: 's', kind: 'strum', title: 'מקצב שאפל', min: 20, core: true, bpm: { start: 70, target: 110 },
        steps: ['"דא-דה דא-דה": השמינית הראשונה ארוכה, השנייה קצרה. הקשב ללופ ונסה לחקות.', 'הדגשות על 2 ו-4.'],
        content: [strum('shuffle', ['E7', 'A7', 'E7', 'B7'], 80)],
      },
      romanza('f', 'תיבות 1–8 בקצב', 20, true),
      songBlock('song', 'blues', 35, ['10 דק\': פתח את האקורדים ב-Tab4U, ובדוק מול ההקלטה (ותכתוב לי באיזה סולם).', '15 דק\': החל את מקצב הבלוז-רוק – שאפל או ישר, לפי מה שאתה שומע.', '10 דק\': עם ההקלטה.']),
      { id: 'i', kind: 'improv', title: 'סולם בלוז על 12 תיבות', min: 20, core: true, steps: ['אלתר על הלופ עם סולם הבלוז.', 'נסה ליק אחד שחוזר על כל אקורד – ושנה רק את התו האחרון.'], content: [{ t: 'tab', title: 'A בלוז', lines: BLUES_A }, strum('shuffle', BLUES12, 85)] },
      appBlock('a', 'שמיעה: סוגי סולמות', [['שיעור: סוגי סולמות', 'lesson/ear3c']]),
      songBlock('song2', 'miklat', 20, ['רוק על שני אקורדים – עם השתקת כף יד בבתים.'], false),
      romanza('rom', 'תיבות 9–16', 25, false),
      free('free', 15),
    ],
  },
  {
    n: 9, week: 2, title: 'רוק אקוסטי ו-Shape of My Heart', focus: 'הדגשות ו-palm mute; תחילת השיר של סטינג',
    blocks: [
      warm('w', 'changes', ['F#m', 'E6', 'D6', 'C#7']),
      { id: 's', kind: 'strum', title: 'שמיניות רוק עם השתקה', min: 20, core: true, bpm: { start: 80, target: 120 }, steps: ['בתים: השתקת כף יד, חלש. פזמון: פתוח וחזק. אותו מקצב.', 'החל על "בלוז כנעני" ו"עיר מקלט".'], content: [strum('rock8', ['Em', 'Am'], 90)] },
      { id: 'f', kind: 'finger', title: 'ארפז\'ים על הירידה של Shape of My Heart', min: 20, core: true, bpm: { start: 50, target: 80 }, steps: ['F#m – E6 – D6 – C#7: בס ואז 3-2-1 על כל אקורד.', 'שים לב לקול שיורד – זה הלב של השיר.'], content: [{ t: 'chords', items: ['F#m', 'E6', 'D6', 'C#7'].map((n) => ({ name: n, frets: CH[n] })) }, { t: 'metronome', bpm: 50 }] },
      songBlock('song', 'shape', 35, ['15 דק\': הריף מהטאב המלא (Songsterr) – תיבה-תיבה.', '20 דק\': לחבר ריף + אקורדי הבית.']),
      { id: 'i', kind: 'improv', title: 'שתי תיבות מעל רוק', min: 20, core: true, steps: ['תיבות 1+2 מעל Em–Am (עכשיו במי מינור: אותן צורות, 3 סריגים למטה – מסריג 0/3, או בסריג 12).'], content: [strum('rock8', ['Em', 'Am'], 90)] },
      appBlock('a', 'תרגול חכם', [['תרגול חכם', 'practice']]),
      songBlock('song2', 'blues', 25, ['חזרה על בלוז כנעני.'], false),
      { id: 'romB', kind: 'piece', title: 'Romanza – חלק B (מה-PDF)', min: 20, core: false, songs: ['romanza'], steps: ['חלק B במי מז\'ור (תיבות 17–32) – מה-PDF של Werner, 4 תיבות בכל פעם.'] },
      free('free', 15),
    ],
  },
  {
    n: 10, week: 2, title: 'פאנק וגרוב', focus: 'שש-עשריות עם "צ\'יק", דורי',
    blocks: [
      warm('w', 'chromatic'),
      {
        id: 'st', kind: 'style', title: 'פאנק: Am7 – D9', min: 30, core: true, bpm: { start: 60, target: 95 },
        steps: ['יד ימין זזה בשש-עשריות כל הזמן. ✕ = מכה על מיתרים מושתקים (משחררים את הלחץ ביד שמאל, האצבעות נשארות על המיתרים).', 'מתחילים ב-60. הגרוב חשוב יותר מהמהירות.', 'האקורדים האלה – Am7 ל-D9 – הם הצליל של "Oye Como Va" ושל הרבה פאנק.'],
        content: [{ t: 'chords', items: [{ name: 'Am7', frets: CH.Am7 }, { name: 'D9', frets: CH.D9 }] }, strum('funk16', ['Am7', 'D9'], 60)],
      },
      { id: 'f', kind: 'finger', title: 'Shape of My Heart – הריף', min: 20, core: true, songs: ['shape'], steps: ['המשך מאתמול – 4 תיבות בכל פעם.'] },
      { id: 'song', kind: 'song', title: 'חזרה: Hallelujah + Sound of Silence', min: 25, core: true, songs: ['hallelujah', 'silence'], steps: ['כל שיר פעמיים מההתחלה עד הסוף.'] },
      { id: 'i', kind: 'improv', title: 'לה דורי מעל הגרוב', min: 20, core: true, steps: ['דורי = מינור עם 6 גדולה (F#). אותה תיבה של הפנטטוני + 2 תווים.', 'הדגש את F# כשהאקורד הוא D9 – תשמע איך הוא "מתיישב".'], content: [{ t: 'tab', title: 'A דורי, סריגים 5–10', lines: DORIAN_A }, strum('funk16', ['Am7', 'D9'], 80)] },
      appBlock('a', 'תיאוריה: מודוסים', [['שיעור: מודוסים', 'lesson/th5a'], ['מילון: מודוסים', 'glossary/modes']]),
      romanza('rom', 'כל חלק A בקצב', 25, false),
      free('free', 35),
    ],
  },
  {
    n: 11, week: 2, title: 'בוסה נובה', focus: 'בס + אקורד מסונקפ, אקורדי maj7',
    blocks: [
      warm('w', 'changes', ['Cmaj7', 'A7', 'Dm7', 'G7']),
      {
        id: 'st', kind: 'style', title: 'דפוס בוסה מפושט', min: 30, core: true, bpm: { start: 60, target: 110 },
        steps: ['האגודל מנגן בס על 1 ועל 3 (שורש, ואז קווינטה במיתר הנמוך יותר) – כמו שעון.', 'האצבעות (i-m-a יחד) "צובטות" את האקורד במקומות שבין הפעמות.', 'קודם על Cmaj7 בלבד, אחר כך Cmaj7 – A7 – Dm7 – G7.', 'זה דפוס מפושט שכתבתי לתרגול. בוסה אמיתית מגוונת את המקומות של האקורד.'],
        content: [{ t: 'tab', title: 'בוסה על Cmaj7 (בס על 1 ו-3)', lines: BOSSA_CMAJ7 }, { t: 'chords', items: ['Cmaj7', 'A7', 'Dm7', 'G7'].map((n) => ({ name: n, frets: CH[n] })) }, { t: 'metronome', bpm: 60 }],
      },
      romanza('f', 'כל חלק A', 20, true),
      songBlock('song', 'shape', 25, ['ריף + בית. נסה לנגן עם ההקלטה.']),
      { id: 'i', kind: 'improv', title: 'מנגינה מעל I–vi–ii–V', min: 20, core: true, steps: ['הלופ מנגן Cmaj7–A7–Dm7–G7.', 'אלתר עם תווי האקורד: נגן את תווי האקורד שמתנגן (הטרצה והספטימה נשמעות הכי "ג\'אזי").'], content: [strum('quarters', ['Cmaj7', 'A7', 'Dm7', 'G7'], 70, 'ליווי ברבעים רכים.')] },
      appBlock('a', 'תיאוריה: אקורדי ספטימה', [['שיעור: אקורדי ספטימה', 'lesson/th4b'], ['שמיעה: ספטימות', 'lesson/ear4b']]),
      songBlock('song2', 'dust', 25, ['חזרה על Dust in the Wind.'], false),
      free('free', 35),
    ],
  },
  {
    n: 12, week: 2, title: 'פלמנקו ורומבה', focus: 'רסגאדו, רומבה, פריגי, Malagueña',
    blocks: [
      {
        id: 'w', kind: 'warm', title: 'חימום: רסגאדו', min: 10, core: true,
        steps: ['קפוץ את האצבעות. פתח אותן אחת-אחת על המיתרים: זרת → קמיצה → אמה → אצבע. ואז מכה למעלה עם האצבע.', 'לאט ושווה – "טררררם". המהירות תבוא לבד.'],
        content: [{ t: 'chords', items: [{ name: 'E', frets: CH.E }] }],
      },
      { id: 'st', kind: 'style', title: 'רומבה פלמנקו על המהלך האנדלוסי', min: 30, core: true, bpm: { start: 70, target: 110 }, steps: ['Am – G – F – E: המהלך הכי ספרדי שיש.', '✕ = "גולפה": כף היד מכה על המיתרים ומשתיקה אותם.', 'קודם לאט, הגולפה חזקה ובמקום.'], content: [{ t: 'chords', items: ['Am', 'G', 'F', 'E'].map((n) => ({ name: n, frets: CH[n] })) }, strum('rumba', ['Am', 'G', 'F', 'E'], 75)] },
      { id: 'p', kind: 'piece', title: 'Malagueña – מבוא', min: 25, core: true, songs: ['malaguena'], steps: ['סולם פריגי באגודל, ואז תרגיל המרקם (אגודל + E פתוח).', 'אחר כך שיעור 1 של GuitarNick (קישור בעמוד היצירה).'] },
      songBlock('song', 'dust', 20, ['חזרה.']),
      { id: 'i', kind: 'improv', title: 'אלתור פריגי', min: 20, core: true, steps: ['E פריגי מעל Am–G–F–E. ה-F (חצי טון מעל E) הוא הצבע הספרדי – תשתמש בו!', 'נסה משפטים שיורדים F → E.'], content: [{ t: 'tab', title: 'E פריגי', lines: PHRYG_E }, strum('rumba', ['Am', 'G', 'F', 'E'], 80)] },
      appBlock('a', 'מילון: מודוסים', [['מילון: מודוסים', 'glossary/modes']], 15),
      romanza('rom', 'חלק A + B', 25, false),
      free('free', 35),
    ],
  },
  {
    n: 13, week: 2, title: 'פינגרסטייל', focus: 'Travis מתקדם, שתי היצירות',
    blocks: [
      warm('w', 'spider'),
      songBlock('f', 'dust', 25, ['הפתיחה המלאה בקצב, ואז הבית.']),
      romanza('p1', 'כל היצירה (A + B)', 25, true),
      { id: 'p2', kind: 'piece', title: 'Malagueña – המשך', min: 20, core: true, songs: ['malaguena'], steps: ['המשך מהשיעורים, ושלב רסגאדו בין המשפטים.'] },
      { id: 'song', kind: 'song', title: 'The Sound of Silence + Shape of My Heart', min: 25, core: true, songs: ['silence', 'shape'], steps: ['כל שיר פעם אחת מלאה.'] },
      { id: 'i', kind: 'improv', title: 'אלתור חופשי', min: 15, core: true, steps: ['בחר סגנון (בלוז, פאנק, פלמנקו) ואלתר עם הלופ שלו.'], content: [strum('shuffle', BLUES12, 85), strum('funk16', ['Am7', 'D9'], 80), strum('rumba', ['Am', 'G', 'F', 'E'], 85)] },
      { id: 'song2', kind: 'song', title: 'הכנה ליום ההופעה', min: 35, core: false, songs: ['sikui', 'hallelujah', 'mimaamakim', 'blues'], steps: ['השירים שפחות יושבים – עכשיו.'] },
      free('free', 25),
    ],
  },
  {
    n: 14, week: 2, title: 'סיום – הופעה והקלטה', focus: 'לנגן הכל ברצף ולראות כמה עברת',
    blocks: [
      warm('w', 'chromatic'),
      { id: 'set', kind: 'song', title: 'ה"הופעה": כל הרפרטואר ברצף', min: 50, core: true, songs: ['sikui', 'hallelujah', 'mimaamakim', 'silence', 'dust', 'blues', 'shape', 'romanza', 'malaguena'], steps: ['נגן כמו בהופעה: בלי לעצור, גם כשיש טעות.', 'סדר מומלץ: מהשקט לאנרגטי, ויצירה באמצע.'] },
      { id: 'rec', kind: 'record', title: 'הקלטת סיום', min: 25, core: true, steps: ['הקלט 3 שירים, יצירה אחת ודקה של אלתור.', 'הקשב להקלטות של יום 1, יום 6 והיום – ורשום מה השתנה.'] },
      { id: 'next', kind: 'free', title: 'מה הלאה?', min: 15, core: true, steps: ['רשום: מה הכי נהנית ממנו? מה הכי קשה עדיין?', 'בחר 2 שירים חדשים ויעד לחודש הבא – ותגיד לי, נבנה את השלב הבא.'] },
      free('free', 30),
    ],
  },
];

/** Minutes of core and optional practice for a day. */
export const dayMinutes = (d: PlanDay) => ({
  core: d.blocks.filter((b) => b.core).reduce((s, b) => s + b.min, 0),
  extra: d.blocks.filter((b) => !b.core).reduce((s, b) => s + b.min, 0),
});

export const planIntro: Block[] = [
  p('**14 ימים, בלי תאריכים.** כל יום: ליבה של כשעתיים, ועוד שעה רשות. מסמנים ✓ על כל בלוק, ועוברים ליום הבא כשמסיימים – גם אם זה לקח יומיים.'),
  list('**חימום תמיד ראשון**, והפסקה של 5 דק\' כל 40 דק\'.', 'כאב חד או נימול – עוצרים. עייפות בשרירים – זה בסדר.', 'מטרונום בכל דבר טכני; רושמים BPM – רואים התקדמות.'),
  tip('בלוק שלא הספקת? לא נורא – תעביר אותו ליום הבא או דלג. העקביות חשובה יותר משלמות.'),
];
