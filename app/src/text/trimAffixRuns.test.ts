import { describe, expect, it } from 'vitest';
import { trimAffixRuns } from './trimAffixRuns';

describe('trimAffixRuns', () => {
  it('strips leading and trailing runs of the affix character', () => {
    expect(trimAffixRuns('--acme-q4--', '-')).toBe('acme-q4');
  });
});
