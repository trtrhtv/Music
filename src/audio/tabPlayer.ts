import { GUITAR_TUNING } from '../theory/theory';
import { audio, playNote } from './synth';

/** A tab as a list of moments; each moment is the notes (midi) struck together. */
export function parseTab(lines: string[]): number[][] {
  const at = new Map<number, number[]>();
  lines.forEach((line, i) => {
    const open = GUITAR_TUNING[5 - i]; // line 0 = string 1 (high e)
    for (let x = 0; x < line.length; x++) {
      if (!/\d/.test(line[x]) || (x > 0 && /\d/.test(line[x - 1]))) continue;
      let n = line[x];
      while (/\d/.test(line[x + n.length] ?? '')) n += line[x + n.length];
      at.set(x, [...(at.get(x) ?? []), open + Number(n)]);
    }
  });
  return [...at.entries()].sort((a, b) => a[0] - b[0]).map(([, notes]) => notes);
}

/**
 * Plays a tab with even spacing: `sub` notes per beat at `bpm` (2 = eighths, 3 = triplets).
 * Notes are scheduled a little ahead, so stopping is quick. Reports the moment being played.
 */
export class TabPlayer {
  private timer = 0;
  private events: number[][];
  private onStep: (i: number) => void;
  private onEnd: () => void;
  constructor(events: number[][], onStep: (i: number) => void, onEnd: () => void) {
    this.events = events;
    this.onStep = onStep;
    this.onEnd = onEnd;
  }
  start(bpm: number, sub: number) {
    const c = audio();
    const step = 60 / bpm / sub;
    const t0 = c.currentTime + 0.1;
    let next = 0;
    const tick = () => {
      while (next < this.events.length && t0 + next * step < c.currentTime + 0.25) {
        const when = t0 + next * step;
        for (const m of this.events[next]) playNote(m, { at: when, dur: Math.max(step * 2, 0.5), timbre: 'guitar', vel: 0.8 });
        const i = next;
        setTimeout(() => this.onStep(i), Math.max(0, (when - c.currentTime) * 1000));
        next++;
      }
      if (next >= this.events.length) {
        clearInterval(this.timer);
        setTimeout(this.onEnd, step * 1000 + 300);
      }
    };
    tick();
    this.timer = window.setInterval(tick, 60);
  }
  stop() {
    clearInterval(this.timer);
    this.onEnd();
  }
}
