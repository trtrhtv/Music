import { h, list, p, tip, type Block } from './blocks';
import { CH, STRUMS, notesTab, tabFrom } from './guitarLib';

export type BlockKind = 'warm' | 'strum' | 'finger' | 'song' | 'piece' | 'improv' | 'style' | 'app' | 'record' | 'free';
/** `help` = the glossary entry that explains this kind of block's words. */
export const KIND_META: Record<BlockKind, { icon: string; label: string; help?: string }> = {
  warm: { icon: '🔥', label: 'חימום', help: 'practice-how' },
  strum: { icon: '🥁', label: 'פריטה במקצב', help: 'rhythm-words' },
  finger: { icon: '🖐️', label: 'פריטה באצבעות', help: 'right-hand' },
  song: { icon: '🎤', label: 'שיר', help: 'capo' },
  piece: { icon: '🎼', label: 'יצירה', help: 'tab-reading' },
  improv: { icon: '🎸', label: 'אלתור', help: 'scales-guitar' },
  style: { icon: '🌍', label: 'סגנון', help: 'rhythm-words' },
  app: { icon: '📱', label: 'שמיעה ותיאוריה', help: 'app' },
  record: { icon: '🎙️', label: 'הקלטה', help: 'practice-how' },
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
  /** Show a log for this block: BPM (e.g. 60 → 80), or chord changes per minute. */
  bpm?: { start: number; target: number; unit?: 'changes' };
  /** Songs to rate (self-assessment) at a checkpoint day. */
  rate?: string[];
  /** Suggest the songs rated lowest on the day-14 checkpoint. */
  polish?: boolean;
}

export interface PlanDay { n: number; week: 1 | 2 | 3; title: string; focus: string; light?: boolean; blocks: PlanBlock[] }

/* ───────── Reusable material ───────── */

const strum = (id: keyof typeof STRUMS, names: string[], bpm = 70, note?: string): Block => ({
  t: 'strum', name: STRUMS[id].name, rhythm: STRUMS[id].rhythm, bpm, chords: names.map((n) => CH[n]), chordNames: names, note: note ?? STRUMS[id].desc,
});
const chordsOf = (...names: string[]) => names.map((name) => ({ name, frets: CH[name] }));
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
const PENTA_D = notesTab([[6, 10], [6, 13], [5, 10], [5, 12], [4, 10], [4, 12], [3, 10], [3, 12], [2, 10], [2, 13], [1, 10], [1, 13]]);
// Am, F, G, C: bass with the thumb, then i-m-a-m (chord shapes as played with capo 1).
const ARP_DMAMA = tabFrom([
  [[5, 0]], [[3, 2]], [[2, 1]], [[1, 0]], [[2, 1]],
  [[4, 3]], [[3, 2]], [[2, 1]], [[1, 1]], [[2, 1]],
  [[6, 3]], [[3, 0]], [[2, 0]], [[1, 3]], [[2, 0]],
  [[5, 3]], [[3, 0]], [[2, 1]], [[1, 0]], [[2, 1]],
], 3);
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
  bpm: kind === 'changes' ? { start: 15, target: 40, unit: 'changes' } : { start: 60, target: 100 },
  steps: kind === 'changes'
    ? ['2 דקות מתיחות עדינות לאצבעות ולפרק כף היד.', '"דקת מעברים": בחר שני אקורדים מהרשימה, הפעל טיימר לדקה אחת, ועבור ביניהם הלוך-חזור כמה שיותר פעמים. מכה אחת על כל אקורד, וכל אקורד חייב לצלצל נקי.', 'ספור כמה מעברים נקיים עשית ורשום למטה. מחר תנסה לשבור את המספר.', 'יש זוג שנתקע? עוד 2 דקות רק עליו, לאט.']
    : ['2 דקות מתיחות עדינות.', 'אצבע אחת לכל סריג: אצבע 1 על סריג 1, אצבע 2 על סריג 2, וכן הלאה. כל תו צריך לצלצל נקי.', 'מנגנים שני תווים על כל קליק של המטרונום (שמיניות).', 'כשזה נקי 2 סבבים ברצף – העלה 5 BPM. רשום למטה לאיזה BPM הגעת.'],
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

const polish = (id: string, min: number, core = false): PlanBlock => ({
  id, kind: 'song', title: 'ליטוש', min, core, polish: true,
  steps: ['השירים שקיבלו את הציון הנמוך ביום הבדיקה (14) מופיעים למטה. לא נתת ציונים? בחר את השיר שהכי פחות יושב.', 'לא מנגנים את כל השיר: מוצאים את 2–3 המקומות שנתקעים בהם, ומתרגלים כל אחד לבד, לאט, עם מטרונום.', 'בסוף – השיר כולו פעם אחת ברצף.'],
});

const romanza = (id: string, bars: string, min: number, core: boolean, extra: string[] = []): PlanBlock => ({
  id, kind: 'piece', title: `Romanza – ${bars}`, min, core, songs: ['romanza'], bpm: { start: 50, target: 90 },
  steps: [`מתמקדים ב${bars}. קודם יד שמאל לבד (רק המעברים), אחר כך שתי הידיים לאט.`, 'המנגינה (מיתר 1) חזקה מהמיתרים הפנימיים.', ...extra, 'רשום את ה-BPM שבו זה נקי לגמרי.'],
});

/* ───────── The 21 days ───────── */

const REP14 = ['sikui', 'hallelujah', 'mimaamakim', 'silence', 'dust', 'blues', 'shape', 'dmama', 'romanza', 'malaguena'];
const REP21 = [...REP14.slice(0, 8), 'babydoll', 'romanza', 'malaguena'];

/** Day of the mid-plan checkpoint whose ratings drive week 3's polishing. */
export const CHECKPOINT = 14;

export const PLAN: PlanDay[] = [
  {
    n: 1, week: 1, title: 'חזרה לגיטרה + המקצב הבסיסי', focus: 'לחמם את הידיים, להחזיר את המקצב, שיר ראשון',
    blocks: [
      warm('w', 'chromatic'),
      {
        id: 's', kind: 'strum', title: 'מקצב בסיסי: מ"רבעים" ל"פולק"', min: 20, core: true, bpm: { start: 60, target: 90 },
        steps: [
          '**מה לומדים כאן?** **רבעים** = מכה אחת למטה על כל ספירה: 1, 2, 3, 4. **פולק** = המקצב הכי נפוץ בשירי פופ ופולק. סופרים אותו דבר, רק שיש עוד מכות למעלה בין המספרים.',
          '**שלב א – רבעים (5 דק\'):** לחץ "השמע בלופ" בטבלה הראשונה למטה, והקשב פעם אחת. עכשיו נגן יחד איתה: מכה אחת למטה על כל מספר, וספור בקול "1, 2, 3, 4". אחרי 4 מכות עוברים לאקורד הבא: Am, ואז F, ואז C, ואז G.',
          '**שלב ב – היד כמו מטוטלת (3 דק\'):** עדיין רבעים, אבל אחרי כל מכה למטה היד עולה למעלה **בלי לגעת** במיתרים. ספור "1 וְ 2 וְ 3 וְ 4 וְ": היד למטה על המספרים, ולמעלה על ה"וְ". את התנועה הזאת לא מפסיקים יותר – גם כשלא פוגעים.',
          '**שלב ג – פולק (10 דק\'):** היד ממשיכה **בדיוק** באותה תנועה. משנים רק **מתי היא פוגעת**: על 1 – למטה. על 2 – למטה, ובוְ – למעלה. על 3 – היד יורדת **באוויר**, ובוְ – למעלה. על 4 – למטה, ובוְ – למעלה. בקיצור: **למטה · למטה-למעלה · (אוויר)-למעלה · למטה-למעלה**. הפעל את הטבלה השנייה ונגן איתה.',
          'מתבלבל? הורד את המהירות ל-50 (פעמיים על הכפתור 5−), או נגן רק Am שוב ושוב עד שזה יוצא בלי לחשוב.',
          '**שלב ד (2 דק\'):** פולק עם החלפת אקורד בכל סבב, בלי לעצור. רשום למטה את ה-BPM הכי גבוה שבו זה יצא בלי עצירות.',
        ],
        content: [strum('quarters', ['Am', 'F', 'C', 'G'], 60), strum('folk', ['Am', 'F', 'C', 'G'], 60)],
      },
      {
        id: 'f', kind: 'finger', title: 'ארפג\'ים p-i-m-a', min: 20, core: true, bpm: { start: 60, target: 90 },
        steps: ['p (אגודל) = בס, i = מיתר 3, m = מיתר 2, a = מיתר 1.', 'כל אקורד 4 פעמים, אחר כך מעבר. שמיניות שוות, כל תו באותה עוצמה.', 'יד ימין רגועה – האצבעות זזות, לא כל היד.'],
        content: [{ t: 'tab', title: 'Am', lines: PIMA_AM }, { t: 'tab', title: 'C', lines: PIMA_C }, { t: 'tab', title: 'Em', lines: PIMA_EM }, { t: 'metronome', bpm: 60 }],
      },
      songBlock('song', 'sikui', 30, ['10 דק\': לעבור על האקורדים (לפי Tab4U) וללמוד את סדר השורות.', '15 דק\': ברבעים, ואז במקצב פולק – עם ההקלטה ברקע.', '10 דק\': בית + פזמון ברצף. אל תעצור על טעויות.']),
      {
        id: 'i', kind: 'improv', title: 'פנטטוני לה מינור – צורה 1', min: 20, core: true, bpm: { start: 60, target: 100 },
        steps: ['**מה זה?** **פנטטוני** = סולם של 5 תווים שכמעט תמיד נשמעים טוב יחד, ולכן הוא הסולם הראשון לאלתור. **מינור** = האווירה הכהה של השיר (Am). הסבר מלא עם דוגמאות לשמיעה – בכפתור 📖 בסוף הבלוק.', '5 דק\': הסולם למעלה ולמטה עם המטרונום, אצבע אחת לכל סריג (5-6-7-8).', '15 דק\': הפעל את הלופ (Am–G) ואלתר מעליו. כלל אחד: משפט קצר של 3–4 תווים, ואז שתיקה, כמו בדיבור. כשמסיימים משפט על התו A – זה נשמע "סגור", כמו לחזור הביתה.'],
        content: [{ t: 'tab', title: 'A מינור פנטטוני, סריגים 5–8', lines: PENTA1 }, strum('rock8', ['Am', 'G'], 80, 'לופ ליווי – הגיטרה של האפליקציה מנגנת, אתה מאלתר מעליה.')],
      },
      appBlock('a', 'אימון שמיעה: מרווחים בסיסיים', [['שיעור: מרווחים ראשונים', 'lesson/ear2a'], ['תרגול חכם', 'practice']]),
      { id: 'rec', kind: 'record', title: 'הקלטת בסיס', min: 10, core: true, steps: ['הקלט עם הכפתור למטה: את "יש לי סיכוי" (כמה שיש), את תרגיל הפנטטוני עם המטרונום, ודקה של אלתור. אפשר הקלטה אחת לכל דבר.', 'אל תקשיב עכשיו – נשווה אליה ביום 6, ביום 14 וביום 21. זה הדבר הכי מעודד שיש.', '🔎 **לבדוק:** בסוף היום, שלח לי כל הסבר שלא היה ברור, לא נוח, או נראה לא נכון.'] },
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
        content: [{ t: 'tab', title: 'ליק בצורה 1 (h = האמר-און, p = פול-אוף)', lines: HP_LICK }, { t: 'tab', title: 'תזכורת – הסולם (צורה 1)', lines: PENTA1 }, strum('rock8', ['Am', 'G'], 80)],
      },
      appBlock('a', 'תיאוריה, יחידה 1: טון, חצי טון, דיאז ובמול', [['שיעור: טון וחצי טון', 'lesson/t1b'], ['שיעור: דיאז ובמול', 'lesson/t1c']]),
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
        content: [{ t: 'tab', title: 'A בלוז, צורה 1 (סריג 6 במיתר 5 וסריג 8 במיתר 3 = התו הכחול)', lines: BLUES_A }, strum('shuffle', BLUES12, 80, 'לופ של 12 תיבות: A7 ×4, D7 ×2, A7 ×2, E7, D7, A7, E7.')],
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
        steps: ['5 דק\': קרא את השיטה.', '10 דק\': החל אותה על "יש לי סיכוי" – מה המשקל? איפה ההדגשות? אילו מכות "חייבות"?', '10 דק\': החל על "מעליי דממה" – שמע את ההקלטה, נסה את שלושת המקצבים למטה ובחר מה הכי קרוב. אין תשובה אחת נכונה – העיקר שההדגשות במקום.'],
        content: [STRUM_METHOD, strum('quarters', ['Am', 'F', 'G', 'C'], 70), strum('ballad', ['Am', 'F', 'G', 'C'], 70), strum('folk', ['Am', 'F', 'G', 'C'], 70)],
      },
      {
        id: 'f', kind: 'finger', title: 'הדפוס של The Sound of Silence', min: 20, core: true, bpm: { start: 50, target: 80 },
        steps: ['בס (אגודל) ואז 3-2-3-1-3-2-3. שמיניות שוות.', 'קודם על Am בלבד עד שזה אוטומטי, אחר כך Am ↔ G.'],
        content: [{ t: 'tab', title: 'Am', lines: SILENCE_AM }, { t: 'metronome', bpm: 50 }],
      },
      songBlock('song', 'silence', 30, ['קאפו 6. 10 דק\': אקורדים + הירידה C/B.', '15 דק\': הבית הראשון בפריטה באצבעות.', '5 דק\': בתים הבאים בפריטה במקצב רכה.']),
      {
        id: 'i', kind: 'improv', title: 'צורה 2 וחיבור לצורה 1', min: 20, core: true,
        steps: ['למד את צורה 2 (סריגים 7–10). זה אותו סולם, פשוט במקום אחר על הצוואר.', 'נגן את צורה 1 עד למעלה, ואז המשך לצורה 2 בלי לעצור. שים לב לתווים ששתי הצורות חולקות – הם "הגשר" ביניהן.', 'אלתר מעל הלופ ונסה לעבור בין הצורות באמצע משפט.'],
        content: [{ t: 'tab', title: 'צורה 2', lines: PENTA2 }, strum('rock8', ['Am', 'G'], 80)],
      },
      appBlock('a', 'תיאוריה, יחידה 2: מה זה סולם, ואיך בונים סולם מז\'ור', [['שיעור: מה זה סולם?', 'lesson/t2a'], ['שיעור: בונים סולם מכל תו', 'lesson/t2b']]),
      romanza('rom', 'תיבות 1–8 ברצף', 25, false),
      songBlock('song2', 'dmama', 20, ['היכרות: קאפו 1, ארבעה אקורדים (Am F G C). נגן את סדר האקורדים ברבעים מעל ההקלטה, בלי לחץ.'], false),
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
      { id: 'i', kind: 'improv', title: 'ג\'אם בלוז חופשי', min: 20, core: true, steps: ['אלתר על 12 התיבות. השתמש בכל מה שלמדת: שתי הצורות של הסולם, האמר-און ופול-אוף, שאלה-תשובה.'], content: [strum('shuffle', BLUES12, 80)] },
      { id: 'rec', kind: 'record', title: 'הקלטה והשוואה', min: 15, core: true, steps: ['הקלט את אותו דבר כמו ביום 1 ("יש לי סיכוי", פנטטוני, דקת אלתור) + שיר אחד חדש.', 'עכשיו הקשב להקלטה של יום 1 ולזו של היום – שתיהן במסך "ההתקדמות שלי". רשום 2 דברים שהשתפרו ודבר אחד לשבוע הבא.'] },
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
      songBlock('song', 'blues', 35, ['🔎 **לבדוק:** צלם מסך של האקורדים ב-Tab4U ושלח לי – המקורות חלוקים על הסולם.', '15 דק\': האקורדים והפתיחה מ-Tab4U, שורה אחרי שורה, לאט.', '10 דק\': מקצב הבלוז-רוק – שאפל או ישר, לפי מה שאתה שומע.', '10 דק\': עם ההקלטה.']),
      { id: 'i', kind: 'improv', title: 'סולם בלוז על 12 תיבות', min: 20, core: true, steps: ['אלתר על הלופ עם סולם הבלוז.', 'נסה ליק אחד שחוזר על כל אקורד – ושנה רק את התו האחרון.'], content: [{ t: 'tab', title: 'A בלוז', lines: BLUES_A }, strum('shuffle', BLUES12, 85)] },
      appBlock('a', 'שמיעה: סוגי סולמות', [['שיעור: סוגי סולמות', 'lesson/ear3c']]),
      songBlock('song2', 'dmama', 20, ['מעליי דממה: בית שלם במקצב שבחרת ביום 4. אם F עדיין קשה – Fmaj7.'], false),
      romanza('rom', 'תיבות 9–16', 25, false),
      free('free', 15),
    ],
  },
  {
    n: 9, week: 2, title: 'רוק אקוסטי ו-Shape of My Heart', focus: 'הדגשות והשתקת כף יד; תחילת השיר של סטינג',
    blocks: [
      warm('w', 'changes', ['F#m', 'E6', 'D6', 'C#7']),
      { id: 's', kind: 'strum', title: 'שמיניות רוק עם השתקה', min: 20, core: true, bpm: { start: 80, target: 120 }, steps: ['בתים: השתקת כף יד, חלש. פזמון: פתוח וחזק. אותו מקצב.', 'החל על "בלוז כנעני".'], content: [strum('rock8', ['Em', 'Am'], 90)] },
      { id: 'f', kind: 'finger', title: 'ארפג\'ים על הירידה של Shape of My Heart', min: 20, core: true, bpm: { start: 50, target: 80 }, steps: ['F#m – E6 – D6 – C#7: בס ואז 3-2-1 על כל אקורד.', 'שים לב לקול שיורד – זה הלב של השיר.'], content: [{ t: 'chords', items: ['F#m', 'E6', 'D6', 'C#7'].map((n) => ({ name: n, frets: CH[n] })) }, { t: 'metronome', bpm: 50 }] },
      songBlock('song', 'shape', 35, ['🔎 **לבדוק:** השווה את 4 האקורדים בעמוד השיר לטאב ב-Songsterr. יש הבדל? תגיד לי ואתקן.', '15 דק\': הריף מהטאב המלא (Songsterr) – תיבה-תיבה.', '20 דק\': לחבר ריף + אקורדי הבית.']),
      { id: 'i', kind: 'improv', title: 'שתי הצורות מעל רוק', min: 20, core: true, steps: ['הפעם הלופ ב-Em, אז מנגנים **E מינור פנטטוני**: אותן שתי צורות בדיוק, רק 5 סריגים למטה (צורה 1 בסריגים 0–3, צורה 2 בסריגים 2–5) – או 7 סריגים למעלה (סריג 12).', 'כל השאר כמו ב-A: משפטים קצרים, ומסיימים על התו E.'], content: [strum('rock8', ['Em', 'Am'], 90)] },
      appBlock('a', 'תיאוריה: דרגות, ולמה "טרצה" ו"קווינטה"', [['שיעור: דרגות', 'lesson/t2c'], ['שיעור: סופרים אותיות', 'lesson/t3a']]),
      songBlock('song2', 'blues', 25, ['חזרה על בלוז כנעני.'], false),
      { id: 'romB', kind: 'piece', title: 'Romanza – הצצה לחלק B', min: 20, core: false, songs: ['romanza'], steps: ['חלק B במי מז\'ור – בעמוד היצירה, אחרי חלק A.', 'רק תיבות 17–18 בינתיים: אותה תבנית כמו בחלק A, באקורד E מז\'ור. לאט, 4 פעמים כל תיבה.'] },
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
      { id: 'i', kind: 'improv', title: 'לה דורי מעל הגרוב', min: 20, core: true, steps: ['**דורי** הוא סולם מינור שבו התו השישי גבוה בחצי טון: ב-A זה F# במקום F. בפועל: צורה 1 של הפנטטוני + שני תווים (B ו-F#).', 'הדגש את F# כשהאקורד הוא D9 – תשמע איך הוא "מתיישב".'], content: [{ t: 'tab', title: 'A דורי, סריגים 5–10', lines: DORIAN_A }, strum('funk16', ['Am7', 'D9'], 80)] },
      appBlock('a', 'תיאוריה, יחידה 3: גודל של מרווח, ומרווחים על הצוואר', [['שיעור: גדולה, קטנה, זכה', 'lesson/t3b'], ['שיעור: מרווחים על הצוואר', 'lesson/t3c'], ['מילון: מודוסים (לדורי של היום)', 'glossary/modes']]),
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
        steps: ['האגודל מנגן בס על פעמה 1 ועל פעמה 3, קבוע כמו שעון. על 1: התו שעל שמו האקורד (ב-Cmaj7 – C, מיתר 5 סריג 3). על 3: התו החמישי של האקורד (ב-Cmaj7 – G, מיתר 6 סריג 3).', 'האצבעות (i-m-a יחד) "צובטות" את שלושת המיתרים העליונים של האקורד, בדיוק במקומות שבטאב. חלק מהצביטות נופלות **בין** הפעמות – וזה מה שנותן לבוסה את הנדנוד.', 'קודם על Cmaj7 בלבד, אחר כך Cmaj7 – A7 – Dm7 – G7.', 'זה דפוס מפושט שכתבתי לתרגול. בוסה אמיתית מגוונת את המקומות של האקורד.'],
        content: [{ t: 'tab', title: 'בוסה על Cmaj7 (בס על 1 ו-3)', lines: BOSSA_CMAJ7 }, { t: 'chords', items: ['Cmaj7', 'A7', 'Dm7', 'G7'].map((n) => ({ name: n, frets: CH[n] })) }, { t: 'metronome', bpm: 60 }],
      },
      romanza('f', 'כל חלק A', 20, true),
      songBlock('song', 'shape', 25, ['ריף + בית. נסה לנגן עם ההקלטה.']),
      { id: 'i', kind: 'improv', title: 'מנגינה מעל Cmaj7 – A7 – Dm7 – G7', min: 20, core: true, steps: ['הלופ מנגן Cmaj7–A7–Dm7–G7.', 'אלתר רק עם התווים של האקורד שמתנגן כרגע. התו השלישי והתו השביעי של כל אקורד הם אלה שנשמעים הכי "ג\'אזי" (ב-Cmaj7: E ו-B).'], content: [strum('quarters', ['Cmaj7', 'A7', 'Dm7', 'G7'], 70, 'ליווי ברבעים רכים.')] },
      appBlock('a', 'תיאוריה, יחידה 4: איך בנוי אקורד, ומז\'ור מול מינור', [['שיעור: אקורד = 1 + 3 + 5', 'lesson/t4a'], ['שיעור: מז\'ור מול מינור', 'lesson/t4b'], ['שמיעה: ספטימות', 'lesson/ear4b']]),
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
      appBlock('a', 'תיאוריה: פאוור קורד, sus ו-add', [['שיעור: פאוור קורד, sus ו-add', 'lesson/t4d'], ['מילון: מודוסים (לפריגי של היום)', 'glossary/modes']], 15),
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
      { id: 'song2', kind: 'song', title: 'הכנה ליום הבדיקה', min: 35, core: false, songs: ['sikui', 'hallelujah', 'mimaamakim', 'blues', 'dmama'], steps: ['השירים שפחות יושבים – עכשיו.'] },
      free('free', 25),
    ],
  },
  {
    n: 14, week: 2, title: 'יום בדיקה: כמה התקדמת?', focus: 'אותם תרגילים כמו ביום 1, הקלטה, ציון לכל שיר – ובחירה מה ללטש בשבוע 3',
    blocks: [
      { ...warm('w', 'chromatic'), steps: ['אותו חימום כמו ביום 1. עלה ב-BPM עד המהירות הכי גבוהה שבה זה עדיין נקי – ורשום למטה.', 'במסך "ההתקדמות שלי" תראה את המספר של יום 1 מול היום.'] },
      {
        id: 's', kind: 'strum', title: 'מבחן מקצבים', min: 15, core: true, bpm: { start: 60, target: 100 },
        steps: ['כל מקצב – 2 דקות עם הלופ, בלי לעצור.', 'רשום את ה-BPM הכי גבוה שבו פולק יוצא יציב.'],
        content: [strum('folk', ['Am', 'F', 'C', 'G'], 80), strum('sixEight', ['C', 'Am'], 60), strum('shuffle', ['E7', 'A7', 'E7', 'B7'], 80)],
      },
      {
        id: 'set', kind: 'song', title: 'כל השירים – וציון לכל אחד', min: 40, core: true, songs: REP14, rate: REP14,
        steps: ['נגן כל שיר פעם אחת מההתחלה עד הסוף, בלי לעצור על טעויות.', 'מיד אחרי כל שיר – תן לו ציון בטבלה למטה. היה כנה: הציון הזה קובע מה תלטש בשבוע 3.'],
      },
      { id: 'rec', kind: 'record', title: 'הקלטה והשוואה ליום 1', min: 20, core: true, steps: ['הקלט בדיוק מה שהקלטת ביום 1: "יש לי סיכוי", הפנטטוני עם המטרונום, ודקה של אלתור.', 'במסך "ההתקדמות שלי" יש את כל ההקלטות לפי הסדר. הקשב ליום 1 ואז להיום. רשום לעצמך 3 דברים שהשתפרו.'] },
      { id: 'next', kind: 'free', title: 'מה מלטשים בשבוע 3?', min: 10, core: true, steps: ['פתח את "ההתקדמות שלי" (הכפתור במסך התוכנית).', 'שני השירים עם הציון הנמוך ביותר – הם אלה שיופיעו בבלוקים "ליטוש" בשבוע 3.', 'מקצב שה-BPM שלו כמעט לא עלה? זה סימן לתרגל אותו לאט יותר, לא יותר מהר.'] },
      free('free', 30),
    ],
  },

  /* ───── Week 3: new songs, polishing, performance ───── */
  {
    n: 15, week: 3, title: 'Babydoll ואקורד הברה Gm', focus: 'שיר עכשווי, מעבר מהיר להברה, מינור פנטטוני ב-D',
    blocks: [
      warm('w', 'changes', ['Dm', 'A', 'Gm']),
      {
        id: 's', kind: 'strum', title: 'מקצב פופ עם הדגשות', min: 20, core: true, bpm: { start: 70, target: 90 },
        steps: ['פולק עם הדגשה על 2 ו-4 על Dm – A – Gm – A.', 'הקושי: לעבור ל-Gm בזמן. טריק: על ה-& האחרון של התיבה (המכה למעלה) היד השמאלית כבר עוזבת ועוברת. זה בסדר שהמכה הזאת תצא קצת "ריקה".'],
        content: [{ t: 'chords', items: chordsOf('Dm', 'A', 'Gm') }, strum('backbeat', ['Dm', 'A', 'Gm', 'A'], 70)],
      },
      romanza('f', 'חלק B: תיבות 17–20', 20, true, ['חלק B עובר למי מז\'ור. הטאב בעמוד היצירה, מתחת לחלק A.', 'בתיבות 19–20 המנגינה עוברת למיתר 2 – יד ימין זזה מיתר אחד למטה.']),
      songBlock('song', 'babydoll', 35, ['10 דק\': שלושת האקורדים ו"דקת מעברים" על A → Gm.', '15 דק\': המקצב מהבלוק הקודם, עם ההקלטה ברקע ב-70 BPM.', '10 דק\': בית + פזמון ברצף.']),
      {
        id: 'i', kind: 'improv', title: 'D מינור פנטטוני מעל Babydoll', min: 20, core: true,
        steps: ['זו בדיוק צורה 1 שאתה מכיר – רק מסריג 10 במקום מסריג 5.', 'כשהלופ מגיע לאקורד A: סיים את המשפט על התו A – הוא נמצא גם ב-Dm וגם ב-A. הימנע שם מהתו C, שמתנגש עם האקורד.'],
        content: [{ t: 'tab', title: 'D מינור פנטטוני – צורה 1, סריגים 10–13', lines: PENTA_D }, strum('backbeat', ['Dm', 'A', 'Gm', 'A'], 80)],
      },
      appBlock('a', 'שמיעה: זיהוי דרגות (איזה אקורד זה בסולם?)', [['שיעור: זיהוי דרגות', 'lesson/ear4c']]),
      polish('pol', 25),
      free('free', 35),
    ],
  },
  {
    n: 16, week: 3, title: 'מעליי דממה לעומק', focus: 'בית חלש ופזמון מלא, ארפג\' לבית',
    blocks: [
      warm('w', 'spider'),
      {
        id: 's', kind: 'strum', title: 'בית חלש, פזמון מלא', min: 20, core: true, bpm: { start: 65, target: 85 },
        steps: ['בית: מקצב בלדה, חלש, קרוב לגשר.', 'פזמון: מקצב פולק, יד פתוחה וחזקה יותר.', 'תרגל את הרגע של המעבר מבית לפזמון – בלי לעצור ובלי לשנות מהירות.'],
        content: [strum('ballad', ['Am', 'F', 'G', 'C'], 65), strum('folk', ['Am', 'F', 'G', 'C'], 65)],
      },
      {
        id: 'f', kind: 'finger', title: 'ארפג\' לבית של מעליי דממה', min: 20, core: true, bpm: { start: 55, target: 80 },
        steps: ['במקום לפרוט – מנגנים כל אקורד תו אחרי תו: אגודל על הבס, ואז i-m-a-m.', 'כל אקורד פעמיים, ואז המעבר הבא. האגודל עובר מיתר לפי האקורד – ראה בטאב.', 'אפשר לנגן ככה את הבית, ולעבור לפריטה במקצב בפזמון.'],
        content: [{ t: 'tab', title: 'Am → F → G → C (צורות, עם קאפו 1)', lines: ARP_DMAMA }, { t: 'metronome', bpm: 55 }],
      },
      songBlock('song', 'dmama', 35, ['10 דק\': סדר האקורדים של כל השיר (מ-Tab4U).', '15 דק\': בית בארפג\', פזמון בפריטה במקצב.', '10 דק\': כל השיר עם ההקלטה.']),
      {
        id: 'i', kind: 'improv', title: 'אלתור מעל Am – F – G – C', min: 20, core: true,
        steps: ['A מינור פנטטוני, צורה 1 (בלי קאפו – הלופ באפליקציה מנגן בלי קאפו).', 'נסה לסיים כל משפט על תו מתוך האקורד שמתנגן. על F: התו F עצמו לא נמצא בפנטטוני, אז סיים על A או C – שניהם חלק מאקורד F.'],
        content: [{ t: 'tab', title: 'A מינור פנטטוני – צורה 1', lines: PENTA1 }, strum('folk', ['Am', 'F', 'G', 'C'], 80)],
      },
      appBlock('a', 'שמיעה: מהלכי אקורדים', [['שיעור: מהלכי אקורדים', 'lesson/ear5a']]),
      polish('pol', 25),
      romanza('rom', 'חלק B: תיבות 21–24', 20, false),
      free('free', 15),
    ],
  },
  {
    n: 17, week: 3, title: 'למצוא מקצב לבד', focus: 'השיטה על שיר שלא למדנו – בלי עזרה',
    blocks: [
      warm('w', 'changes', ['F', 'G', 'Am', 'Gm']),
      {
        id: 's', kind: 'strum', title: 'מבחן: מקצב לשיר חדש', min: 25, core: true,
        steps: ['בחר שיר שאתה אוהב ושלא נמצא בתוכנית (יש לו אקורדים ב-Tab4U).', 'עבור על 5 השלבים של השיטה, אחד-אחד. כתוב לעצמך: משקל, איפה ההדגשות, כמה צפוף.', 'נגן עם ההקלטה. אם מרגיש "לא יושב" – חזור לשלב 4: רבעים עם ההדגשות, ומשם הוסף.', 'בונוס: חפש סרטון של מישהו שמנגן את השיר ובדוק כמה קרוב היית.'],
        content: [STRUM_METHOD],
      },
      romanza('f', 'חלק B: תיבות 25–32', 20, true),
      { id: 'song', kind: 'song', title: 'Babydoll + מעליי דממה עם ההקלטה', min: 30, core: true, songs: ['babydoll', 'dmama'], steps: ['כל שיר פעמיים מההתחלה עד הסוף, עם ההקלטה המקורית.'] },
      { id: 'i', kind: 'improv', title: 'בלוז: שאלה ותשובה', min: 20, core: true, steps: ['12 תיבות בלוז. כל 2 תיבות: משפט "שאלה" ואחריו משפט "תשובה".', 'השתמש בהאמר-און ובתו הכחול לפחות פעם אחת בכל סבב.'], content: [{ t: 'tab', title: 'A בלוז', lines: BLUES_A }, strum('shuffle', BLUES12, 85)] },
      appBlock('a', 'תיאוריה: איך קוראים שם של אקורד (כולל Am/G ו-C/B)', [['שיעור: שמות של אקורדים', 'lesson/t4e'], ['מילון: היפוכים', 'glossary/inversions']]),
      polish('pol', 25),
      free('free', 35),
    ],
  },
  {
    n: 18, week: 3, title: 'פלמנקו ו-Malagueña', focus: 'רסגאדו, רומבה, להמשיך את היצירה',
    blocks: [
      { id: 'w', kind: 'warm', title: 'חימום: רסגאדו', min: 10, core: true, steps: ['כמו ביום 12: אצבעות יוצאות אחת-אחת – זרת, קמיצה, אמה, אצבע – ואז מכה למעלה.', 'לאט ושווה. נסה 4 סבבים ברצף בלי הפסקה.'], content: [{ t: 'chords', items: chordsOf('E', 'Am') }] },
      { id: 'st', kind: 'style', title: 'רומבה על מעליי דממה', min: 20, core: true, bpm: { start: 70, target: 100 }, steps: ['קח את מקצב הרומבה מיום 12 ושים אותו על Am – F – G – C.', 'פתאום אותו שיר נשמע ספרדי. ככה מנגנים "מבינים" מקצב: אותו מקצב עובד על כל שיר עם משקל דומה.'], content: [strum('rumba', ['Am', 'F', 'G', 'C'], 75)] },
      { id: 'p', kind: 'piece', title: 'Malagueña – המשך', min: 35, core: true, songs: ['malaguena'], steps: ['10 דק\': חזרה על מה שלמדת ביום 12–13.', '20 דק\': השיעור הבא בסדרה (קישור בעמוד היצירה).', '5 דק\': הכל ברצף, לאט.'] },
      romanza('f', 'חלק B כולו', 20, true),
      { id: 'i', kind: 'improv', title: 'פריגי מעל המהלך האנדלוסי', min: 20, core: true, steps: ['E פריגי מעל Am – G – F – E. נסה לסיים כל משפט בירידה F → E.'], content: [{ t: 'tab', title: 'E פריגי', lines: PHRYG_E }, strum('rumba', ['Am', 'G', 'F', 'E'], 80)] },
      appBlock('a', 'שמיעה: מודוסים באוזן', [['שיעור: מודוסים באוזן', 'lesson/ear5b']]),
      polish('pol', 25),
      free('free', 35),
    ],
  },
  {
    n: 19, week: 3, title: 'פינגרסטייל ויצירות', focus: 'שתי היצירות ושירי האצבעות',
    blocks: [
      warm('w', 'spider'),
      romanza('p1', 'כל היצירה (A + B)', 30, true),
      { id: 'shape', kind: 'song', title: 'Shape of My Heart', min: 25, core: true, songs: ['shape'], steps: ['ריף + בית, פעמיים ברצף.', 'מתמקד בצליל: כל תו של הריף מצלצל עד התו הבא.'] },
      { id: 'song', kind: 'song', title: 'Dust in the Wind + The Sound of Silence', min: 25, core: true, songs: ['dust', 'silence'], steps: ['כל שיר פעם אחת מלאה, בקצב שבו הוא נקי.'] },
      { id: 'i', kind: 'improv', title: 'אלתור חופשי', min: 15, core: true, steps: ['בחר סגנון אחד מהשבוע השני ואלתר עם הלופ שלו.'], content: [strum('shuffle', BLUES12, 85), strum('funk16', ['Am7', 'D9'], 80), strum('rumba', ['Am', 'G', 'F', 'E'], 85)] },
      appBlock('a', 'תיאוריה, יחידה 5: אקורדים בסולם – למה בשיר יש דווקא את האקורדים האלה', [['שיעור: אקורדים בתוך סולם', 'lesson/th4a']]),
      { id: 'p2', kind: 'piece', title: 'Malagueña', min: 20, core: false, songs: ['malaguena'], steps: ['המשך מאתמול.'] },
      polish('pol', 25, false),
      free('free', 15),
    ],
  },
  {
    n: 20, week: 3, title: 'חזרה גנרלית', focus: 'ליטוש אחרון והרצה מלאה',
    blocks: [
      warm('w', 'chromatic'),
      { ...polish('pol', 30, true), title: 'ליטוש: השיר הכי חלש' },
      { ...polish('pol2', 25, true), title: 'ליטוש: השיר השני' },
      { id: 'set', kind: 'song', title: 'הרצה מלאה כמו בהופעה', min: 40, core: true, songs: REP21, steps: ['כל הרפרטואר ברצף. בלי לעצור – גם כשיש טעות, ממשיכים.', 'סמן איפה נתקעת – 5 דקות על כל מקום כזה בסוף.'] },
      appBlock('a', 'תיאוריה, יחידה 6: מינור ומינור מקביל', [['שיעור: סולם מינור', 'lesson/th3c']]),
      free('free', 45),
    ],
  },
  {
    n: 21, week: 3, title: 'הופעה סופית והקלטה', focus: 'לנגן הכל, להקליט, ולהשוות ליום 1 וליום 14',
    blocks: [
      warm('w', 'chromatic'),
      { id: 'set', kind: 'song', title: 'ה"הופעה": כל הרפרטואר – וציון סופי', min: 50, core: true, songs: REP21, rate: REP21, steps: ['נגן כמו בהופעה: בלי לעצור, גם כשיש טעות.', 'סדר מומלץ: מהשקט לאנרגטי, ויצירה באמצע.', 'אחרי כל שיר – ציון בטבלה. במסך "ההתקדמות שלי" תראה אותו ליד הציון של יום 14.'] },
      { id: 'rec', kind: 'record', title: 'הקלטת סיום', min: 25, core: true, steps: ['הקלט את מה שהקלטת ביום 1 וביום 14, ועוד 2 שירים ויצירה.', 'במסך "ההתקדמות שלי" – הקשב להקלטות של יום 1, 14 והיום, אחת אחרי השנייה. רשום מה השתנה.'] },
      { id: 'next', kind: 'free', title: 'מה הלאה?', min: 15, core: true, steps: ['רשום: ממה הכי נהנית? מה עדיין הכי קשה?', 'בחר 2 שירים חדשים ויעד לחודש הבא – ותגיד לי, נבנה את השלב הבא.'] },
      free('free', 30),
    ],
  },
];

/** Minutes of core and optional practice for a day. */
export const dayMinutes = (d: PlanDay) => ({
  core: d.blocks.filter((b) => b.core).reduce((s, b) => s + b.min, 0),
  extra: d.blocks.filter((b) => !b.core).reduce((s, b) => s + b.min, 0),
});

export const WEEK_TITLES: Record<number, string> = {
  1: 'חזרה לכושר, מקצב ופריטה באצבעות',
  2: 'סגנונות, יצירות ויום בדיקה',
  3: 'שירים חדשים, ליטוש והופעה',
};

export const planIntro: Block[] = [
  p('**21 ימים, בלי תאריכים.** בכל יום יש **ליבה** של כשעתיים, ועוד **שעה רשות**. מסיימים יום – עוברים לבא, גם אם זה לקח יומיים.'),
  list(
    '**כל יום בנוי מבלוקים.** לוחצים על בלוק כדי לפתוח אותו: יש בו טיימר, שלבים ממוספרים, טאבים וליווי שמתנגן.',
    '**✓** בעיגול = סיימתי את הבלוק. אפשר לבטל בלחיצה נוספת.',
    '**יומן BPM** בתחתית בלוקים טכניים: רושמים לאיזו מהירות הגעת. כך רואים התקדמות.',
    '**מילה לא ברורה?** בכל בלוק יש כפתור 📖 שפותח הסבר מהמילון.',
  ),
  h('נקודות בדיקה'),
  list('**יום 1:** הקלטת בסיס.', '**יום 14:** אותם תרגילים והקלטה, וציון לכל שיר. הציונים קובעים מה מלטשים בשבוע 3.', '**יום 21:** הופעה, הקלטה וציון סופי – ומשווים הכל במסך "ההתקדמות שלי".'),
  h('כללים'),
  list('**חימום תמיד ראשון**, והפסקה של 5 דק\' כל 40 דק\'.', 'כאב חד או נימול – עוצרים. עייפות בשרירים – זה בסדר.', 'לאט ונקי לפני מהר. מטרונום בכל דבר טכני.'),
  tip('בלוק שלא הספקת? לא נורא – תעביר אותו ליום הבא או דלג. העקביות חשובה יותר משלמות.'),
];
