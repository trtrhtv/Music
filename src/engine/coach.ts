import { TRACKS, type TrackId } from '../data/tracks';
import { STAGES, addDays, type Heard, type State } from '../state/store';

/**
 * "What I heard": looks at the mic checks of each track's current stage and suggests whether
 * to slow down, step back, take the stage test or move on. It only suggests – the player decides.
 *
 * The thresholds follow the program's own rules: a stage test passes at 85% on the grid, and
 * nothing counts from a single day (what's still there after a night's sleep is what's learnt).
 */

export type AdviceKind = 'more' | 'keep' | 'slow' | 'down' | 'ready' | 'up';
export interface Advice {
  track: TrackId;
  stage: number;
  kind: AdviceKind;
  /** One line, in plain words. */
  title: string;
  /** What was heard, and tips. */
  detail: string[];
  /** Suggested practice tempo (slow) – applied only if the player accepts. */
  bpm?: number;
  checks: number;
}

/** How far back to look. */
const WINDOW_DAYS = 21;
const MIN_CHECKS = 3;
const MIN_DAYS = 2;
const STRONG = 0.9;
const WEAK = 0.6;
const VERY_WEAK = 0.4;

const median = (xs: number[]) => { const a = [...xs].sort((x, y) => x - y); const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const daysOf = (hs: Heard[]) => new Set(hs.map((h) => h.date)).size;
const round5 = (x: number) => Math.max(40, Math.round(x / 5) * 5);

export function adviceFor(s: State, track: TrackId, today: string): Advice | null {
  const n = s.prog.stage[track];
  if (n > STAGES) return null;
  const st = TRACKS.find((t) => t.id === track)!.stages[n - 1];
  const from = addDays(today, -WINDOW_DAYS);
  const hs = s.prog.heard.filter((h) => h.track === track && h.stage === n && h.date >= from);
  const base = { track, stage: n, checks: hs.length };
  const timing = hs.filter((h) => h.kind === 'timing');
  const notes = hs.filter((h) => h.kind === 'notes');

  const heardLine: string[] = [];
  if (timing.length) heardLine.push(`קצב: ${pct(mean(timing.slice(-6).map((h) => h.score)))} מהתווים בזמן (${timing.length} בדיקות, עד ${Math.max(...timing.map((h) => h.bpm ?? 0))} BPM)`);
  if (notes.length) heardLine.push(`תווים: ${pct(mean(notes.slice(-6).map((h) => h.score)))} נכונים (${notes.length} בדיקות)`);

  if (hs.length < MIN_CHECKS || daysOf(hs) < MIN_DAYS) {
    return { ...base, kind: 'more', title: 'עוד לא שמעתי מספיק כדי לשפוט', detail: [
      ...heardLine,
      `כדי להתאים את הרמה צריך לפחות ${MIN_CHECKS} בדיקות מיקרופון ב-${MIN_DAYS} ימים שונים בשלב הזה. יש כרגע ${hs.length}${hs.length ? ` ב-${daysOf(hs)} ${daysOf(hs) === 1 ? 'יום' : 'ימים'}` : ''}.`,
      'הכפתורים 🎤 נמצאים בתרגילים (בדיקת קצב, "בדוק אותי" בטאבים) ובמבחן השלב.',
    ] };
  }

  const recent = hs.slice(-6);
  const med = median(recent.map((h) => h.score));
  const tips: string[] = [];
  const drift = timing.slice(-6).filter((h) => h.drift !== undefined).map((h) => h.drift!);
  if (drift.length >= 2 && Math.abs(mean(drift)) > 15) tips.push(mean(drift) > 0 ? '🐢 לאורך הנגינה אתה נוטה להאט. ספור בקול ושמור על היד הימנית זזה.' : '🐇 לאורך הנגינה אתה נוטה להאיץ. ספור בקול, וחשוב על הפעמה כ"רחבה".');

  const testBpm = st.timing?.bpm;
  const goodAt = (min: number) => daysOf(timing.filter((h) => (h.bpm ?? 0) >= min && h.score >= STRONG)) >= MIN_DAYS;
  const notesGood = daysOf(notes.filter((h) => h.score >= 0.95)) >= MIN_DAYS;
  const strong = testBpm ? goodAt(testBpm) && (!st.check || notes.length === 0 || notesGood) : notesGood;

  if (med >= 0.88 && strong) {
    if (testBpm && goodAt(testBpm * 1.15) && n < STAGES) {
      return { ...base, kind: 'up', title: `השלב הזה כבר קל לך – אפשר לעבור לשלב ${n + 1}`, detail: [...heardLine, `שמעתי אותך מנגן מהר מהיעד (${testBpm} BPM) ונקי, ביותר מיום אחד.`, ...tips] };
    }
    return { ...base, kind: 'ready', title: 'נשמע מוכן למבחן השלב', detail: [...heardLine, testBpm ? `שמעתי ${pct(STRONG)} ומעלה בקצב היעד (${testBpm} BPM) ביומיים שונים.` : 'שמעתי את התווים נקיים ביומיים שונים.', 'עשה את המבחן במלואו – אם הוא עובר, סמן "עברתי את המבחן היום".', ...tips] };
  }

  // Improving fast: the latest check is already clean – don't hold the player back for older ones.
  const last = hs[hs.length - 1];
  if (med < WEAK && last.score >= 0.85) {
    return { ...base, kind: 'keep', title: 'השתפרת – ממשיכים באותה רמה', detail: [...heardLine, `הבדיקה האחרונה כבר הייתה טובה (${pct(last.score)}${last.bpm ? ` ב-${last.bpm} BPM` : ''}). אם זה מחזיק גם מחר – אתה בדרך למבחן.`, ...tips] };
  }

  if (med < WEAK) {
    const played = timing.slice(-6).map((h) => h.bpm ?? 0).filter(Boolean);
    if (med < VERY_WEAK && n > 1 && recent.length >= 4) {
      return { ...base, kind: 'down', title: `כדאי לחזור לשלב ${n - 1} לחיזוק`, detail: [...heardLine, 'השלב הזה עוד מוקדם מדי – הבסיס מהשלב הקודם יעזור. אחרי כמה ימים שם, חוזרים לכאן בקלות.', ...tips] };
    }
    const bpm = played.length ? round5(median(played) * 0.85) : undefined;
    return { ...base, kind: 'slow', bpm, title: bpm ? `להאט ל-${bpm} BPM לשבוע הקרוב` : 'להאט ולפרק לחלקים', detail: [
      ...heardLine,
      bpm ? `בקצב הנוכחי (${median(played)} BPM) הנגינה עוד לא יציבה. ב-${bpm} BPM זה יישב – ומשם עולים 5 בכל פעם שזה נקי פעמיים.` : 'נגן את הקטע לאט, 4 תווים בכל פעם, ורק כשהם נקיים – מחבר.',
      ...tips,
    ] };
  }

  const half = recent.length >> 1;
  const better = recent.length >= 4 && mean(recent.slice(half).map((h) => h.score)) - mean(recent.slice(0, half).map((h) => h.score)) >= 0.05;
  return { ...base, kind: 'keep', title: better ? 'משתפר – ממשיכים באותה רמה' : 'הרמה מתאימה – ממשיכים', detail: [...heardLine, ...tips] };
}

export const adviceAll = (s: State, today: string) => TRACKS.map((t) => adviceFor(s, t.id, today)).filter((a): a is Advice => a !== null);

/** Advice that suggests a change (the rest is information). */
export const ACTIONABLE: AdviceKind[] = ['slow', 'down', 'ready', 'up'];

/**
 * Time to show "what I heard" on the home screen: something new to act on since it was last opened,
 * or a week has passed with a few new checks.
 */
export function coachDue(s: State, today: string): boolean {
  const seen = s.prog.coachSeen;
  const fresh = s.prog.heard.filter((h) => h.date > seen);
  if (!fresh.length) return false;
  const tracks = new Set(fresh.map((h) => h.track));
  if (adviceAll(s, today).some((a) => ACTIONABLE.includes(a.kind) && tracks.has(a.track))) return true;
  return (!seen || seen <= addDays(today, -7)) && fresh.length >= MIN_CHECKS;
}
