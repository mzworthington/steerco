import { describe, expect, it } from 'vitest';
import { presentTechnicalVocabulary } from './presentTechnicalVocabulary';

describe('presentTechnicalVocabulary', () => {
  it('returns EDGE, DDD, and Team Topologies bridge rows plus six principles', () => {
    const model = presentTechnicalVocabulary();
    expect(model.lead).toMatch(/Domain-Driven Design|Eric Evans/i);
    expect(model.lvtBridge.some((row) => row.term === 'Goal')).toBe(true);
    expect(model.beyondLvt.some((row) => /PVR|Periodic Value Review/i.test(row.term))).toBe(true);
    expect(model.domainDrivenDesign.some((row) => /bounded context/i.test(row.term))).toBe(true);
    expect(model.domainDrivenDesign.some((row) => /ubiquitous language/i.test(row.term))).toBe(
      true,
    );
    expect(model.domainDrivenDesign.some((row) => /leadership outside/i.test(row.term))).toBe(true);
    expect(model.teamTopologies.some((row) => /stream-aligned/i.test(row.term))).toBe(true);
    expect(model.teamTopologies.some((row) => /domain \/ stream \/ team/i.test(row.term))).toBe(
      true,
    );
    expect(model.teamTopologies.some((row) => /team size/i.test(row.term))).toBe(true);
    expect(model.principles).toHaveLength(6);
  });
});
