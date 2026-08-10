import { afterEach, describe, expect, it } from 'vitest';
import { stashDecisionNoteMeasured, takeDecisionNoteMeasured } from './decisionNoteSeed';

afterEach(() => {
  sessionStorage.clear();
});

describe('decisionNoteSeed', () => {
  it('stashes and consumes measured lines once', () => {
    stashDecisionNoteMeasured(['Promise hit rate: climbing', '', 'Wait time up']);
    expect(takeDecisionNoteMeasured()).toEqual(['Promise hit rate: climbing', 'Wait time up']);
    expect(takeDecisionNoteMeasured()).toBeNull();
  });
});
