import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import { diffSteerSpec, steerSpecHasPendingChanges } from './diffSteerSpec';

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../fixtures');
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('diffSteerSpec', () => {
  it('reports no changes when baseline equals working', () => {
    const parsed = parseSteerSpecYaml(sampleYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const diff = diffSteerSpec(parsed.value, structuredClone(parsed.value));
    expect(diff.hasChanges).toBe(false);
    expect(diff.changes).toEqual([]);
    expect(steerSpecHasPendingChanges(parsed.value, structuredClone(parsed.value))).toBe(false);
  });

  it('classifies bet edits as modified and new notes as added', () => {
    const parsed = parseSteerSpecYaml(sampleYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const baseline = parsed.value;
    const working = structuredClone(baseline);
    const loyalty = working.spec.bets.find((bet) => bet.id === 'bet_loyalty');
    expect(loyalty).toBeTruthy();
    if (!loyalty) return;
    loyalty.status = 'stopped';
    working.spec.decisionNotes.push({
      id: 'dec_new',
      recommendation: 'continue',
      title: 'Keep pickup bet',
      why: 'Hit rate climbing',
      measured: ['Promise hit rate up'],
      measuredMetricIds: [],
      affectedTeamIds: ['team_storefront'],
      nextStep: 'Fund next quarter',
    });

    const diff = diffSteerSpec(baseline, working);
    expect(diff.hasChanges).toBe(true);
    expect(diff.counts.modified).toBeGreaterThanOrEqual(1);
    expect(diff.counts.added).toBe(1);
    expect(diff.changes.some((c) => c.section === 'bets' && c.id === 'bet_loyalty')).toBe(true);
    expect(diff.changes.some((c) => c.section === 'decisionNotes' && c.kind === 'added')).toBe(
      true,
    );
    expect(steerSpecHasPendingChanges(baseline, working)).toBe(true);
  });

  it('detects deleted teams and relationship adds', () => {
    const parsed = parseSteerSpecYaml(sampleYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const baseline = parsed.value;
    const working = structuredClone(baseline);
    working.spec.teams = working.spec.teams.filter((team) => team.id !== 'team_enablement');
    working.spec.relationships = working.spec.relationships.filter(
      (rel) => rel.fromTeamId !== 'team_enablement',
    );
    working.spec.relationships.push({
      fromTeamId: 'team_storefront',
      toTeamId: 'team_catalog',
      mode: 'collaboration',
    });

    const diff = diffSteerSpec(baseline, working);
    expect(diff.changes.some((c) => c.kind === 'deleted' && c.section === 'teams')).toBe(true);
    expect(diff.changes.some((c) => c.kind === 'added' && c.section === 'relationships')).toBe(
      true,
    );
  });
});
