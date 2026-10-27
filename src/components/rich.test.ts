import { describe, expect, it } from 'vitest';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { rich } from './rich';

/** The left-to-right runs that rich() isolates in a piece of text. */
const runs = (t: string) => (rich(t) as ReactNode[]).filter((n): n is ReactElement<{ children: string }> => isValidElement(n) && n.type === 'bdi').map((n) => n.props.children);

describe('rich text: note names and chord degrees inside Hebrew', () => {
  it('keeps a Roman-numeral progression together as one run', () => {
    expect(runs('המהלך I – V – vi – IV הוא הנפוץ')).toEqual(['I – V – vi – IV']);
    expect(runs('V7/vi ("החמש של השש")')).toEqual(['V7/vi']);
    expect(runs('ובסוף V → I.')).toEqual(['V → I']);
  });
  it('still isolates chord names and does not catch Roman numerals inside words', () => {
    expect(runs('ב-G: G – C – D – G')).toEqual(['G', 'G – C – D – G']);
    expect(runs('Oye Como Va')).toEqual([]);
    expect(runs('Twinkle Twinkle')).toEqual([]);
  });
  it('keeps whole number runs together (frets, fingers, counting)', () => {
    expect(runs('סריגים 3-5-7-8-10 על מיתר 6')).toEqual(['3-5-7-8-10']);
    expect(runs('מהפתוח: 0-2-4-5-7-9-11-12.')).toEqual(['0-2-4-5-7-9-11-12']);
    expect(runs('סופרים 1-e-&-a ו-1-3-2-4')).toEqual(['1-e-&-a', '1-3-2-4']);
  });
});
