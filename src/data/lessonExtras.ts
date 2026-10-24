import type { Lesson } from './curriculum';
import { chord, h, list, seq, sounds, tip, type Block } from './blocks';

/**
 * Visual explanations and glossary links for each lesson, kept apart from the lesson list so the
 * curriculum stays readable. `more` paragraphs are appended to the lesson's intro text.
 */
export const LESSON_EXTRAS: Record<string, { more?: string[]; extra?: Block[]; see?: string[] }> = {
  /* ───────── THEORY ───────── */
  th1c: {
    extra: [
      { t: 'staff', spec: { clef: 'treble', notes: ['E4', 'G4', 'B4', 'D5', 'F5'] }, labels: ['E', 'G', 'B', 'D', 'F'], caption: 'התווים על הקווים' },
      { t: 'staff', spec: { clef: 'treble', notes: ['F4', 'A4', 'C5', 'E5'] }, labels: ['F', 'A', 'C', 'E'], caption: 'התווים ברווחים' },
      { t: 'staff', spec: { clef: 'treble', notes: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'] }, labels: ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'], caption: 'סולם C מז\'ור – מ-C האמצעי' },
    ],
    see: ['staff'],
  },
  th2c: {
    more: ['C האמצעי (C4) יושב על קו עזר אחד **מעל** חמשת מפתח הפה – אותו C כמו במפתח סול, רק מהצד השני.'],
    extra: [
      { t: 'staff', spec: { clef: 'bass', notes: ['G2', 'B2', 'D3', 'F3', 'A3'] }, labels: ['G', 'B', 'D', 'F', 'A'], caption: 'הקווים' },
      { t: 'staff', spec: { clef: 'bass', notes: ['A2', 'C3', 'E3', 'G3'] }, labels: ['A', 'C', 'E', 'G'], caption: 'הרווחים' },
    ],
    see: ['staff'],
  },
  th3b: {
    extra: [
      { t: 'table', head: ['סולם', 'סימנים'], ltr: [0, 1], rows: [['C', '—'], ['G', 'F#'], ['D', 'F# C#'], ['A', 'F# C# G#'], ['E', 'F# C# G# D#'], ['F', 'Bb'], ['Bb', 'Bb Eb'], ['Eb', 'Bb Eb Ab'], ['Ab', 'Bb Eb Ab Db']] },
    ],
    see: ['keys'],
  },
  th3c: {
    extra: [
      { t: 'keyboard', from: 57, to: 72, labels: 'letters', marks: [57, 59, 60, 62, 64, 65, 67, 69], caption: 'A מינור – אותם תווים כמו C מז\'ור, רק מתחילים מ-A' },
      { t: 'table', head: ['מז\'ור', 'מינור מקביל'], ltr: [0, 1], rows: [['C', 'A'], ['G', 'E'], ['D', 'B'], ['F', 'D'], ['Bb', 'G']] },
    ],
    see: ['scales', 'keys'],
  },
  th4a: {
    extra: [
      { t: 'table', head: ['דרגה', 'ב-C', 'סוג'], ltr: [0, 1], rows: [['I', 'C', 'מז\'ור'], ['ii', 'Dm', 'מינור'], ['iii', 'Em', 'מינור'], ['IV', 'F', 'מז\'ור'], ['V', 'G', 'מז\'ור'], ['vi', 'Am', 'מינור'], ['vii°', 'Bdim', 'מוקטן']] },
      sounds({ label: 'כל אקורדי C מז\'ור', cue: { type: 'prog', chords: [[60, 64, 67], [62, 65, 69], [64, 67, 71], [65, 69, 72], [67, 71, 74], [69, 72, 76], [71, 74, 77]] } }),
    ],
    see: ['roman'],
  },
  th4b: {
    extra: [
      { t: 'table', head: ['סימול', 'מבנה', 'דוגמה'], ltr: [0, 1, 2], rows: [['maj7', 'מז\'ור + 11', 'C E G B'], ['7', 'מז\'ור + 10', 'C E G Bb'], ['m7', 'מינור + 10', 'C Eb G Bb'], ['m7b5', 'מוקטן + 10', 'C Eb Gb Bb']] },
    ],
    see: ['chords', 'chord-symbols'],
  },
  th4c: {
    extra: [
      { t: 'table', head: ['מצב', 'C מז\'ור'], ltr: [1], rows: [['מצב יסודי', 'C E G'], ['היפוך ראשון', 'E G C'], ['היפוך שני', 'G C E']] },
      sounds(
        { label: 'I–IV–V–I', cue: { type: 'prog', chords: [[48, 60, 64, 67], [53, 60, 65, 69], [55, 59, 62, 67], [48, 60, 64, 67]] } },
        { label: 'I–V–vi–IV', cue: { type: 'prog', chords: [[48, 60, 64, 67], [55, 59, 62, 67], [57, 60, 64, 69], [53, 60, 65, 69]] } },
        { label: 'ii–V–I', cue: { type: 'prog', chords: [[50, 60, 65, 69], [55, 59, 65, 67], [48, 59, 64, 67]] } },
      ),
    ],
    see: ['inversions', 'roman'],
  },
  th5a: {
    extra: [
      { t: 'table', head: ['מודוס', 'מדרגה', 'צבע'], rows: [['דורי', '2', 'מינור עם 6 גדולה'], ['פריגי', '3', 'מינור עם b2'], ['לידי', '4', 'מז\'ור עם #4'], ['מיקסולידי', '5', 'מז\'ור עם b7'], ['לוקרי', '7', 'מינור עם b2, b5']] },
    ],
    see: ['modes'],
  },
  th5b: {
    extra: [
      list('**טוניקה** (I, vi) – בית, מנוחה.', '**סובדומיננטה** (ii, IV) – יציאה מהבית.', '**דומיננטה** (V, vii°) – מתח שרוצה לחזור הביתה.'),
      sounds({ label: 'עם דומיננטה משנית: C – A7 – Dm – G7 – C', cue: { type: 'prog', chords: [[48, 60, 64, 67], [57, 61, 64, 67], [50, 62, 65, 69], [55, 59, 62, 65], [48, 60, 64, 67]] } }),
    ],
    see: ['roman'],
  },

  /* ───────── EAR ───────── */
  ear1a: {
    more: ['אין כאן תיאוריה – רק להקשיב. אם קשה, זמזם את שני הצלילים: תרגיש אם הקול שלך עולה או יורד.'],
    extra: [sounds(seq('עולה', [60, 64], 0.8), seq('יורד', [64, 60], 0.8), seq('זהים', [62, 62], 0.8), seq('שונים מעט', [62, 63], 0.8))],
    see: ['ear-tips'],
  },
  ear1b: {
    extra: [sounds(seq('עולה', [60, 64, 67], 0.5), seq('יורדת', [67, 64, 60], 0.5), seq('עולה ויורדת', [60, 67, 64], 0.5), seq('יורדת ועולה', [67, 60, 64], 0.5))],
    see: ['ear-tips'],
  },
  ear2a: {
    extra: [{ t: 'table', head: ['מרווח', 'חצאי טונים', 'שיר'], rows: [['טרצה קטנה', '3', 'Greensleeves'], ['טרצה גדולה', '4', 'When the Saints'], ['קוורטה', '5', 'Here Comes the Bride'], ['קווינטה', '7', 'Star Wars'], ['אוקטבה', '12', 'Over the Rainbow']] }],
    see: ['intervals', 'ear-tips'],
  },
  ear2b: {
    extra: [sounds(chord('C', [60, 64, 67]), chord('Cm', [60, 63, 67]), chord('G', [55, 59, 62]), chord('Gm', [55, 58, 62]))],
    see: ['chords'],
  },
  ear3a: {
    extra: [sounds(...Array.from({ length: 12 }, (_, i) => seq(['m2', 'M2', 'm3', 'M3', 'P4', 'TT', 'P5', 'm6', 'M6', 'm7', 'M7', 'P8'][i], [60, 61 + i], 0.6)))],
    see: ['intervals', 'ear-tips'],
  },
  ear3b: {
    extra: [sounds(chord('מז\'ור', [60, 64, 67]), chord('מינור', [60, 63, 67]), chord('מוקטן', [60, 63, 66]), chord('מוגדל', [60, 64, 68]))],
    see: ['chords'],
  },
  ear3c: {
    extra: [sounds(
      seq('מז\'ור', [60, 62, 64, 65, 67, 69, 71, 72], 0.3), seq('מינור טבעי', [57, 59, 60, 62, 64, 65, 67, 69], 0.3),
      seq('מינור הרמוני', [57, 59, 60, 62, 64, 65, 68, 69], 0.3), seq('פנטטוני מינור', [57, 60, 62, 64, 67, 69], 0.3),
    )],
    see: ['scales'],
  },
  ear4a: {
    extra: [sounds(chord('סקונדה קטנה', [60, 61]), chord('טרצה גדולה', [60, 64]), chord('קווינטה', [60, 67]), chord('ספטימה קטנה', [60, 70]), chord('אוקטבה', [60, 72]))],
    see: ['intervals'],
  },
  ear4b: {
    extra: [sounds(chord('maj7', [60, 64, 67, 71]), chord('7', [60, 64, 67, 70]), chord('m7', [60, 63, 67, 70]), chord('m7b5', [60, 63, 66, 70]))],
    see: ['chords'],
  },
  ear4c: {
    extra: [
      list('**1, 3, 5** – יציבות.', '**7** – רוצה לעלות ל-1.', '**4** – רוצה לרדת ל-3.', '**2, 6** – רוצות לזוז לתו יציב סמוך.'),
      sounds({ label: 'מהלך + דרגה 7 (סי)', cue: { type: 'twoParts', first: { type: 'prog', chords: [[60, 64, 67], [60, 65, 69], [59, 62, 67], [60, 64, 67]] }, second: { type: 'seq', notes: [71] }, pause: 0.6 } }),
    ],
    see: ['ear-tips', 'roman'],
  },
  ear5a: {
    extra: [sounds(
      { label: 'I–IV–V–I', cue: { type: 'prog', chords: [[48, 60, 64, 67], [53, 60, 65, 69], [55, 59, 62, 67], [48, 60, 64, 67]] } },
      { label: 'I–V–vi–IV', cue: { type: 'prog', chords: [[48, 60, 64, 67], [55, 59, 62, 67], [57, 60, 64, 69], [53, 60, 65, 69]] } },
      { label: 'ii–V–I', cue: { type: 'prog', chords: [[50, 62, 65, 69], [55, 59, 62, 67], [48, 60, 64, 67]] } },
      { label: 'I–vi–IV–V', cue: { type: 'prog', chords: [[48, 60, 64, 67], [57, 60, 64, 69], [53, 60, 65, 69], [55, 59, 62, 67]] } },
    )],
    see: ['roman'],
  },
  ear5b: {
    extra: [sounds(
      seq('מז\'ור', [60, 62, 64, 65, 67, 69, 71, 72], 0.28), seq('דורי', [60, 62, 63, 65, 67, 69, 70, 72], 0.28),
      seq('מיקסולידי', [60, 62, 64, 65, 67, 69, 70, 72], 0.28), seq('לידי', [60, 62, 64, 66, 67, 69, 71, 72], 0.28),
      seq('פריגי', [60, 61, 63, 65, 67, 68, 70, 72], 0.28),
    )],
    see: ['modes'],
  },

  /* ───────── GUITAR ───────── */
  gt1a: {
    extra: [
      { t: 'table', head: ['מיתר', 'תו'], ltr: [1], rows: [['6 (העבה)', 'E'], ['5', 'A'], ['4', 'D'], ['3', 'G'], ['2', 'B'], ['1 (הדק)', 'E']] },
      sounds(...[40, 45, 50, 55, 59, 64].map((m, i) => seq(`מיתר ${6 - i}`, [m], 0.5, 'guitar'))),
      h('איך קוראים דיאגרמה'),
      { t: 'diagram', frets: [0, 2, 2, 0, 0, 0], label: 'Em' },
      list('קווים אנכיים = מיתרים (6 משמאל, 1 מימין).', 'נקודה = איפה לוחצים. ○ = מיתר פתוח. × = לא מנגנים.', 'Em: מיתרים 5 ו-4 בסריג 2, כל השאר פתוחים.'),
    ],
    see: ['guitar', 'chord-diagram'],
  },
  gt1b: { extra: [tip('אשר גישה למיקרופון, נגן בחדר שקט עם הטלפון קרוב לגיטרה, ותן לכל צליל לצלצל שנייה.')], see: ['app', 'guitar'] },
  gt2a: {
    extra: [
      { t: 'fretboard', marks: [[0, 0], [0, 1], [0, 3], [0, 5], [0, 7], [0, 8], [0, 10], [0, 12], [1, 0], [1, 2], [1, 3], [1, 5], [1, 7], [1, 8], [1, 10], [1, 12]].map(([s, f]) => ({ s, f })), caption: 'התווים הטבעיים על מיתרים 6 ו-5' },
      tip('E–F ו-B–C צמודים (סריג אחד), כל השאר בהפרש של שני סריגים.'),
    ],
    see: ['guitar', 'barre'],
  },
  gt2b: {
    extra: [{ t: 'diagram', frets: [0, 2, 0, 1, 0, 0], label: 'E7' }, { t: 'diagram', frets: [-1, 0, 2, 0, 2, 0], label: 'A7' }, { t: 'diagram', frets: [-1, 3, 2, 0, 0, 0], label: 'Cmaj7' }],
    see: ['chord-diagram', 'chords'],
  },
  gt3a: {
    extra: [{ t: 'diagram', frets: [1, 3, 3, 2, 1, 1], label: 'F (צורת E)' }, { t: 'diagram', frets: [-1, 2, 4, 4, 3, 2], label: 'Bm (צורת Am)' }],
    see: ['barre', 'chord-diagram'],
  },
  gt3b: {
    extra: [
      { t: 'fretboard', maxFret: 9, marks: [[0, 5, 'A'], [0, 8, 'C'], [1, 5, 'D'], [1, 7, 'E'], [2, 5, 'G'], [2, 7, 'A'], [3, 5, 'C'], [3, 7, 'D'], [4, 5, 'E'], [4, 8, 'G'], [5, 5, 'A'], [5, 8, 'C']].map(([s, f, label]) => ({ s: s as number, f: f as number, label: label as string })), caption: 'A מינור פנטטוני – תיבה 1 (סריגים 5–8)' },
    ],
    see: ['scales', 'barre'],
  },
  gt3c: { more: ['טיפ: למד בעל פה את התווים על מיתרים 6 ו-5, ואת השאר תמצא בעזרת אוקטבות (שני מיתרים למעלה, שני סריגים ימינה).'], extra: [{ t: 'fretboard', names: true, caption: 'כל התווים – לעיון' }], see: ['guitar'] },
  gt4a: {
    extra: [{ t: 'fretboard', maxFret: 9, marks: [{ s: 0, f: 5, label: 'A' }, { s: 1, f: 7, label: 'E' }, { s: 2, f: 7, label: 'A' }], caption: 'A (מיתר 6), הקווינטה E (מיתר 5), והאוקטבה A (מיתר 4)' }],
    see: ['intervals', 'guitar'],
  },
  gt4b: {
    more: ['שלב 1: חשב את התו (למשל הטרצה של G היא B). שלב 2: מצא אותו על המיתר המבוקש.'],
    extra: [{ t: 'fretboard', maxFret: 5, marks: [{ s: 0, f: 3, label: 'G' }, { s: 1, f: 2, label: 'B' }, { s: 2, f: 0, label: 'D' }, { s: 3, f: 0, label: 'G' }, { s: 4, f: 0, label: 'B' }, { s: 5, f: 3, label: 'G' }], caption: 'צלילי אקורד G (G B D) במצב פתוח' }],
    see: ['chords', 'guitar'],
  },
  gt5a: {
    extra: [{ t: 'table', head: ['אקורד', 'מודוס'], ltr: [0], rows: [['A7 (דומיננט)', 'A מיקסולידי'], ['Dm7 (ii ב-C)', 'D דורי'], ['Cmaj7#11', 'C לידי'], ['Bm7b5', 'B לוקרי'], ['E → F', 'E פריגי']] }],
    see: ['modes', 'barre'],
  },
  gt5b: {
    more: ['כל מיתר גבוה ב-5 חצאי טונים מהמיתר שמתחתיו (מלבד G→B, שם 4). לכן קוורטה = אותו סריג במיתר הבא, וקווינטה = מיתר הבא ושני סריגים ימינה.'],
    see: ['intervals', 'guitar'],
  },

  /* ───────── PIANO ───────── */
  pn1a: { extra: [{ t: 'keyboard', from: 48, to: 72, labels: 'both', caption: 'שני השמות לכל קליד לבן' }], see: ['keyboard', 'notes'] },
  pn1b: { extra: [tip('אשר גישה למיקרופון ונגן כל תו פעם אחת, חזק, והחזק אותו לחוץ.')], see: ['app'] },
  pn2a: {
    extra: [
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [61, 63, 66, 68, 70], caption: 'הקלידים השחורים: C# D# F# G# A#' },
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 64, 67], caption: 'C מז\'ור: C E G – אצבעות 1, 3, 5' },
    ],
    see: ['accidentals', 'chords', 'keyboard'],
  },
  pn2b: {
    extra: [{ t: 'table', head: ['תו', 'יד ימין', 'יד שמאל'], ltr: [0], rows: [['C', '1', '5'], ['D', '2', '4'], ['E', '3', '3'], ['F', '1', '2'], ['G', '2', '1'], ['A', '3', '3'], ['B', '4', '2'], ['C', '5', '1']] }],
    see: ['keyboard'],
  },
  pn3a: {
    extra: [
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 63, 67], caption: 'Cm: C Eb G' },
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 63, 66], caption: 'Cdim: C Eb Gb' },
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 64, 68], caption: 'Caug: C E G#' },
    ],
    see: ['chords'],
  },
  pn3b: {
    extra: [
      { t: 'keyboard', from: 60, to: 79, labels: 'letters', marks: [64, 67, 72], caption: 'C בהיפוך ראשון: E G C' },
      { t: 'keyboard', from: 60, to: 79, labels: 'letters', marks: [67, 72, 76], caption: 'C בהיפוך שני: G C E' },
    ],
    see: ['inversions'],
  },
  pn3c: { extra: [{ t: 'keyboard', from: 55, to: 72, labels: 'letters', marks: [55, 57, 59, 60, 62, 64, 66, 67], caption: 'G מז\'ור – F# הוא הקליד השחור היחיד' }], see: ['scales', 'keys'] },
  pn4a: {
    extra: [
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 64, 67, 71], caption: 'Cmaj7: C E G B' },
      { t: 'keyboard', from: 60, to: 72, labels: 'letters', marks: [60, 64, 67, 70], caption: 'C7: C E G Bb' },
    ],
    see: ['chords', 'chord-symbols'],
  },
  pn4b: { extra: [{ t: 'table', head: ['דרגה', 'ב-C', 'ב-G'], ltr: [0, 1, 2], rows: [['I', 'C', 'G'], ['ii', 'Dm', 'Am'], ['iii', 'Em', 'Bm'], ['IV', 'F', 'C'], ['V', 'G', 'D'], ['vi', 'Am', 'Em'], ['vii°', 'Bdim', 'F#dim']] }], see: ['roman'] },
  pn5a: {
    extra: [
      { t: 'keyboard', from: 48, to: 72, labels: 'letters', marks: [55, 59, 65], caption: 'G7 shell: G (בס), B (טרצה), F (ספטימה)' },
      sounds(chord('Dm7 shell', [50, 53, 60]), chord('G7 shell', [43, 53, 59]), chord('Cmaj7 shell', [48, 52, 59])),
    ],
    see: ['chords', 'roman'],
  },
  pn5b: { extra: [{ t: 'keyboard', from: 62, to: 74, labels: 'letters', marks: [62, 64, 65, 67, 69, 71, 72, 74], caption: 'D דורי – כל הקלידים הלבנים מ-D עד D' }], see: ['modes'] },
};

/** Orientation lessons ("lesson 0") – optional, shown first in each track. */
export const INTRO_LESSONS: Lesson[] = [
  {
    id: 'ear0', domain: 'ear', level: 1, title: 'היכרות: איך מתאמנים בשמיעה', optional: true,
    intro: [
      'אימון שמיעה הוא כמו כושר: מעט כל יום עובד הכי טוב. כל תרגיל משמיע משהו אוטומטית, ואפשר להשמיע שוב בכפתור 🔊 כמה שרוצים.',
      'כדאי אוזניות. ואם משהו לא ברור – כפתור ❓ ליד השאלה.',
    ],
    extra: [list('זמזם או שיר את מה ששמעת.', 'קשר מרווחים לשירים מוכרים.', 'אל תמהר – השמע שוב.'), sounds(seq('צליל נמוך → גבוה', [55, 67], 0.8), chord('אקורד', [60, 64, 67]))],
    see: ['ear-tips', 'app'],
    drills: [['ear.highLow', 4]],
  },
  {
    id: 'gt0', domain: 'guitar', level: 1, title: 'היכרות: הגיטרה והמסך', optional: true,
    intro: [
      'לגיטרה 6 מיתרים: **מיתר 6** הוא העבה (E נמוך) ו**מיתר 1** הדק (E גבוה). כל **סריג** על הצוואר מעלה את הצליל בחצי טון.',
      'באפליקציה הצוואר מוצג כמו בטאבים: **מיתר 1 למעלה, מיתר 6 למטה**, והסריגים מתקדמים משמאל לימין. בדיאגרמת אקורד – מיתר 6 בצד שמאל.',
    ],
    extra: [
      { t: 'fretboard', names: true, maxFret: 5, caption: 'חמשת הסריגים הראשונים – לחץ כדי לשמוע' },
      { t: 'diagram', frets: [-1, 3, 2, 0, 1, 0], label: 'C' },
      list('× = לא מנגנים את המיתר', '○ = מיתר פתוח', 'נקודה = לוחצים שם'),
    ],
    see: ['guitar', 'chord-diagram'],
    drills: [['gt.openStrings', 4]],
  },
  {
    id: 'pn0', domain: 'piano', level: 1, title: 'היכרות: המקלדת והאצבעות', optional: true,
    intro: [
      'המקלדת חוזרת על אותה תבנית: קבוצות של **2** ו-**3** קלידים שחורים. **C (דו)** תמיד משמאל לזוג, **F (פה)** משמאל לשלישייה.',
      'אצבעות ממוספרות בשתי הידיים: **1 = אגודל** עד **5 = זרת**.',
    ],
    extra: [{ t: 'keyboard', from: 48, to: 72, labels: 'both' }],
    see: ['keyboard', 'notes'],
    drills: [['pn.findNatural', 4]],
  },
];
