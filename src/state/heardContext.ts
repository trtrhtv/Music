import { createContext, useContext } from 'react';
import type { TrackId } from '../data/tracks';
import { recordHeard, type Heard } from './store';

/** Where a mic check is played inside the guitar program; outside it (lessons, tools) nothing is recorded. */
export interface HeardWhere { track: TrackId; stage: number; ex?: string }
export const HeardCtx = createContext<HeardWhere | null>(null);

/** Records a finished mic check with the place it was played in (no-op outside the program). */
export function useRecordHeard() {
  const where = useContext(HeardCtx);
  return (h: Pick<Heard, 'kind' | 'score'> & Partial<Pick<Heard, 'bpm' | 'drift' | 'wrong'>>) => {
    if (where) recordHeard({ ...where, ...h });
  };
}
