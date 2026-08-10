import { describe, expect, it } from 'vitest';
import { DISCIPLINE_COPY, MEMBER_DISCIPLINES } from './disciplines';

describe('member disciplines', () => {
  it('covers the steering mix enum with copy for each id', () => {
    expect([...MEMBER_DISCIPLINES]).toEqual([
      'engineering',
      'design',
      'product',
      'quality',
      'leadership',
      'other',
    ]);
    for (const discipline of MEMBER_DISCIPLINES) {
      expect(DISCIPLINE_COPY[discipline].label.length).toBeGreaterThan(0);
      expect(DISCIPLINE_COPY[discipline].teaching.length).toBeGreaterThan(0);
    }
  });
});
