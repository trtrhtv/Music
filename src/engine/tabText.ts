/**
 * Reads a guitar tab pasted as text (the usual web format) into the app's tab format: six lines,
 * high e first, bars split by "|", plus the chord names written above it and the section names
 * ("[Chorus]", "Verse 1") between the staves.
 *
 *   [Intro]
 *        Am            E7
 *   e|-----0-------|-----0--------|
 *   B|---1---1-----|---0---0------|   x2
 *   ...
 */

export interface ParsedTab {
  /** Six strings, high e first; bars split by "|" (as the built-in tabs). */
  lines: string[];
  /** Chord names, column-aligned with `lines` ("" when the tab has none). */
  chordLine: string;
  /** Section names, by the index of the bar they start at. */
  sections: Record<number, string>;
  /** The distinct chord names, in order of appearance. */
  chords: string[];
  staves: number;
  bars: number;
}

const CHORD = /^\(?[A-G][#b♯♭]?(?:maj|min|m|M|dim|aug|sus|add|°|ø|\+)?\d{0,2}(?:(?:sus|add|b|#|maj|M)\d{1,2})*(?:\/[A-G][#b♯♭]?)?\)?$/;
const isChordToken = (t: string) => CHORD.test(t) || /^[|/%.-]+$/.test(t) || /^\(?[x×]\d+\)?$/i.test(t) || /^N\.?C\.?$/.test(t);

/** "e|--0--|" / "E --0--" / "|--0--|" / "--0--": a line of a staff. */
function tabPart(line: string): { at: number } | null {
  const m = /^(\s*(?:[A-Ga-g][#b]?\s*)?)([|:[]?)(?=[-0-9])/.exec(line) ?? /^(\s*[A-Ga-g][#b]?\s*)(\|)/.exec(line);
  if (!m) return null;
  const body = line.slice(m[1].length);
  const dashes = (body.match(/-/g) ?? []).length;
  // Mostly dashes and fret numbers – not a chord line or lyrics.
  if (dashes < 4 || dashes < body.replace(/\s+$/, '').length * 0.35) return null;
  return { at: m[1].length };
}

/** A line made only of chord names (and spaces), e.g. "   Am      E7/G#   ". */
export function isChordLine(line: string): boolean {
  const toks = line.trim().split(/\s+/).filter(Boolean);
  return toks.length > 0 && toks.some((t) => CHORD.test(t)) && toks.every(isChordToken);
}

export function parseTabText(text: string): ParsedTab {
  const rows = text.replace(/\t/g, '    ').replace(/\r/g, '').split('\n');
  const strings: string[][] = [[], [], [], [], [], []];
  let chordLine = '';
  const sections: Record<number, string> = {};
  let bars = 0;
  let staves = 0;
  let pendingLabel = '';
  for (let i = 0; i < rows.length; i++) {
    const six = rows.slice(i, i + 6);
    const parts = six.map(tabPart);
    if (six.length < 6 || parts.some((p) => !p)) {
      const t = rows[i].trim();
      // A heading such as "[Chorus]" or "Verse 1:" (not a chord line, not prose).
      const head = /^\[([^\]]{1,30})\]$/.exec(t) ?? /^((?:intro|verse|chorus|bridge|outro|riff|solo|interlude|pre-chorus|ending|coda|part|section)[^:]{0,20}):?$/i.exec(t);
      if (head) pendingLabel = head[1].trim();
      continue;
    }
    // The staff: drop the string names, and keep the text from the first bar line on.
    let body = six.map((l, k) => l.slice(parts[k]!.at).replace(/\s+$/, ''));
    const start = Math.min(...body.map((l) => (/^[|:[]/.test(l) ? 1 : 0)));
    body = body.map((l) => (/^[|:[]/.test(l) ? l.slice(1) : l));
    // Cut each line at its last bar line (drops "x2", "(repeat)" written after the staff).
    body = body.map((l) => {
      const end = l.lastIndexOf('|');
      const tail = l.slice(end + 1);
      // After the last bar line: more music (no closing "|") or just a note like "x2".
      return end > 0 && (tail.match(/-/g) ?? []).length < 3 ? l.slice(0, end) : l.replace(/[^-0-9hpbr/\\~x()^*.]+$/, '');
    });
    const width = Math.max(...body.map((l) => l.length));
    body = body.map((l) => l.padEnd(width, '-').replace(/[:[\]]/g, '|').replace(/[^-0-9|hpbrst/\\~x().^*<>=]/g, '-'));
    // Bar lines where most strings agree; a stray "|" elsewhere becomes a dash.
    const cols = new Set<number>();
    for (let c = 0; c < width; c++) if (body.filter((l) => l[c] === '|').length >= 4) cols.add(c);
    body = body.map((l) => [...l].map((ch, c) => (cols.has(c) ? '|' : ch === '|' ? '-' : ch)).join(''));
    // Collapse doubled bar lines ("||") so no bar is empty.
    body = body.map((l) => l.replace(/\|{2,}/g, '|').replace(/^\||\|$/g, ''));
    const w = body[0].length;
    if (body.some((l) => l.length !== w) || !/\d/.test(body.join(''))) { i += 5; continue; }
    // Chord names written on the line just above the staff, aligned to it.
    const above = rows[i - 1] ?? '';
    let ch = '';
    if (isChordLine(above)) {
      const off = parts[0]!.at + start;
      // Keep the chord columns; where bar lines were collapsed the columns shift a little – fine for reading.
      ch = above.slice(off).padEnd(w).slice(0, w);
    }
    if (pendingLabel) sections[bars] = pendingLabel;
    pendingLabel = '';
    const sep = staves ? '|' : '';
    body.forEach((l, k) => { strings[k].push(sep + l); });
    chordLine += (staves ? ' ' : '') + (ch || ' '.repeat(w));
    bars += body[0].split('|').length;
    staves++;
    i += 5;
  }
  const lines = strings.map((s) => s.join(''));
  const chords = [...new Set(chordLine.trim().split(/\s+/).filter((t) => CHORD.test(t)).map((t) => t.replace(/[()]/g, '')))];
  return { lines, chordLine: chords.length ? chordLine : '', sections, chords, staves, bars };
}
