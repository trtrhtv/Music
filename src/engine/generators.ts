import {
  CHORDS, GUITAR_TUNING, INTERVALS, MAJOR_DEGREE_QUALITIES, MAJOR_KEYS, NATURALS, PC_FLAT, PC_SHARP,
  ROMAN, SCALES, SOLFEGE, STRING_LABEL, chordNotes, diatonicChord, heLabel, intervalName, pc, pcOf,
  scaleNotes, spellScale,
} from '../theory/theory';
import { CHORD_SHAPES, shapesAt, shapesUpTo } from './guitarChords';
import type { Domain, Exercise, Generator } from './types';
import { choice, pcAny, pick, rand, sample, shuffle, spellAbove, spellChord } from './util';

const G: Generator[] = [];
const gen = (id: string, domain: Domain, tier: number, title: string, make: () => Exercise) =>
  G.push({ id, domain, tier, title, make });

const ACC_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb', 'Ab', 'F#', 'Db'];
const COMMON_ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Bb', 'Eb'];
const he = (n: string) => heLabel(n.length > 2 ? n.slice(0, 2) : n);
const qualityNames = (ids: string[]) => ids.map((q) => CHORDS[q].name);
const DIAT_IDX = (letter: string, oct: number) => oct * 7 + NATURALS.indexOf(letter);
const fromDiat = (i: number) => NATURALS[i % 7] + Math.floor(i / 7);
const ROOT_MIDI = (name: string, base = 60) => base + pcAny(name); // C4..B4
const semisLabel = (n: number) => (n === 1 ? 'חצי טון אחד' : `${n} חצאי טונים`);
// Familiar song openings for each ascending interval (semitones → song).
const SONGS: Record<number, string> = {
  1: 'מלתעות', 2: 'Happy Birthday', 3: 'Greensleeves', 4: 'When the Saints', 5: 'Here Comes the Bride', 6: 'The Simpsons',
  7: 'Star Wars', 8: 'The Entertainer', 9: 'My Bonnie', 10: 'Star Trek', 12: 'Somewhere Over the Rainbow',
};
const FEEL: Record<string, string> = {
  maj: 'בהיר ויציב', min: 'כהה ועצוב', dim: 'מתוח ולחוץ', aug: 'מרחף ולא פתור',
  maj7: 'רך וחלומי', dom7: 'בלוזי, מתח שרוצה להיפתר', min7: 'מינור רך וג\'אזי', m7b5: 'כהה ולא יציב',
};
// Where each natural note sits relative to the black-key groups.
const KEY_HINT: Record<string, string> = {
  C: 'משמאל לזוג הקלידים השחורים', D: 'בין שני השחורים של הזוג', E: 'מימין לזוג השחורים',
  F: 'משמאל לשלישיית השחורים', G: 'הלבן הראשון בתוך השלישייה', A: 'הלבן השני בתוך השלישייה', B: 'מימין לשלישיית השחורים',
};
/** Note names counted up from an open string, e.g. ('E', 3) → 'F F# G'. */
const countUp = (openMidi: number, frets: number) => Array.from({ length: frets }, (_, i) => PC_SHARP[pc(openMidi + i + 1)]).join(' ');

/* ───────────────────────────── THEORY ───────────────────────────── */

gen('th.solfege', 'theory', 1, 'שמות התווים', () => {
  const letter = pick(NATURALS);
  return Math.random() < 0.5
    ? choice(`מה שם האות של התו "${SOLFEGE[letter]}"?`, letter, NATURALS, { explain: `${SOLFEGE[letter]} = **${letter}**. הסדר: דו C · רה D · מי E · פה F · סול G · לה A · סי B.` })
    : choice(`איך קוראים בסולפג' לתו ${letter}?`, SOLFEGE[letter], Object.values(SOLFEGE), { explain: `**${letter}** = ${SOLFEGE[letter]}. הסדר: דו C · רה D · מי E · פה F · סול G · לה A · סי B.` });
});

gen('th.nextNote', 'theory', 1, 'סדר התווים', () => {
  const i = rand(7);
  const k = pick([1, 2]);
  const ans = NATURALS[(i + k) % 7];
  return choice(
    k === 1 ? `איזה תו בא מיד אחרי ${NATURALS[i]} (כלפי מעלה)?` : `איזה תו נמצא שני צעדים מעל ${NATURALS[i]}?`,
    ans, NATURALS,
    { explain: 'סדר התווים: C D E F G A B ושוב C – אחרי G חוזרים ל-A.' },
  );
});

gen('th.readTreble', 'theory', 1, 'קריאת תווים – מפתח סול', () => {
  const idx = DIAT_IDX('C', 4) + rand(13); // C4..A5
  const n = fromDiat(idx);
  return choice('איזה תו כתוב על החמשה?', he(n[0]), NATURALS.map(he), {
    staff: { clef: 'treble', notes: [n] },
    explain: 'במפתח סול הקווים מלמטה למעלה: E G B D F, והרווחים: F A C E.',
  });
});

gen('th.semitones', 'theory', 1, 'טונים וחצאי טונים', () => {
  const i = rand(7);
  const a = NATURALS[i], b = NATURALS[(i + 1) % 7];
  const half = a === 'E' || a === 'B';
  return choice(`מה המרחק בין ${a} ל-${b} (כלפי מעלה)?`, half ? 'חצי טון' : 'טון שלם', ['חצי טון', 'טון שלם'], {
    n: 2,
    explain: 'בין E ל-F ובין B ל-C יש חצי טון בלבד (אין ביניהם קליד שחור). בין כל שאר התווים הסמוכים – טון שלם.',
  });
});

gen('th.enharmonic', 'theory', 1, 'דיאזים ובמולים', () => {
  const p = pick([1, 3, 6, 8, 10]);
  const sharp = Math.random() < 0.5;
  const q = sharp ? PC_SHARP[p] : PC_FLAT[p];
  const a = sharp ? PC_FLAT[p] : PC_SHARP[p];
  const pool = sharp ? PC_FLAT : PC_SHARP;
  return choice(`איזה שם נוסף יש לתו ${q}?`, a, [pool[(p + 2) % 12], pool[(p + 10) % 12], pool[(p + 1) % 12], pool[(p + 11) % 12]], {
    explain: `${q} ו-${a} הם אותו קליד – שני שמות לאותו צליל (אנהרמוניים).`,
  });
});

gen('th.readBass', 'theory', 2, 'קריאת תווים – מפתח פה', () => {
  const idx = DIAT_IDX('E', 2) + rand(13); // E2..C4
  const n = fromDiat(idx);
  return choice('איזה תו כתוב במפתח פה?', he(n[0]), NATURALS.map(he), {
    staff: { clef: 'bass', notes: [n] },
    explain: 'במפתח פה הקווים מלמטה למעלה: G B D F A, והרווחים: A C E G.',
  });
});

gen('th.majorScaleDegree', 'theory', 2, 'סולם מז\'ור', () => {
  const key = pick(['C', 'G', 'D', 'F', 'Bb', 'A']);
  const notes = spellScale(key, 'major');
  const d = 2 + rand(6);
  const ans = notes[d - 1];
  const wrong = [ans[0], ans[0] + '#', ans[0] + 'b', notes[d % 7], notes[d - 2]].filter((x) => x !== ans);
  return choice(`מה התו ה-${d} בסולם ${key} מז'ור?`, ans, wrong, {
    explain: `${key} מז'ור: ${notes.join(' ')}`,
  });
});

gen('th.intervalName', 'theory', 2, 'מרווחים', () => {
  const root = pick(['C', 'D', 'E', 'F', 'G', 'A']);
  const s = pick([2, 3, 4, 5, 7, 9, 12]);
  const top = spellAbove(root, s);
  const near = [s - 1, s + 1, s - 2, s + 2, 7, 4, 3].filter((x) => x >= 1 && x <= 12 && x !== s);
  return choice(`מה המרווח בין ${root} ל-${top} (כלפי מעלה)?`, intervalName(s), near.map(intervalName), {
    explain: `${s} חצאי טונים = ${intervalName(s)}.`,
  });
});

gen('th.majorPattern', 'theory', 2, 'תבנית הסולם', () => {
  const kind = pick(['major', 'minor'] as const);
  const opts = { major: 'ט ט ח ט ט ט ח', minor: 'ט ח ט ט ח ט ט' };
  return choice(
    `מהי תבנית הטונים (ט) וחצאי הטונים (ח) בסולם ${kind === 'major' ? 'מז\'ור' : 'מינור טבעי'}?`,
    opts[kind],
    [opts.major, opts.minor, 'ט ט ט ח ט ט ח', 'ח ט ט ט ח ט ט'],
    { explain: kind === 'major'
      ? 'מז\'ור: ט ט ח ט ט ט ח. ב-C: חצאי הטונים נופלים בין E–F ובין B–C.'
      : 'מינור טבעי: ט ח ט ט ח ט ט. ב-A מינור: חצאי הטונים בין B–C ובין E–F.' },
  );
});

const triadQs = ['maj', 'min', 'dim', 'aug'];
gen('th.triadId', 'theory', 3, 'זיהוי אקורדים', () => {
  const root = pick(COMMON_ROOTS);
  const q = pick(['maj', 'min', 'maj', 'min', 'dim', 'aug']);
  const notes = spellChord(root, CHORDS[q].steps);
  const sym = (r: string, qq: string) => r + CHORDS[qq].symbol;
  return choice(`איזה אקורד מורכב מהתווים: ${notes.join(' – ')}?`, sym(root, q),
    [...triadQs.map((x) => sym(root, x)), sym(notes[1], 'min'), sym(notes[2], 'maj')], {
      explain: `${sym(root, q)} = ${CHORDS[q].name}: ${notes.join(' ')}`,
    });
});

gen('th.triadBuild', 'theory', 3, 'בניית אקורדים', () => {
  const root = pick(COMMON_ROOTS);
  const q = pick(['maj', 'min', 'dim']);
  const sym = root + CHORDS[q].symbol;
  const fmt = (qq: string) => spellChord(root, CHORDS[qq].steps).join(' ');
  return choice(`מה התווים של האקורד ${sym}?`, fmt(q), triadQs.map(fmt), {
    explain: `${CHORDS[q].name}: שורש + ${CHORDS[q].steps[1] === 4 ? 'טרצה גדולה' : 'טרצה קטנה'} + ${CHORDS[q].steps[2] === 7 ? 'קווינטה זכה' : CHORDS[q].steps[2] === 6 ? 'קווינטה מוקטנת' : 'קווינטה מוגדלת'}.`,
  });
});

const accLabel = (a: number) => (a === 0 ? 'אין סימנים' : a > 0 ? `${a} דיאזים` : `${-a} במולים`).replace(/^1 דיאזים$/, 'דיאז אחד').replace(/^1 במולים$/, 'במול אחד');
gen('th.keySig', 'theory', 3, 'סימני היתק', () => {
  const k = pick(MAJOR_KEYS.filter((x) => Math.abs(x.acc) <= 5));
  const wrong = [k.acc + 1, k.acc - 1, -k.acc, k.acc + 2].filter((a) => Math.abs(a) <= 7);
  return choice(`כמה סימני היתק יש בסולם ${k.name} מז'ור?`, accLabel(k.acc), wrong.map(accLabel), {
    explain: 'סדר הדיאזים: F C G D A E B. סדר הבמולים: B E A D G C F. כל קווינטה מעלה במעגל מוסיפה דיאז.',
  });
});

gen('th.relMinor', 'theory', 3, 'מינור מקביל', () => {
  const k = pick(MAJOR_KEYS.filter((x) => Math.abs(x.acc) <= 4));
  return choice(`מהו הסולם המינורי המקביל ל-${k.name} מז'ור?`, `${k.relMinor} מינור`,
    MAJOR_KEYS.map((x) => `${x.relMinor} מינור`).concat([`${k.name} מינור`]), {
      explain: 'המינור המקביל מתחיל בדרגה ה-6 של המז\'ור (טרצה קטנה מתחת לשורש) ומשתמש באותם תווים.',
    });
});

gen('th.minorScaleDeg', 'theory', 3, 'סולם מינור', () => {
  const key = pick(['A', 'E', 'D', 'B', 'G', 'C']);
  const notes = spellScale(key, 'minor');
  const d = pick([3, 6, 7, 2, 4]);
  const ans = notes[d - 1];
  return choice(`מה התו ה-${d} בסולם ${key} מינור (טבעי)?`, ans,
    [ans[0], ans[0] + '#', ans[0] + 'b', notes[d % 7]].filter((x) => x !== ans), {
      explain: `${key} מינור טבעי: ${notes.join(' ')}`,
    });
});

gen('th.diatonicChord', 'theory', 4, 'אקורדים בסולם', () => {
  const key = pick(['C', 'G', 'D', 'F', 'Bb', 'A', 'Eb']);
  const d = 2 + rand(6);
  const ans = diatonicChord(key, d);
  const others = [1, 2, 3, 4, 5, 6, 7].filter((x) => x !== d).map((x) => diatonicChord(key, x));
  const root = spellScale(key, 'major')[d - 1];
  const flip = MAJOR_DEGREE_QUALITIES[d - 1] === 'maj' ? root + 'm' : root;
  return choice(`מה האקורד על דרגה ${ROMAN[d - 1]} בסולם ${key} מז'ור?`, ans, [flip, ...sample(others, 3)], {
    explain: `ב-${key} מז'ור: ${[1, 2, 3, 4, 5, 6, 7].map((x) => diatonicChord(key, x)).join(' – ')}`,
  });
});

gen('th.degreeQuality', 'theory', 4, 'איכות הדרגות', () => {
  const d = rand(7);
  return choice(`איזה סוג אקורד נבנה על דרגה ${ROMAN[d]} בסולם מז'ור?`, CHORDS[MAJOR_DEGREE_QUALITIES[d]].name,
    qualityNames(['maj', 'min', 'dim', 'aug']), {
      explain: 'במז\'ור: I, IV, V מז\'ור · ii, iii, vi מינור · vii° מוקטן.',
    });
});

const seventhQs = ['maj7', 'dom7', 'min7', 'm7b5'];
gen('th.seventhId', 'theory', 4, 'אקורדי ספטימה', () => {
  const root = pick(COMMON_ROOTS);
  const q = pick(seventhQs);
  const notes = spellChord(root, CHORDS[q].steps);
  return choice(`איזה אקורד מורכב מ: ${notes.join(' – ')}?`, root + CHORDS[q].symbol, seventhQs.map((x) => root + CHORDS[x].symbol), {
    explain: 'maj7 = מז\'ור + ספטימה גדולה · 7 = מז\'ור + ספטימה קטנה · m7 = מינור + ספטימה קטנה · m7b5 = מוקטן + ספטימה קטנה.',
  });
});

gen('th.inversion', 'theory', 4, 'היפוכים', () => {
  const root = pick(COMMON_ROOTS);
  const q = pick(['maj', 'min']);
  const notes = spellChord(root, CHORDS[q].steps);
  const inv = rand(3);
  const voiced = [...notes.slice(inv), ...notes.slice(0, inv)];
  const names = ['מצב יסודי', 'היפוך ראשון', 'היפוך שני'];
  return choice(`האקורד ${root + CHORDS[q].symbol} מנוגן כך (מלמטה למעלה): ${voiced.join(' ')}. באיזה מצב הוא?`, names[inv], names, {
    n: 3,
    explain: 'מצב יסודי – השורש בבס · היפוך ראשון – הטרצה בבס · היפוך שני – הקווינטה בבס.',
  });
});

gen('th.cadence', 'theory', 4, 'מהלכים נפוצים', () => {
  const key = pick(['C', 'G', 'D', 'F', 'Bb', 'A']);
  const kind = pick(['ii-V-I', 'I-IV-V', 'I-V-vi-IV'] as const);
  const degs = { 'ii-V-I': [2, 5, 1], 'I-IV-V': [1, 4, 5], 'I-V-vi-IV': [1, 5, 6, 4] }[kind];
  const sev = kind === 'ii-V-I';
  const prog = (k: string) => degs.map((d) => diatonicChord(k, d, sev)).join(' – ');
  const others = ['C', 'G', 'D', 'F', 'Bb', 'A', 'E'].filter((k) => k !== key).map(prog);
  return choice(`מה האקורדים במהלך ${kind} בסולם ${key} מז'ור?`, prog(key), others, {
    explain: `ב-${key} מז'ור: ${degs.map((d) => `${ROMAN[d - 1]} = ${diatonicChord(key, d, sev)}`).join(' · ')}`,
  });
});

const MODES = [
  { deg: 1, id: 'major', name: 'יוני (מז\'ור)', char: 'הסולם המז\'ורי הרגיל' },
  { deg: 2, id: 'dorian', name: 'דורי', char: 'מינור עם סקסטה גדולה (6)' },
  { deg: 3, id: 'phrygian', name: 'פריגי', char: 'מינור עם סקונדה קטנה (b2)' },
  { deg: 4, id: 'lydian', name: 'לידי', char: 'מז\'ור עם קוורטה מוגדלת (#4)' },
  { deg: 5, id: 'mixolydian', name: 'מיקסולידי', char: 'מז\'ור עם ספטימה קטנה (b7)' },
  { deg: 6, id: 'minor', name: 'איולי (מינור טבעי)', char: 'המינור הטבעי' },
  { deg: 7, id: 'locrian', name: 'לוקרי', char: 'מינור עם b2 ו-b5' },
];
gen('th.modeFromDegree', 'theory', 5, 'מודוסים', () => {
  const m = pick(MODES.slice(1));
  return choice(`איזה מודוס מתחיל מהדרגה ה-${m.deg} של סולם מז'ור?`, m.name, MODES.map((x) => x.name), {
    explain: `${m.name} = דרגה ${m.deg}. על הקלידים הלבנים: מ-${NATURALS[m.deg - 1]} עד ${NATURALS[m.deg - 1]}. הסדר: יוני, דורי, פריגי, לידי, מיקסולידי, איולי, לוקרי.`,
  });
});

gen('th.modeChar', 'theory', 5, 'אופי המודוסים', () => {
  const m = pick(MODES.filter((x) => x.deg !== 1 && x.deg !== 6));
  return choice(`מה מאפיין את המודוס ה${m.name}?`, m.char, MODES.filter((x) => x.deg !== 1 && x.deg !== 6).map((x) => x.char), {
    explain: 'דורי – 6 גדולה במינור · פריגי – b2 · לידי – #4 · מיקסולידי – b7 · לוקרי – b2 ו-b5.',
  });
});

gen('th.modeSpell', 'theory', 5, 'תווי המודוסים', () => {
  const m = pick(MODES.filter((x) => x.deg !== 1));
  const root = pick(['D', 'E', 'G', 'A', 'C', 'F']);
  const fmt = (id: string) => spellScale(root, id).join(' ');
  return choice(`מה התווים של ${root} ${m.name}?`, fmt(m.id), ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian'].map(fmt), {
    explain: `${root} ${m.name}: **${fmt(m.id)}** – ${m.char}.`,
  });
});

gen('th.secDom', 'theory', 5, 'דומיננטות משניות', () => {
  const key = pick(['C', 'G', 'F', 'D']);
  const d = pick([2, 3, 4, 5, 6]);
  const target = spellScale(key, 'major')[d - 1];
  const dom = (r: string) => spellAbove(r, 7) + '7';
  const others = [2, 3, 4, 5, 6].filter((x) => x !== d).map((x) => dom(spellScale(key, 'major')[x - 1]));
  return choice(`מה הדומיננטה המשנית V7/${ROMAN[d - 1]} בסולם ${key} מז'ור?`, dom(target),
    [...others, diatonicChord(key, d), spellAbove(target, 7)], {
      explain: `V7/${ROMAN[d - 1]} = אקורד דומיננט 7 שהשורש שלו קווינטה מעל ${target}.`,
    });
});

gen('th.function', 'theory', 5, 'פונקציות הרמוניות', () => {
  const map: [number, string][] = [[1, 'טוניקה'], [6, 'טוניקה'], [2, 'סובדומיננטה'], [4, 'סובדומיננטה'], [5, 'דומיננטה'], [7, 'דומיננטה']];
  const [d, f] = pick(map);
  return choice(`מה הפונקציה ההרמונית של דרגה ${ROMAN[d - 1]}?`, f, ['טוניקה', 'סובדומיננטה', 'דומיננטה'], {
    n: 3,
    explain: 'טוניקה (I, vi) – יציבות · סובדומיננטה (ii, IV) – יציאה · דומיננטה (V, vii°) – מתח שרוצה לחזור לטוניקה.',
  });
});

/* ───────────────────────────── EAR ───────────────────────────── */

gen('ear.highLow', 'ear', 1, 'גבוה / נמוך', () => {
  const a = 55 + rand(17);
  const up = Math.random() < 0.5;
  const b = a + (up ? 1 : -1) * (2 + rand(6));
  return choice('הצליל השני – גבוה או נמוך מהראשון?', up ? 'גבוה יותר' : 'נמוך יותר', ['גבוה יותר', 'נמוך יותר'], {
    n: 2, audio: { type: 'seq', notes: [a, b], gap: 0.8 },
    explain: `הצליל השני ${up ? 'גבוה' : 'נמוך'} ב-${semisLabel(Math.abs(b - a))}.`,
  });
});

gen('ear.sameDiff', 'ear', 1, 'זהה / שונה', () => {
  const a = 55 + rand(17);
  const same = Math.random() < 0.4;
  const b = same ? a : a + pick([-2, -1, 1, 2]);
  return choice('שני הצלילים זהים או שונים?', same ? 'זהים' : 'שונים', ['זהים', 'שונים'], {
    n: 2, audio: { type: 'seq', notes: [a, b], gap: 0.8 },
    explain: same ? 'אותו צליל בדיוק.' : `ההפרש היה ${semisLabel(Math.abs(b - a))} – קרוב מאוד, ולכן קשה לשמוע.`,
  });
});

gen('ear.contour', 'ear', 1, 'כיוון מנגינה', () => {
  const shapes: [string, number[]][] = [
    ['עולה', [0, 2, 4]], ['יורדת', [4, 2, 0]], ['עולה ואז יורדת', [0, 4, 2]], ['יורדת ואז עולה', [4, 0, 2]],
  ];
  const [name, steps] = pick(shapes);
  const base = 57 + rand(10);
  const scale = [0, 2, 4, 5, 7];
  const word = (x: number) => (x === 0 ? 'נמוך' : x === 2 ? 'אמצע' : 'גבוה');
  return choice('איך נעה המנגינה?', name, shapes.map((s) => s[0]), {
    audio: { type: 'seq', notes: steps.map((s) => base + scale[s]), gap: 0.55 },
    explain: `${name}: ${steps.map(word).join(' → ')}.`,
  });
});

const intervalEx = (pool: number[], harmonic: boolean) => () => {
  const s = pick(pool);
  const a = 52 + rand(14);
  const wrong = pool.filter((x) => x !== s);
  return choice(harmonic ? 'איזה מרווח שמעת (שני הצלילים יחד)?' : 'איזה מרווח שמעת?', intervalName(s), wrong.map(intervalName), {
    audio: harmonic ? { type: 'chord', notes: [a, a + s] } : { type: 'seq', notes: [a, a + s], gap: 0.7 },
    explain: `${intervalName(s)} = ${semisLabel(s)}${SONGS[s] && !harmonic ? ` · לזכירה: ${SONGS[s]}` : ''}.`,
  });
};
gen('ear.intervalsBasic', 'ear', 2, 'מרווחים בסיסיים', intervalEx([3, 4, 5, 7, 12], false));
gen('ear.majMin', 'ear', 2, 'מז\'ור או מינור', () => {
  const q = pick(['maj', 'min']);
  const r = 53 + rand(10);
  return choice('האקורד מז\'ורי או מינורי?', CHORDS[q].name, qualityNames(['maj', 'min']), {
    n: 2, audio: { type: 'chord', notes: chordNotes(r, q) },
    explain: 'מז\'ור נשמע בדרך כלל "שמח/בהיר", מינור "עצוב/כהה". ההבדל הוא רק בטרצה.',
  });
});

gen('ear.intervalsAll', 'ear', 3, 'כל המרווחים', () => {
  const s = 1 + rand(12);
  const a = 52 + rand(14);
  const near = [s - 2, s - 1, s + 1, s + 2, s + 5].filter((x) => x >= 1 && x <= 12);
  return choice('איזה מרווח שמעת?', intervalName(s), near.map(intervalName), {
    audio: { type: 'seq', notes: [a, a + s], gap: 0.7 },
    explain: `${intervalName(s)} = ${semisLabel(s)}${SONGS[s] ? ` · לזכירה: ${SONGS[s]}` : ''}.`,
  });
});

gen('ear.triadQuality', 'ear', 3, 'סוגי אקורדים', () => {
  const q = pick(triadQs);
  const r = 53 + rand(10);
  return choice('איזה סוג אקורד שמעת?', CHORDS[q].name, qualityNames(triadQs), {
    explain: `${CHORDS[q].name} (${CHORDS[q].steps.join('-')}) – ${FEEL[q]}.`,
    audio: { type: 'twoParts', first: { type: 'seq', notes: chordNotes(r, q), gap: 0.35 }, second: { type: 'chord', notes: chordNotes(r, q) }, pause: 1.2 },
  });
});

gen('ear.scaleType', 'ear', 3, 'סוגי סולמות', () => {
  const ids = ['major', 'minor', 'harmMinor', 'minPent'];
  const id = pick(ids);
  const r = 55 + rand(7);
  const notes = [...scaleNotes(r, id), r + 12];
  const why: Record<string, string> = {
    major: 'ט ט ח ט ט ט ח – בהיר.', minor: 'ט ח ט ט ח ט ט – כהה.',
    harmMinor: 'מינור עם 7 מוגבהת – הקפיצה ה"מזרחית" בין 6 ל-7.', minPent: 'רק 5 תווים, בלי חצאי טונים – נשמע "רוק/בלוז".',
  };
  return choice('איזה סולם שמעת?', SCALES[id].name, ids.map((x) => SCALES[x].name), {
    audio: { type: 'seq', notes, gap: 0.32 },
    explain: `${SCALES[id].name}: ${why[id]}`,
  });
});

gen('ear.intervalsHarmonic', 'ear', 4, 'מרווחים הרמוניים', intervalEx([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], true));

gen('ear.sevenths', 'ear', 4, 'אקורדי ספטימה', () => {
  const q = pick(seventhQs);
  const r = 50 + rand(10);
  return choice('איזה אקורד ספטימה שמעת?', CHORDS[q].name, qualityNames(seventhQs), {
    explain: `${CHORDS[q].name} (${CHORDS[q].steps.join('-')}) – ${FEEL[q]}.`,
    audio: { type: 'twoParts', first: { type: 'seq', notes: chordNotes(r, q), gap: 0.3 }, second: { type: 'chord', notes: chordNotes(r, q) }, pause: 1.4 },
  });
});

const cadenceIn = (tonic: number): number[][] => [
  chordNotes(tonic, 'maj'), chordNotes(tonic + 5, 'maj').map((n) => (n > tonic + 9 ? n - 12 : n)),
  chordNotes(tonic + 7, 'maj').map((n) => (n > tonic + 9 ? n - 12 : n)), chordNotes(tonic, 'maj'),
];
gen('ear.scaleDegree', 'ear', 4, 'זיהוי דרגה בסולם', () => {
  const tonic = 55 + rand(8);
  const d = rand(7);
  const note = tonic + SCALES.major.steps[d] + (Math.random() < 0.5 ? 0 : 12) * (d < 4 ? 1 : 0);
  const names = ['1 (דו)', '2 (רה)', '3 (מי)', '4 (פה)', '5 (סול)', '6 (לה)', '7 (סי)'];
  return choice('שמע את המהלך שקובע את הטונליות, ואז את הצליל. איזו דרגה הוא?', names[d],
    [names[(d + 1) % 7], names[(d + 6) % 7], names[(d + 2) % 7], names[(d + 4) % 7]], {
      audio: { type: 'twoParts', first: { type: 'prog', chords: cadenceIn(tonic) }, second: { type: 'seq', notes: [note] }, pause: 0.6 },
      explain: 'שמור בראש את הטוניקה (דרגה 1) ומדוד ממנה. 1, 3, 5 נשמעים "יציבים", 7 ו-4 "רוצים לזוז".',
    });
});

const PROGS: [string, number[]][] = [
  ['I – IV – V – I', [1, 4, 5, 1]],
  ['I – V – vi – IV', [1, 5, 6, 4]],
  ['ii – V – I', [2, 5, 1]],
  ['I – vi – IV – V', [1, 6, 4, 5]],
  ['vi – IV – I – V', [6, 4, 1, 5]],
];
function voiceProg(tonic: number, degs: number[]): number[][] {
  return degs.map((d) => {
    const root = tonic + SCALES.major.steps[d - 1];
    const tri = chordNotes(root, MAJOR_DEGREE_QUALITIES[d - 1]).map((n) => (n > tonic + 10 ? n - 12 : n));
    return [root - 12, ...tri];
  });
}
gen('ear.progression', 'ear', 5, 'זיהוי מהלכים', () => {
  const [name, degs] = pick(PROGS);
  return choice('איזה מהלך אקורדים שמעת?', name, PROGS.map((p) => p[0]), {
    audio: { type: 'prog', chords: voiceProg(55 + rand(6), degs) },
    explain: `${name} – למשל ב-C: ${degs.map((d) => diatonicChord('C', d)).join(' – ')}.`,
  });
});

gen('ear.mode', 'ear', 5, 'זיהוי מודוסים', () => {
  const ids = ['major', 'minor', 'dorian', 'mixolydian', 'lydian', 'phrygian'];
  const id = pick(ids);
  const r = 55 + rand(6);
  return choice('באיזה מודוס הסולם שמעת?', SCALES[id].name, ids.map((x) => SCALES[x].name), {
    audio: { type: 'seq', notes: [...scaleNotes(r, id), r + 12], gap: 0.3 },
    explain: 'חפש את הצליל האופייני: דורי – 6 גדולה במינור, מיקסולידי – 7 קטנה במז\'ור, לידי – 4#, פריגי – 2b.',
  });
});

/* ───────────────────────────── GUITAR ───────────────────────────── */

const OPEN = ['E', 'A', 'D', 'G', 'B', 'E'];
gen('gt.openStrings', 'guitar', 1, 'מיתרים פתוחים', () => {
  const s = rand(6);
  return choice(`מה שם התו של מיתר ${6 - s} הפתוח?`, OPEN[s], ['E', 'A', 'D', 'G', 'B', 'C', 'F'], {
    explain: 'מהעבה לדק: E A D G B E ("Eddie Ate Dynamite, Good Bye Eddie").',
  });
});

const shapeId = (tier: number) => () => {
  const pool = tier === 1 ? shapesAt(1) : shapesUpTo(tier);
  const s = pick(tier === 1 ? pool : shapesAt(tier));
  const sameRoot = CHORD_SHAPES.filter((x) => x.root === s.root).map((x) => x.symbol);
  const tab = s.frets.map((f) => (f < 0 ? '×' : f)).join(' ');
  return choice('איזה אקורד מוצג בדיאגרמה?', s.symbol, [...sameRoot, ...pool.map((x) => x.symbol)], {
    diagram: s.frets,
    explain: `**${s.symbol}** = ${spellChord(s.root, CHORDS[s.q].steps).join(' ')}. סריגים ממיתר 6 עד 1: **${tab}**.`,
  });
};
gen('gt.chordShapes', 'guitar', 1, 'אקורדים פתוחים', shapeId(1));

gen('gt.micOpenString', 'guitar', 1, 'נגן מיתר פתוח', () => {
  const s = rand(6);
  return { kind: 'micNote', instrument: 'guitar', prompt: `נגן את מיתר ${6 - s} הפתוח (${OPEN[s]})`, pc: pc(GUITAR_TUNING[s]),
    explain: `מיתר ${6 - s} פתוח = ${OPEN[s]}. אם הוא לא מזוהה – כוון את הגיטרה בלשונית "כלים".` };
});

const micChord = (shapes: () => typeof CHORD_SHAPES) => (): Exercise => {
  const s = pick(shapes());
  return {
    kind: 'micChord', instrument: 'guitar', prompt: `נגן את האקורד ${s.symbol} ותן לו לצלצל`,
    symbol: s.symbol, diagram: s.frets, pcs: CHORDS[s.q].steps.map((x) => (pcAny(s.root) + x) % 12),
    names: spellChord(s.root, CHORDS[s.q].steps),
    explain: `${s.symbol} = ${spellChord(s.root, CHORDS[s.q].steps).join(' ')}. ודא שכל מיתר מצלצל נקי ושלא מנגנים מיתרים עם ×.`,
  };
};
gen('gt.micOpenChord', 'guitar', 1, 'נגן אקורד פתוח', micChord(() => shapesAt(1)));

const naturalPcs = NATURALS.map(pcOf);
gen('gt.fretLow', 'guitar', 2, 'תווים על מיתרי הבס', () => {
  const s = rand(2);
  const p = pick(naturalPcs);
  return { kind: 'fret', prompt: `סמן את התו ${heLabel(PC_SHARP[p])} על מיתר ${STRING_LABEL[s]}`, pc: p, string: s, maxFret: 12,
    explain: 'מיתר 6 = E, מיתר 5 = A. כל סריג = חצי טון. סריג 12 = אוקטבה של המיתר הפתוח.' };
});

gen('gt.fretName', 'guitar', 2, 'איזה תו בסריג?', () => {
  const s = rand(2);
  const f = 1 + rand(11);
  const p = pc(GUITAR_TUNING[s] + f);
  return choice(`איזה תו נמצא על מיתר ${6 - s} בסריג ${f}?`, PC_SHARP[p], [PC_SHARP[(p + 1) % 12], PC_SHARP[(p + 11) % 12], PC_SHARP[(p + 2) % 12], PC_SHARP[(p + 10) % 12]], {
    explain: `מיתר ${6 - s} פתוח = ${OPEN[s]}. סופרים ${f} סריגים: ${countUp(GUITAR_TUNING[s], f)} → **${PC_SHARP[p]}**.`,
  });
});

gen('gt.chordShapes7', 'guitar', 2, 'אקורדי ספטימה פתוחים', shapeId(2));

gen('gt.micNote', 'guitar', 2, 'נגן תו', () => {
  const p = pick(naturalPcs);
  const f6 = (p - 4 + 12) % 12, f5 = (p - 9 + 12) % 12;
  return { kind: 'micNote', instrument: 'guitar', prompt: `נגן את התו ${heLabel(PC_SHARP[p])} – בכל מקום על הצוואר`, pc: p,
    explain: `${PC_SHARP[p]} נמצא למשל במיתר 6 סריג ${f6} ובמיתר 5 סריג ${f5}.` };
});
gen('gt.micChord7', 'guitar', 2, 'נגן אקורד ספטימה', micChord(() => shapesAt(2)));

gen('gt.fretAny', 'guitar', 3, 'תווים על כל הצוואר', () => {
  const s = rand(6);
  const p = rand(12);
  const f = (p - pc(GUITAR_TUNING[s]) + 12) % 12;
  return { kind: 'fret', prompt: `סמן את התו ${PC_SHARP[p]}${PC_FLAT[p] !== PC_SHARP[p] ? '/' + PC_FLAT[p] : ''} על מיתר ${STRING_LABEL[s]}`, pc: p, string: s, maxFret: 12,
    explain: `מיתר ${6 - s} פתוח = ${OPEN[s]}, ולכן ${PC_SHARP[p]} בסריג ${f}${f + 12 <= 12 ? ` (וגם ${f + 12})` : ''}.` };
});

const barreFret = (rootPc: number, stringOpenPc: number) => ((rootPc - stringOpenPc + 12) % 12) || 12;
// Roots whose E-shape / A-shape barre would sit at fret 12 are really open-position chords; skip them.
const rootsFor = (roots: string[], openPc: number) => roots.filter((r) => barreFret(pcAny(r), openPc) < 12);
gen('gt.barre', 'guitar', 3, 'אקורדי הברה', () => {
  const eShape = Math.random() < 0.5;
  const root = pick(rootsFor(['F', 'G', 'A', 'B', 'C', 'D', 'Bb', 'F#'], eShape ? 4 : 9));
  const q = pick(['', 'm']);
  const f = barreFret(pcAny(root), eShape ? 4 : 9);
  return choice(
    `לנגן ${root}${q} בהברה בצורת ${eShape ? 'E' : 'A'}${q} (שורש על מיתר ${eShape ? 6 : 5}) – באיזה סריג ההברה?`,
    `סריג ${f}`, [f - 1, f + 1, f + 2, f - 2, barreFret(pcAny(root), eShape ? 9 : 4)].filter((x) => x > 0 && x <= 12).map((x) => `סריג ${x}`), {
      explain: 'ההברה יושבת בסריג שבו נמצא השורש על המיתר שעליו בנויה הצורה.',
    });
});

gen('gt.pentaPosition', 'guitar', 3, 'פנטטוני על הצוואר', () => {
  const root = pick(['A', 'G', 'C', 'D', 'B', 'F#', 'F']);
  const f = barreFret(pcAny(root), 4);
  return choice(`תיבה 1 של פנטטוני ${root} מינור (שורש על מיתר 6) – באיזה סריג היא מתחילה?`, `סריג ${f}`,
    [f - 2, f - 1, f + 1, f + 2, f + 3].filter((x) => x > 0 && x <= 12).map((x) => `סריג ${x}`), {
      explain: 'התיבה הראשונה מתחילה בשורש על מיתר 6. למשל A מינור פנטטוני – סריג 5.',
    });
});

gen('gt.micBarre', 'guitar', 3, 'נגן אקורד הברה', micChord(() => shapesAt(3)));

const markRel = (semisSet: number[], label: (s: number) => string) => (): Exercise => {
  const s = rand(4);
  const f = 1 + rand(7);
  const base = GUITAR_TUNING[s] + f;
  const semis = pick(semisSet);
  return {
    kind: 'fret', prompt: `התו המסומן הוא ${PC_SHARP[pc(base)]}. סמן ${label(semis)} מעליו (על מיתר אחר)`,
    midis: [base + semis], mark: { s, f }, maxFret: 12,
    explain: `${INTERVALS[semis].name} = ${semisLabel(semis)} מעל ${PC_SHARP[pc(base)]} → **${PC_SHARP[pc(base + semis)]}**. ${semis === 12
      ? 'צורת אוקטבה: שני מיתרים למעלה ושני סריגים ימינה (שלושה אם עוברים את מיתר B).'
      : semis === 7 ? 'צורת קווינטה: מיתר אחד למעלה ושני סריגים ימינה (שלושה אם עוברים למיתר B).'
        : 'כל מיתר גבוה ב-5 חצאי טונים מקודמו (B רק ב-4) – חשב כמה סריגים לזוז.'}`,
  };
};
gen('gt.octaves', 'guitar', 4, 'אוקטבות וקווינטות', markRel([12, 7], (s) => (s === 12 ? 'את האוקטבה' : 'קווינטה זכה')));

gen('gt.chordTone', 'guitar', 4, 'צלילי אקורד על הצוואר', () => {
  const root = pick(['C', 'G', 'D', 'A', 'E', 'F']);
  const q = pick(['maj', 'min']);
  const which = pick([1, 2]);
  const p = (pcAny(root) + CHORDS[q].steps[which]) % 12;
  const s = 1 + rand(5);
  const tone = spellChord(root, CHORDS[q].steps)[which];
  const f = (p - pc(GUITAR_TUNING[s]) + 12) % 12;
  return { kind: 'fret', prompt: `סמן את ה${which === 1 ? 'טרצה' : 'קווינטה'} של ${root}${CHORDS[q].symbol} על מיתר ${STRING_LABEL[s]}`, pc: p, string: s, maxFret: 12,
    explain: `${root}${CHORDS[q].symbol} = ${spellChord(root, CHORDS[q].steps).join(' ')}. ה${which === 1 ? 'טרצה' : 'קווינטה'} היא **${tone}**, ובמיתר ${6 - s} היא בסריג ${f}${f + 12 <= 12 ? ` (וגם ${f + 12})` : ''}.` };
});

gen('gt.modeForChord', 'guitar', 5, 'מודוס לאלתור', () => {
  const items: [string, string][] = [
    ['אקורד דומיננט (למשל A7) במהלך בלוז/פאנק', 'מיקסולידי'],
    ['אקורד מינור 7 שהוא ii במהלך ii–V–I', 'דורי'],
    ['מהלך Am – D (i – IV מז\'ורי)', 'דורי'],
    ['אקורד maj7 עם צליל "מרחף" (#11)', 'לידי'],
    ['אקורד m7b5 (חצי מוקטן)', 'לוקרי'],
    ['מהלך E – F (צבע ספרדי/פלמנקו)', 'פריגי'],
  ];
  const [q, a] = pick(items);
  const why: Record<string, string> = {
    מיקסולידי: 'מיקסולידי = מז\'ור עם b7 – בדיוק התווים של אקורד דומיננט 7.',
    דורי: 'דורי = מינור עם 6 גדולה. ב-ii של מז\'ור (או i–IV) זה הסולם שמתאים לכל האקורדים.',
    לידי: 'לידי = מז\'ור עם #4 (= #11) – הצליל ה"מרחף" שמעל maj7.',
    לוקרי: 'לוקרי = מינור עם b2 ו-b5 – ה-b5 הוא בדיוק הקווינטה של m7b5.',
    פריגי: 'פריגי = מינור עם b2 – ה-F מעל E נותן את הצבע הספרדי.',
  };
  return choice(`איזה מודוס הכי מתאים לאלתור על: ${q}?`, a, ['דורי', 'מיקסולידי', 'לידי', 'פריגי', 'לוקרי'], { explain: why[a] });
});

gen('gt.cagedA', 'guitar', 5, 'צורות A ו-E', () => {
  const q = pick(['m7', '7', 'maj7', 'm']);
  const eShape = Math.random() < 0.5;
  const root = pick(rootsFor(ACC_ROOTS, eShape ? 4 : 9));
  const f = barreFret(pcAny(root), eShape ? 4 : 9);
  return choice(`${root}${q} בצורת ${eShape ? 'E' : 'A'} – באיזה סריג השורש?`, `סריג ${f}`,
    [f - 1, f + 1, f + 2, f - 2, barreFret(pcAny(root), eShape ? 9 : 4)].filter((x) => x > 0 && x <= 12).map((x) => `סריג ${x}`), {
      explain: `בצורת ${eShape ? 'E' : 'A'} השורש על מיתר ${eShape ? 6 : 5} (${eShape ? 'E' : 'A'} פתוח). ${root} נמצא שם בסריג ${f}: ${countUp(eShape ? 40 : 45, f)}.`,
    });
});

gen('gt.intervalsNeck', 'guitar', 5, 'מרווחים על הצוואר', markRel([3, 4, 7, 10, 11, 12], (s) => INTERVALS[s].name));

/* ───────────────────────────── PIANO ───────────────────────────── */

gen('pn.findNatural', 'piano', 1, 'מציאת תווים', () => {
  const p = pick(naturalPcs);
  return { kind: 'keys', prompt: `לחץ על התו ${heLabel(PC_SHARP[p])}`, pcs: [p],
    explain: `${PC_SHARP[p]} – ${KEY_HINT[PC_SHARP[p]]}.` };
});

gen('pn.layout', 'piano', 1, 'מבנה המקלדת', () => {
  const facts: [string, string, string[], string][] = [
    ['איזה תו נמצא מיד משמאל לקבוצה של שני קלידים שחורים?', 'C', ['F', 'D', 'B'], 'C (דו) תמיד משמאל לזוג השחורים – זו נקודת ההתמצאות הכי חשובה.'],
    ['איזה תו נמצא מיד משמאל לקבוצה של שלושה קלידים שחורים?', 'F', ['C', 'G', 'E'], 'F (פה) תמיד משמאל לשלישיית השחורים.'],
    ['בין אילו שני תווים לבנים אין קליד שחור?', 'E ו-F', ['C ו-D', 'G ו-A', 'A ו-B'], 'בין E–F ובין B–C אין קליד שחור, ולכן המרחק ביניהם רק חצי טון.'],
    ['כמה קלידים (לבנים ושחורים) יש באוקטבה אחת?', '12', ['7', '8', '10'], '7 לבנים + 5 שחורים = 12 – והתבנית חוזרת.'],
    ['מה ההבדל בין שני קלידים צמודים (כולל שחורים)?', 'חצי טון', ['טון שלם', 'טרצה', 'אוקטבה'], 'כל קליד לקליד הצמוד אליו (לבן או שחור) = חצי טון.'],
  ];
  const [q, a, w, why] = pick(facts);
  return choice(q, a, w, { explain: why });
});

gen('pn.micNote', 'piano', 1, 'נגן תו בפסנתר', () => {
  const p = pick(naturalPcs);
  return { kind: 'micNote', instrument: 'piano', prompt: `נגן בפסנתר את התו ${heLabel(PC_SHARP[p])}`, pc: p,
    explain: `${PC_SHARP[p]} – ${KEY_HINT[PC_SHARP[p]]}.` };
});

gen('pn.findAccidental', 'piano', 2, 'קלידים שחורים', () => {
  const p = pick([1, 3, 6, 8, 10]);
  const name = Math.random() < 0.5 ? PC_SHARP[p] : PC_FLAT[p];
  return { kind: 'keys', prompt: `לחץ על ${heLabel(name)}`, pcs: [p],
    explain: `${PC_SHARP[p]} = ${PC_FLAT[p]}: הקליד השחור בין ${PC_SHARP[p - 1]} ל-${PC_SHARP[p + 1]}.` };
});

const triadTap = (roots: string[], qs: string[]) => (): Exercise => {
  const root = pick(roots);
  const q = pick(qs);
  return { kind: 'keys', prompt: `נגן את האקורד ${root}${CHORDS[q].symbol} (${CHORDS[q].name})`, pcs: CHORDS[q].steps.map((s) => (pcAny(root) + s) % 12),
    explain: `${root}${CHORDS[q].symbol}: ${spellChord(root, CHORDS[q].steps).join(' ')}` };
};
gen('pn.majorTriads', 'piano', 2, 'אקורדי מז\'ור', triadTap(['C', 'F', 'G', 'D', 'A', 'E'], ['maj']));

gen('pn.fingering', 'piano', 2, 'אצבוע סולם C', () => {
  const rh = [1, 2, 3, 1, 2, 3, 4, 5];
  const lh = [5, 4, 3, 2, 1, 3, 2, 1];
  const i = rand(8);
  const right = Math.random() < 0.5;
  const ans = String((right ? rh : lh)[i]);
  const name = NATURALS[i % 7] + (i === 7 ? ' (העליון)' : i === 0 ? ' (התחתון)' : '');
  return choice(`בסולם C מז'ור ביד ${right ? 'ימין' : 'שמאל'} (עולה), איזו אצבע מנגנת את ${name}? (1 = אגודל)`, ans, ['1', '2', '3', '4', '5'], {
    explain: 'יד ימין: 1-2-3, האגודל עובר מתחת, 1-2-3-4-5. יד שמאל: 5-4-3-2-1, אצבע 3 עוברת מעל, 3-2-1.',
  });
});

gen('pn.micTriad', 'piano', 2, 'נגן אקורד בפסנתר', () => {
  const root = pick(['C', 'F', 'G', 'D', 'A']);
  const q = pick(['maj', 'min']);
  return { kind: 'micChord', instrument: 'piano', prompt: `נגן בפסנתר את ${root}${CHORDS[q].symbol}`, symbol: root + CHORDS[q].symbol,
    pcs: CHORDS[q].steps.map((s) => (pcAny(root) + s) % 12), names: spellChord(root, CHORDS[q].steps),
    explain: `${root}${CHORDS[q].symbol} = ${spellChord(root, CHORDS[q].steps).join(' ')}. לחץ את שלושתם יחד והחזק.` };
});

gen('pn.triads', 'piano', 3, 'מינור, מוקטן, מוגדל', triadTap(COMMON_ROOTS, ['min', 'min', 'dim', 'aug']));

gen('pn.inversions', 'piano', 3, 'היפוכים במקלדת', () => {
  const root = pick(['C', 'F', 'G', 'D', 'A', 'E']);
  const q = pick(['maj', 'min']);
  const inv = 1 + rand(2);
  const pcs = CHORDS[q].steps.map((s) => (pcAny(root) + s) % 12);
  return { kind: 'keys', prompt: `נגן ${root}${CHORDS[q].symbol} ב${inv === 1 ? 'היפוך ראשון' : 'היפוך שני'}`, pcs, bassPc: pcs[inv],
    explain: inv === 1 ? 'היפוך ראשון – הטרצה למטה.' : 'היפוך שני – הקווינטה למטה.' };
});

gen('pn.scaleTap', 'piano', 3, 'סולמות מז\'ור', () => {
  const k = pick(MAJOR_KEYS.filter((x) => Math.abs(x.acc) <= 4 && x.acc !== 0));
  return { kind: 'keys', prompt: `סמן את כל התווים של סולם ${k.name} מז'ור`, pcs: scaleNotes(pcAny(k.name), 'major').map(pc),
    explain: `${k.name} מז'ור: ${spellScale(k.name, 'major').join(' ')}` };
});

gen('pn.sevenths', 'piano', 4, 'אקורדי ספטימה', triadTap(COMMON_ROOTS, seventhQs));

gen('pn.diatonic', 'piano', 4, 'אקורדים בסולם', () => {
  const key = pick(['C', 'G', 'D', 'F', 'Bb']);
  const d = 2 + rand(6);
  const root = spellScale(key, 'major')[d - 1];
  const q = MAJOR_DEGREE_QUALITIES[d - 1];
  return { kind: 'keys', prompt: `נגן את אקורד הדרגה ${ROMAN[d - 1]} בסולם ${key} מז'ור`, pcs: CHORDS[q].steps.map((s) => (pcAny(root) + s) % 12),
    explain: `${ROMAN[d - 1]} ב-${key} = ${diatonicChord(key, d)}` };
});

gen('pn.shells', 'piano', 5, 'Shell voicings', () => {
  const root = pick(ACC_ROOTS);
  const q = pick(['maj7', 'dom7', 'min7']);
  const st = CHORDS[q].steps;
  return { kind: 'keys', prompt: `נגן shell voicing ל-${root}${CHORDS[q].symbol}: שורש בבס + טרצה + ספטימה`, pcs: [0, st[1], st[3]].map((s) => (pcAny(root) + s) % 12), bassPc: pcAny(root),
    explain: `${root}${CHORDS[q].symbol}: שורש **${root}**, טרצה **${spellChord(root, [st[1]])[0]}**, ספטימה **${spellChord(root, [st[3]])[0]}** (בלי הקווינטה).` };
});

gen('pn.modeTap', 'piano', 5, 'מודוסים על המקלדת', () => {
  const m = pick(MODES.filter((x) => x.deg !== 1 && x.deg !== 6));
  const root = pick(['D', 'E', 'G', 'A', 'C', 'F']);
  return { kind: 'keys', prompt: `סמן את התווים של ${root} ${m.name}`, pcs: scaleNotes(pcAny(root), m.id).map(pc),
    explain: `${root} ${m.name}: ${spellScale(root, m.id).join(' ')}` };
});

gen('pn.iiVI', 'piano', 5, 'ii–V–I', () => {
  const key = pick(['C', 'F', 'Bb', 'G', 'D', 'Eb']);
  const d = pick([2, 5, 1]);
  const root = spellScale(key, 'major')[d - 1];
  const q = ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'][d - 1];
  return { kind: 'keys', prompt: `במהלך ii–V–I ב-${key} מז'ור, נגן את אקורד ה-${ROMAN[d - 1]} (עם ספטימה)`, pcs: CHORDS[q].steps.map((s) => (pcAny(root) + s) % 12),
    explain: `ii–V–I ב-${key}: ${[2, 5, 1].map((x) => diatonicChord(key, x, true)).join(' – ')}` };
});

/* ─────────────────────────────────────────────────────────────── */

export const GENERATORS = G;
export const GEN_BY_ID: Record<string, Generator> = Object.fromEntries(G.map((g) => [g.id, g]));
export const gensFor = (domain: Domain, tier: number) => G.filter((g) => g.domain === domain && g.tier === tier);
export { ROOT_MIDI, shuffle };
