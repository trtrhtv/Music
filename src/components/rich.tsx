import type { ReactNode } from 'react';

// A note name or chord symbol (C#, Bb, F#m7, Cmaj7, G/B…), and a run of them ("E – G# – B", "A C D Eb").
// Inside Hebrew text the bidi algorithm would move a trailing '#' to the wrong side ("#C") and reverse
// sequences, so each run is isolated as one left-to-right unit.
const TOKEN = '[A-G](?:[#b♯♭]{1,2})?(?:maj7|m7b5|dim|aug|sus[24]|m7|m|7|5|°|ø|\\+)?(?:\\/[A-G][#b]?)?\\d?(?![A-Za-z])';
// Arrows join a run too, so "E7 → Am" stays in reading order instead of flipping around the arrow.
const MUSIC_RUN = new RegExp(`(${TOKEN}(?:(?:\\s*[–\\-→]\\s*|\\s+)${TOKEN})*)`, 'g');

function isolate(text: string, key: string): ReactNode[] {
  return text.split(MUSIC_RUN).map((s, i) => (i % 2 ? <bdi key={`${key}-${i}`}>{s}</bdi> : s));
}

/** Renders **bold** inline markup and keeps note names readable inside right-to-left text. */
export function rich(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/).flatMap((s, i): ReactNode[] =>
    s.startsWith('**') ? [<b key={i} className="term">{isolate(s.slice(2, -2), `b${i}`)}</b>] : isolate(s, String(i)));
}
