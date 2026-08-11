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
  it('presents capacity markers, relationship bands, and a11y events for the sample', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentTopologyTimeline(opened.value, { asOf: '2026-08-01' });

    expect(model.empty).toBe(false);
    expect(model.rangeStart).toBeTruthy();
    expect(model.rangeEnd).toBeTruthy();
    expect(model.asOf).toBe('2026-08-01');
    expect(model.asOfPercent).toEqual(expect.any(Number));
    expect(model.capacityMarkers.some((marker) => marker.kind === 'capacity_up')).toBe(true);
    expect(model.capacityMarkers.some((marker) => /Jordan Blake/i.test(marker.label))).toBe(true);
    expect(
      model.relationshipBands.some(
        (band) => band.mode === 'facilitation' && /Ways of working/i.test(band.fromLabel),
      ),
    ).toBe(true);
    expect(model.events.some((event) => event.source === 'ledger')).toBe(true);
    expect(model.lead).toMatch(/capacity changes/i);
  });

  it('reports empty when the workspace has no dated topology history', () => {
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

    const model = presentTopologyTimeline(blank);
    expect(model.empty).toBe(true);
    expect(model.capacityMarkers).toEqual([]);
    expect(model.relationshipBands).toEqual([]);
    expect(model.events).toEqual([]);
    expect(model.lead).toMatch(/add member or relationship/i);
  });
});
