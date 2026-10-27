import type { ReactNode } from 'react';

// A note name or chord symbol (C#, Bb, F#m7, Cmaj7, G/B…), and a run of them ("E – G# – B", "A C D Eb").
// Inside Hebrew text the bidi algorithm would move a trailing '#' to the wrong side ("#C") and reverse
// sequences, so each run is isolated as one left-to-right unit.
const TOKEN = '[A-G](?:[#b♯♭]{1,2})?(?:maj7|m7b5|dim|aug|sus[24]|m7|m|7|5|°|ø|\\+)?(?:\\/[A-G][#b]?)?\\d?(?![A-Za-z])';
// Arrows join a run too, so "E7 → Am" stays in reading order instead of flipping around the arrow.
// Counting syllables ("1-e-&-a"), finger orders ("1-3-2-4") and fret runs ("3-5-7-8-10") stay left-to-right as well.
const COUNT = '\\d{1,2}(?:-(?:e|&|a|\\d{1,2}))+(?![\\w-])';
// Roman numerals for chord degrees (I, IV, V7, vi, vii°, V7/vi, Imaj7…), as whole words only.
const RN = '(?:VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)';
const ROMAN = `(?<![A-Za-z'])${RN}(?:maj7|m7b5|7|°|ø)?(?:\\/${RN})?(?![A-Za-z'])`;
const UNIT = `(?:${TOKEN}|${ROMAN})`;
const MUSIC_RUN = new RegExp(`(${UNIT}(?:(?:\\s*[–\\-→]\\s*|\\s+)${UNIT})*|${COUNT})`, 'g');

function isolate(text: string, key: string): ReactNode[] {
  return text.split(MUSIC_RUN).map((s, i) => (i % 2 ? <bdi key={`${key}-${i}`}>{s}</bdi> : s));
}

/** Renders **bold** inline markup and keeps note names readable inside right-to-left text. */
export function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).flatMap((s, i): ReactNode[] =>
    s.startsWith('**') ? [<b key={i} className="term">{isolate(s.slice(2, -2), `b${i}`)}</b>] : isolate(s, String(i)));
}
