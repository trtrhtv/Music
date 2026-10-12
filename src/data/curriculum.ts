import type { AudioCue, Domain } from '../engine/types';

export interface Lesson {
  id: string;
  domain: Domain;
  level: number;
  title: string;
  intro: string[];
  demos?: { label: string; cue: AudioCue; timbre?: 'piano' | 'guitar' }[];
  /** [generator id, how many] */
  drills: [string, number][];
}

export const UNIT_TITLES: Record<Domain, string[]> = {
  theory: ['', 'יסודות: תווים וחמשה', 'סולמות ומרווחים', 'אקורדים וטונליות', 'הרמוניה', 'מודוסים והרמוניה מתקדמת'],
  ear: ['', 'גובה וכיוון', 'מרווחים ראשונים', 'מרווחים ואקורדים', 'ספטימות ודרגות', 'מהלכים ומודוסים'],
  guitar: ['', 'אקורדים פתוחים', 'הצוואר ואקורדי 7', 'הברה ופנטטוני', 'מפת הצוואר', 'אלתור ומודוסים'],
  piano: ['', 'הכרת המקלדת', 'אקורדים וסולם C', 'אקורדים וסולמות', 'ספטימות והרמוניה', 'וויסינג וג\'אז'],
};

const C4 = 60;
export const LESSONS: Lesson[] = [
  /* ───────── THEORY ───────── */
  {
    id: 'th1a', domain: 'theory', level: 1, title: 'שמות התווים',
    intro: [
      'במוזיקה יש 7 תווים "טבעיים": **C D E F G A B** – בסולפג\' דו, רה, מי, פה, סול, לה, סי.',
      'אחרי B חוזרים ל-C, גבוה יותר באוקטבה. המרחק הזה – 8 תווים – נקרא **אוקטבה**.',
    ],
    demos: [{ label: 'C D E F G A B C', cue: { type: 'seq', notes: [60, 62, 64, 65, 67, 69, 71, 72], gap: 0.35 } }],
    drills: [['th.solfege', 5], ['th.nextNote', 5]],
  },
  {
    id: 'th1b', domain: 'theory', level: 1, title: 'טונים, חצאי טונים, דיאזים ובמולים',
    intro: [
      '**חצי טון** הוא המרחק הקטן ביותר – קליד אחד ליד השני בפסנתר, או סריג אחד בגיטרה. **טון שלם** = שני חצאי טונים.',
      'בין E–F ובין B–C יש רק חצי טון. בין כל שאר התווים הטבעיים – טון שלם.',
      '**דיאז (#)** מעלה תו בחצי טון, **במול (b)** מוריד בחצי טון. לכן C# ו-Db הם אותו צליל.',
    ],
    demos: [
      { label: 'חצי טון: E → F', cue: { type: 'seq', notes: [64, 65], gap: 0.6 } },
      { label: 'טון שלם: C → D', cue: { type: 'seq', notes: [60, 62], gap: 0.6 } },
    ],
    drills: [['th.semitones', 5], ['th.enharmonic', 5]],
  },
  {
    id: 'th1c', domain: 'theory', level: 1, title: 'קריאת תווים במפתח סול',
    intro: [
      'החמשה בנויה מ-5 קווים. במפתח סול (יד ימין בפסנתר, וגם גיטרה) הקווים מלמטה למעלה הם **E G B D F**, והרווחים ביניהם **F A C E**.',
      'C האמצעי (C4) יושב על קו עזר קטן מתחת לחמשה.',
    ],
    drills: [['th.readTreble', 10]],
  },
  {
    id: 'th2a', domain: 'theory', level: 2, title: 'סולם מז\'ור',
    intro: [
      'סולם מז\'ור בנוי לפי התבנית **ט ט ח ט ט ט ח** (ט = טון, ח = חצי טון).',
      'מכל תו אפשר לבנות סולם מז\'ור – רק צריך להוסיף דיאזים או במולים כדי לשמור על התבנית. למשל G מז\'ור: G A B C D E **F#** G.',
    ],
    demos: [{ label: 'G מז\'ור', cue: { type: 'seq', notes: [55, 57, 59, 60, 62, 64, 66, 67], gap: 0.33 } }],
    drills: [['th.majorPattern', 2], ['th.majorScaleDegree', 8]],
  },
  {
    id: 'th2b', domain: 'theory', level: 2, title: 'מרווחים',
    intro: [
      '**מרווח** = המרחק בין שני תווים. סופרים חצאי טונים: 3 = טרצה קטנה, 4 = טרצה גדולה, 5 = קוורטה, 7 = קווינטה, 12 = אוקטבה.',
      'טרצות וקווינטות הן אבני הבניין של כל האקורדים – שווה להכיר אותן בעל פה.',
    ],
    demos: [
      { label: 'טרצה גדולה', cue: { type: 'seq', notes: [60, 64], gap: 0.6 } },
      { label: 'קווינטה זכה', cue: { type: 'seq', notes: [60, 67], gap: 0.6 } },
    ],
    drills: [['th.intervalName', 10]],
  },
  {
    id: 'th2c', domain: 'theory', level: 2, title: 'מפתח פה',
    intro: ['מפתח פה משמש ליד שמאל בפסנתר ולבס. הקווים מלמטה למעלה: **G B D F A**, והרווחים: **A C E G**.'],
    drills: [['th.readBass', 10]],
  },
  {
    id: 'th3a', domain: 'theory', level: 3, title: 'אקורדים משולשים',
    intro: [
      'אקורד בסיסי (טריאדה) = שורש + טרצה + קווינטה.',
      '**מז\'ור**: טרצה גדולה + קווינטה זכה (C E G). **מינור**: טרצה קטנה + קווינטה זכה (C Eb G).',
      '**מוקטן**: טרצה קטנה + קווינטה מוקטנת (C Eb Gb). **מוגדל**: טרצה גדולה + קווינטה מוגדלת (C E G#).',
    ],
    demos: [
      { label: 'C', cue: { type: 'chord', notes: [60, 64, 67] } },
      { label: 'Cm', cue: { type: 'chord', notes: [60, 63, 67] } },
      { label: 'Cdim', cue: { type: 'chord', notes: [60, 63, 66] } },
      { label: 'Caug', cue: { type: 'chord', notes: [60, 64, 68] } },
    ],
    drills: [['th.triadBuild', 5], ['th.triadId', 5]],
  },
  {
    id: 'th3b', domain: 'theory', level: 3, title: 'סימני היתק ומעגל הקווינטות',
    intro: [
      'כל סולם מז\'ור מקבל מספר קבוע של דיאזים או במולים – **סימני ההיתק**.',
      'במעגל הקווינטות כל צעד של קווינטה למעלה (C → G → D → A…) מוסיף דיאז; כל צעד למטה (C → F → Bb → Eb…) מוסיף במול.',
      'סדר הדיאזים: **F C G D A E B**. סדר הבמולים: **B E A D G C F**.',
    ],
    drills: [['th.keySig', 10]],
  },
  {
    id: 'th3c', domain: 'theory', level: 3, title: 'סולם מינור ומינור מקביל',
    intro: [
      'מינור טבעי: **ט ח ט ט ח ט ט**. לכל מז\'ור יש **מינור מקביל** עם אותם תווים בדיוק, שמתחיל מהדרגה ה-6.',
      'C מז\'ור ↔ A מינור, G מז\'ור ↔ E מינור, F מז\'ור ↔ D מינור.',
    ],
    demos: [{ label: 'A מינור', cue: { type: 'seq', notes: [57, 59, 60, 62, 64, 65, 67, 69], gap: 0.33 } }],
    drills: [['th.relMinor', 5], ['th.minorScaleDeg', 5]],
  },
  {
    id: 'th4a', domain: 'theory', level: 4, title: 'אקורדים בתוך סולם',
    intro: [
      'בונים אקורד על כל דרגה של הסולם רק מתווי הסולם, ומקבלים: **I ii iii IV V vi vii°**.',
      'אותיות גדולות = מז\'ור, קטנות = מינור, ° = מוקטן. ב-C: C Dm Em F G Am Bdim.',
      'זה הבסיס של כמעט כל שיר פופ/רוק – רוב השירים משתמשים ב-I, IV, V ו-vi.',
    ],
    drills: [['th.degreeQuality', 4], ['th.diatonicChord', 6]],
  },
  {
    id: 'th4b', domain: 'theory', level: 4, title: 'אקורדי ספטימה',
    intro: [
      'מוסיפים לטריאדה עוד טרצה ומקבלים אקורד ספטימה – 4 תווים.',
      '**maj7** (C E G B) – רך וחלומי. **7** (C E G Bb) – דומיננטה, מתח. **m7** (C Eb G Bb) – מינור רך. **m7b5** (C Eb Gb Bb) – חצי מוקטן.',
    ],
    demos: [
      { label: 'Cmaj7', cue: { type: 'chord', notes: [60, 64, 67, 71] } },
      { label: 'C7', cue: { type: 'chord', notes: [60, 64, 67, 70] } },
      { label: 'Cm7', cue: { type: 'chord', notes: [60, 63, 67, 70] } },
    ],
    drills: [['th.seventhId', 10]],
  },
  {
    id: 'th4c', domain: 'theory', level: 4, title: 'היפוכים ומהלכים',
    intro: [
      '**היפוך** = אותו אקורד עם תו אחר בבס. היפוכים מאפשרים מעברים חלקים בין אקורדים.',
      'מהלכים שכדאי להכיר: **I–IV–V** (רוק/בלוז), **I–V–vi–IV** (פופ), **ii–V–I** (ג\'אז).',
    ],
    drills: [['th.inversion', 5], ['th.cadence', 5]],
  },
  {
    id: 'th5a', domain: 'theory', level: 5, title: 'מודוסים',
    intro: [
      'אם מנגנים את תווי C מז\'ור אבל מתחילים מ-D, מקבלים **D דורי**. כל דרגה נותנת מודוס עם צבע משלו.',
      'יוני (1), דורי (2), פריגי (3), לידי (4), מיקסולידי (5), איולי (6), לוקרי (7).',
    ],
    demos: [
      { label: 'D דורי', cue: { type: 'seq', notes: [62, 64, 65, 67, 69, 71, 72, 74], gap: 0.3 } },
      { label: 'G מיקסולידי', cue: { type: 'seq', notes: [55, 57, 59, 60, 62, 64, 65, 67], gap: 0.3 } },
    ],
    drills: [['th.modeFromDegree', 4], ['th.modeChar', 3], ['th.modeSpell', 3]],
  },
  {
    id: 'th5b', domain: 'theory', level: 5, title: 'פונקציות ודומיננטות משניות',
    intro: [
      'לכל אקורד יש **פונקציה**: טוניקה (בית), סובדומיננטה (יציאה), דומיננטה (מתח שחוזר הביתה).',
      '**דומיננטה משנית**: אקורד 7 שמוביל לאקורד שאינו הטוניקה. למשל ב-C, A7 מוביל ל-Dm – זה V7/ii.',
    ],
    drills: [['th.function', 4], ['th.secDom', 6]],
  },

  /* ───────── EAR ───────── */
  {
    id: 'ear1a', domain: 'ear', level: 1, title: 'גבוה, נמוך, זהה',
    intro: ['אימון שמיעה מתחיל מהבסיס: האם צליל גבוה או נמוך מקודמו, והאם שני צלילים זהים. האזן עם אוזניות אם אפשר.'],
    drills: [['ear.highLow', 5], ['ear.sameDiff', 5]],
  },
  {
    id: 'ear1b', domain: 'ear', level: 1, title: 'כיוון של מנגינה',
    intro: ['עכשיו שלושה צלילים: שים לב לאן המנגינה הולכת – עולה, יורדת, או משנה כיוון.'],
    drills: [['ear.contour', 8]],
  },
  {
    id: 'ear2a', domain: 'ear', level: 2, title: 'מרווחים ראשונים',
    intro: [
      'נתחיל במרווחים הכי שימושיים: טרצה קטנה, טרצה גדולה, קוורטה, קווינטה ואוקטבה.',
      'טיפ: אוקטבה – "Somewhere over the rainbow". קוורטה – "Here comes the bride". קווינטה – "Star Wars".',
    ],
    demos: [
      { label: 'טרצה קטנה', cue: { type: 'seq', notes: [C4, C4 + 3], gap: 0.6 } },
      { label: 'טרצה גדולה', cue: { type: 'seq', notes: [C4, C4 + 4], gap: 0.6 } },
      { label: 'קוורטה', cue: { type: 'seq', notes: [C4, C4 + 5], gap: 0.6 } },
      { label: 'קווינטה', cue: { type: 'seq', notes: [C4, C4 + 7], gap: 0.6 } },
      { label: 'אוקטבה', cue: { type: 'seq', notes: [C4, C4 + 12], gap: 0.6 } },
    ],
    drills: [['ear.intervalsBasic', 10]],
  },
  {
    id: 'ear2b', domain: 'ear', level: 2, title: 'מז\'ור או מינור',
    intro: ['ההבדל בין מז\'ור למינור הוא תו אחד – הטרצה. נסה לחוש את "האור" של המז\'ור מול "הצל" של המינור.'],
    demos: [
      { label: 'מז\'ור', cue: { type: 'chord', notes: [57, 61, 64] } },
      { label: 'מינור', cue: { type: 'chord', notes: [57, 60, 64] } },
    ],
    drills: [['ear.majMin', 10]],
  },
  {
    id: 'ear3a', domain: 'ear', level: 3, title: 'כל המרווחים',
    intro: ['כל 12 המרווחים. אם קשה – שיר בראש את הצליל הראשון ונסה "לטפס" אל השני.'],
    drills: [['ear.intervalsAll', 12]],
  },
  {
    id: 'ear3b', domain: 'ear', level: 3, title: 'ארבעה סוגי אקורדים',
    intro: ['מז\'ור – יציב ובהיר. מינור – כהה. מוקטן – מתוח ולחוץ. מוגדל – "מרחף", לא פתור.'],
    drills: [['ear.triadQuality', 10]],
  },
  {
    id: 'ear3c', domain: 'ear', level: 3, title: 'סוגי סולמות',
    intro: ['מז\'ור, מינור טבעי, מינור הרמוני (עם הקפיצה ה"מזרחית" בין 6 ל-7), ופנטטוני מינור (5 תווים).'],
    drills: [['ear.scaleType', 8]],
  },
  {
    id: 'ear4a', domain: 'ear', level: 4, title: 'מרווחים הרמוניים',
    intro: ['עכשיו שני הצלילים יחד. סקונדות ונונות – חיכוך. טרצות וסקסטות – מתוק. קווינטה ואוקטבה – "חלול".'],
    drills: [['ear.intervalsHarmonic', 10]],
  },
  {
    id: 'ear4b', domain: 'ear', level: 4, title: 'אקורדי ספטימה',
    intro: ['maj7 – רך וחלומי, 7 – בלוזי ומתוח, m7 – מינור רך, m7b5 – כהה ולא יציב.'],
    drills: [['ear.sevenths', 10]],
  },
  {
    id: 'ear4c', domain: 'ear', level: 4, title: 'זיהוי דרגות',
    intro: [
      'קודם תשמע מהלך I–IV–V–I שמקבע את הטונליות, ואחר כך צליל אחד. נסה לזהות איזו דרגה בסולם הוא.',
      'זו המיומנות שמאפשרת לנגן שירים "מהאוזן".',
    ],
    drills: [['ear.scaleDegree', 10]],
  },
  {
    id: 'ear5a', domain: 'ear', level: 5, title: 'מהלכי אקורדים',
    intro: ['זהה מהלכים נפוצים. הקשב במיוחד לבס – הוא מגלה את הדרגות.'],
    drills: [['ear.progression', 10]],
  },
  {
    id: 'ear5b', domain: 'ear', level: 5, title: 'מודוסים באוזן',
    intro: ['דורי – מינור עם 6 "מוארת". מיקסולידי – מז\'ור עם 7 נמוכה. לידי – מז\'ור עם 4# "מרחפת". פריגי – מינור עם 2b "ספרדית".'],
    drills: [['ear.mode', 10]],
  },

  /* ───────── GUITAR ───────── */
  {
    id: 'gt1a', domain: 'guitar', level: 1, title: 'מיתרים ואקורדים פתוחים',
    intro: [
      'מיתרי הגיטרה מהעבה (6) לדק (1): **E A D G B E**.',
      'שמונת האקורדים הפתוחים הבסיסיים: **Em, Am, C, G, D, E, A, Dm** – איתם אפשר לנגן מאות שירים.',
      'בדיאגרמה: קווים אנכיים = מיתרים (6 משמאל), מספרים = סריגים, × = לא לנגן, ○ = מיתר פתוח.',
    ],
    drills: [['gt.openStrings', 3], ['gt.chordShapes', 7]],
  },
  {
    id: 'gt1b', domain: 'guitar', level: 1, title: 'תרגול עם הגיטרה – מיקרופון',
    intro: [
      'קח את הגיטרה! האפליקציה תקשיב דרך המיקרופון ותבדוק שניגנת נכון.',
      'מומלץ לכוון את הגיטרה קודם (יש מכוון בלשונית "כלים"). אם אין גיטרה כרגע – אפשר לדלג.',
    ],
    drills: [['gt.micOpenString', 3], ['gt.micOpenChord', 5]],
  },
  {
    id: 'gt2a', domain: 'guitar', level: 2, title: 'תווים על מיתרי הבס',
    intro: [
      'הכרת התווים על מיתר 6 ומיתר 5 היא המפתח לאקורדי הברה ולסולמות.',
      'מיתר 6: F(1) G(3) A(5) B(7) C(8) D(10) E(12). מיתר 5: B(2) C(3) D(5) E(7) F(8) G(10) A(12).',
    ],
    drills: [['gt.fretName', 4], ['gt.fretLow', 6]],
  },
  {
    id: 'gt2b', domain: 'guitar', level: 2, title: 'אקורדי ספטימה פתוחים',
    intro: ['E7, A7, D7, G7, C7, B7, Am7, Em7, Cmaj7, Dmaj7, Fmaj7 – צבעים חדשים לבלוז, פולק וג\'אז.'],
    drills: [['gt.chordShapes7', 6], ['gt.micChord7', 3], ['gt.micNote', 2]],
  },
  {
    id: 'gt3a', domain: 'guitar', level: 3, title: 'אקורדי הברה',
    intro: [
      'צורת **E** בהברה: השורש על מיתר 6. צורת **A**: השורש על מיתר 5.',
      'מזיזים את אותה צורה על הצוואר ומקבלים כל אקורד: F = צורת E בסריג 1, Bm = צורת Am בסריג 2.',
    ],
    drills: [['gt.barre', 6], ['gt.micBarre', 4]],
  },
  {
    id: 'gt3b', domain: 'guitar', level: 3, title: 'פנטטוני מינור',
    intro: [
      'הסולם הכי שימושי לסולו ברוק ובלוז. התיבה הראשונה מתחילה בשורש על מיתר 6.',
      'A מינור פנטטוני: סריג 5 עד 8 על כל המיתרים.',
    ],
    demos: [{ label: 'A מינור פנטטוני', cue: { type: 'seq', notes: [45, 48, 50, 52, 55, 57], gap: 0.3 }, timbre: 'guitar' }],
    drills: [['gt.pentaPosition', 6], ['gt.fretAny', 4]],
  },
  {
    id: 'gt3c', domain: 'guitar', level: 3, title: 'כל הצוואר',
    intro: ['תרגול מציאת כל התווים (כולל דיאזים/במולים) על כל ששת המיתרים.'],
    drills: [['gt.fretAny', 10]],
  },
  {
    id: 'gt4a', domain: 'guitar', level: 4, title: 'צורות אוקטבה וקווינטה',
    intro: [
      'אוקטבה: שני מיתרים למעלה ושני סריגים קדימה (שלושה כשעוברים את מיתר B).',
      'קווינטה: מיתר אחד למעלה, שני סריגים קדימה – זה ה-"Power chord".',
    ],
    drills: [['gt.octaves', 10]],
  },
  {
    id: 'gt4b', domain: 'guitar', level: 4, title: 'צלילי אקורד על הצוואר',
    intro: ['לדעת איפה הטרצה והקווינטה של כל אקורד – זה מה שהופך סולו מ"סולם" למנגינה שמתאימה להרמוניה.'],
    drills: [['gt.chordTone', 10]],
  },
  {
    id: 'gt5a', domain: 'guitar', level: 5, title: 'מודוסים לאלתור',
    intro: ['כל מודוס מתאים לסוג אחר של אקורד: דומיננטה → מיקסולידי, m7 → דורי, maj7#11 → לידי, m7b5 → לוקרי.'],
    drills: [['gt.modeForChord', 6], ['gt.cagedA', 4]],
  },
  {
    id: 'gt5b', domain: 'guitar', level: 5, title: 'מרווחים על הצוואר',
    intro: ['מצא כל מרווח מכל תו – זו מפה שתשחרר אותך מתיבות.'],
    drills: [['gt.intervalsNeck', 10]],
  },

  /* ───────── PIANO ───────── */
  {
    id: 'pn1a', domain: 'piano', level: 1, title: 'מבנה המקלדת',
    intro: [
      'הקלידים השחורים מסודרים בקבוצות של 2 ו-3. **C** תמיד משמאל לקבוצת השניים, **F** משמאל לקבוצת השלושה.',
      'בין E ל-F ובין B ל-C אין קליד שחור – חצי טון בלבד.',
    ],
    drills: [['pn.layout', 3], ['pn.findNatural', 7]],
  },
  {
    id: 'pn1b', domain: 'piano', level: 1, title: 'לפסנתר! (מיקרופון)',
    intro: ['ניגש לפסנתר האמיתי. האפליקציה תקשיב ותבדוק. אין פסנתר זמין? אפשר לדלג.'],
    drills: [['pn.micNote', 6]],
  },
  {
    id: 'pn2a', domain: 'piano', level: 2, title: 'קלידים שחורים ואקורדי מז\'ור',
    intro: [
      'לכל קליד שחור שני שמות: C# = Db וכן הלאה.',
      'אקורד מז\'ור במקלדת: שורש, מדלגים 4 חצאי טונים, ועוד 3. אצבעות 1-3-5 ביד ימין.',
    ],
    drills: [['pn.findAccidental', 4], ['pn.majorTriads', 6]],
  },
  {
    id: 'pn2b', domain: 'piano', level: 2, title: 'סולם C ואצבוע',
    intro: [
      'יד ימין: **1-2-3**, האגודל עובר מתחת ל-F, ואז **1-2-3-4-5**.',
      'יד שמאל (עולה): **5-4-3-2-1**, אצבע 3 עוברת מעל ל-A, ואז **3-2-1**.',
    ],
    demos: [{ label: 'C מז\'ור', cue: { type: 'seq', notes: [60, 62, 64, 65, 67, 69, 71, 72], gap: 0.33 } }],
    drills: [['pn.fingering', 6], ['pn.micTriad', 3]],
  },
  {
    id: 'pn3a', domain: 'piano', level: 3, title: 'מינור, מוקטן, מוגדל',
    intro: ['מאקורד מז\'ור: מורידים את האמצעי חצי טון → מינור. מורידים גם את העליון → מוקטן. מעלים את העליון → מוגדל.'],
    drills: [['pn.triads', 10]],
  },
  {
    id: 'pn3b', domain: 'piano', level: 3, title: 'היפוכים',
    intro: ['C בהיפוך ראשון: E G C. בהיפוך שני: G C E. היפוכים מאפשרים לנוע בין אקורדים כמעט בלי להזיז את היד.'],
    drills: [['pn.inversions', 8]],
  },
  {
    id: 'pn3c', domain: 'piano', level: 3, title: 'סולמות מז\'ור',
    intro: ['תבנית ט ט ח ט ט ט ח, מכל תו. סמן את כל תווי הסולם במקלדת.'],
    drills: [['pn.scaleTap', 8]],
  },
  {
    id: 'pn4a', domain: 'piano', level: 4, title: 'אקורדי ספטימה במקלדת',
    intro: ['מוסיפים טרצה מעל הטריאדה. maj7 = 11 חצאי טונים מהשורש, 7 ו-m7 = 10.'],
    drills: [['pn.sevenths', 10]],
  },
  {
    id: 'pn4b', domain: 'piano', level: 4, title: 'אקורדי הסולם',
    intro: ['נגן את האקורדים של כל דרגה בסולם – הבסיס לליווי שירים.'],
    drills: [['pn.diatonic', 10]],
  },
  {
    id: 'pn5a', domain: 'piano', level: 5, title: 'Shell voicings ו-ii–V–I',
    intro: [
      'בג\'אז מנגנים ביד שמאל רק **שורש + טרצה + ספטימה** – ה"קליפה" של האקורד. היד הימנית חופשית למנגינה.',
      'ii–V–I ב-C: Dm7 – G7 – Cmaj7.',
    ],
    drills: [['pn.shells', 5], ['pn.iiVI', 5]],
  },
  {
    id: 'pn5b', domain: 'piano', level: 5, title: 'מודוסים על המקלדת',
    intro: ['סמן את תווי המודוס. חשוב על המז\'ור שהוא "יוצא" ממנו – D דורי = תווי C מז\'ור.'],
    drills: [['pn.modeTap', 8]],
  },
];

export const lessonsFor = (d: Domain) => LESSONS.filter((l) => l.domain === d);
export const LESSON_BY_ID = Object.fromEntries(LESSONS.map((l) => [l.id, l]));
