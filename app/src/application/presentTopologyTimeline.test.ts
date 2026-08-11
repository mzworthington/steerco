import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentTopologyTimeline } from './presentTopologyTimeline';
import type { SteerSpec } from '@steerco/core';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentTopologyTimeline', () => {
  it('presents relationship bands including undated ongoing commitments', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentTopologyTimeline(opened.value, {
      asOf: '2026-08-01',
      rangeFrom: '2026-01-01',
      rangeTo: '2026-12-31',
    });

    expect(model.empty).toBe(false);
    expect(model.rangeStart).toBeTruthy();
    expect(model.rangeEnd).toBeTruthy();
    expect(model.asOf).toBe('2026-08-01');
    expect(model.asOfPercent).toEqual(expect.any(Number));
    expect(model.relationshipBands.length).toBeGreaterThan(5);
    expect(model.relationshipBands.some((band) => band.openEnded)).toBe(true);
    expect(
      model.relationshipBands.some((band) => band.mode === 'x_as_a_service' && band.openEnded),
    ).toBe(true);
    expect(
      model.relationshipBands.some(
        (band) => band.mode === 'facilitation' && /Ways of working/i.test(band.fromLabel),
      ),
    ).toBe(true);
    expect(model.events.some((event) => event.source === 'ledger')).toBe(true);
    expect(model.lead).toMatch(/interaction windows/i);
  });

  it('treats undated relationships as full-window bands when a range is supplied', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const blank: SteerSpec = {
      ...opened.value,
      spec: {
        ...opened.value.spec,
        teams: opened.value.spec.teams.map((team) => ({
          ...team,
          members: team.members.map((member) => ({
            ...member,
            effectiveFrom: undefined,
            effectiveUntil: undefined,
          })),
        })),
        relationships: opened.value.spec.relationships.map((relationship) => ({
          ...relationship,
          expectedUntil: undefined,
          effectiveFrom: undefined,
          effectiveUntil: undefined,
        })),
        topologyEvents: [],
      },
    };

    const withoutRange = presentTopologyTimeline(blank);
    expect(withoutRange.empty).toBe(true);
    expect(withoutRange.relationshipBands).toEqual([]);
    expect(withoutRange.lead).toMatch(/add relationships/i);

    const withRange = presentTopologyTimeline(blank, {
      rangeFrom: '2026-01-01',
      rangeTo: '2026-12-31',
    });
    expect(withRange.empty).toBe(false);
    expect(withRange.relationshipBands.length).toBe(blank.spec.relationships.length);
    expect(withRange.relationshipBands.every((band) => band.openEnded)).toBe(true);
    expect(withRange.relationshipBands[0]?.startLabel).toBe('ongoing');
    expect(withRange.relationshipBands[0]?.endLabel).toBe('ongoing');
  });
});
