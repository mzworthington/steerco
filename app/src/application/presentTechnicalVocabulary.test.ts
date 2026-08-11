import { describe, expect, it } from 'vitest';
import { presentTechnicalVocabulary } from './presentTechnicalVocabulary';

describe('presentTechnicalVocabulary', () => {
  it('returns EDGE and Team Topologies bridge rows plus six principles', () => {
    const model = presentTechnicalVocabulary();
    expect(model.lvtBridge.some((row) => row.term === 'Goal')).toBe(true);
    expect(model.beyondLvt.some((row) => /PVR|Periodic Value Review/i.test(row.term))).toBe(true);
    expect(model.teamTopologies.some((row) => /stream-aligned/i.test(row.term))).toBe(true);
    expect(model.principles).toHaveLength(6);
  });
});
