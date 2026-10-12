import type { AudioCue } from '../engine/types';
import { playChord, playProgression, playSequence, type Timbre } from './synth';

/** Seconds a cue takes to play. */
export function cueLength(c: AudioCue): number {
  switch (c.type) {
    case 'seq': return c.notes.length * (c.gap ?? 0.5) + 0.5;
    case 'chord': return 1.5;
    case 'prog': return c.chords.length * 1.1 + 0.3;
    case 'twoParts': return cueLength(c.first) + (c.pause ?? 0.8) + cueLength(c.second);
  }
}

export function playCue(c: AudioCue, timbre: Timbre = 'piano'): number {
  switch (c.type) {
    case 'seq': playSequence(c.notes, { gap: c.gap, timbre }); break;
    case 'chord': playChord(c.notes, { dur: 1.4, spread: c.spread, timbre }); break;
    case 'prog': playProgression(c.chords, { timbre }); break;
    case 'twoParts': {
      playCue(c.first, timbre);
      const t = (cueLength(c.first) + (c.pause ?? 0.8)) * 1000;
      setTimeout(() => playCue(c.second, timbre), t);
      break;
    }
  }
  return cueLength(c);
}
