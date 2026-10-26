import { THEORY_COURSE } from '../data/theoryCourse';
import { dueReviews, useStore } from './store';

/** Questions per review round – one per due lesson. */
export const REVIEW_SIZE = 5;
export const THEORY_IDS = THEORY_COURSE.map((l) => l.id);
/** Theory lessons due for spaced review today. */
export const useDueReviews = () => dueReviews(useStore(), THEORY_IDS);
