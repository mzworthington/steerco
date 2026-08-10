import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyBetDetailDraft,
  presentBetDetail,
  validateBetDetailDraft,
  type BetDetailDraft,
} from './presentBetDetail';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentBetDetail', () => {
  it('presents a sample bet with outcome MoS context and funded teams', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentBetDetail(opened.value, 'bet_loyalty');
    expect(model).not.toBeNull();
    if (!model) return;

    expect(model.title).toBe('Loyalty ledger unification');
    expect(model.killCriteria).toMatch(/promise hit rate/i);
    expect(model.statusLabel).toBe('Stop');
    expect(model.outcome?.title).toBe('Reliable customer promises');
    expect(model.outcome?.measures.length).toBeGreaterThan(0);
    expect(model.outcome?.measures[0]?.title).toBe('Promise hit rate');
    expect(
      model.fundedTeams.filter((team) => team.selected).map((team) => team.displayName),
    ).toEqual(['Fulfilment platform']);
    expect(model.fundedTeams).toHaveLength(opened.value.spec.teams.length);
  });

  it('returns null for an unknown bet', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(presentBetDetail(opened.value, 'bet_missing')).toBeNull();
  });
});

describe('validateBetDetailDraft', () => {
  const base: BetDetailDraft = {
    title: 'Same-day pickup reliability',
    successSignal: 'Hit rate stays high',
    killCriteria: 'Hit rate stays flat after one quarter',
    status: 'on_track',
    fundedTeamIds: ['team_storefront'],
  };

  it('blocks empty title and empty kill criteria', () => {
    const result = validateBetDetailDraft({ ...base, title: '  ', killCriteria: '' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.map((error) => error.field).sort()).toEqual(['killCriteria', 'title']);
    expect(result.errors[0]?.message).toMatch(/plain|title|name/i);
  });

  it('warns when no funded teams are selected', () => {
    const result = validateBetDetailDraft({ ...base, fundedTeamIds: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.some((warning) => warning.field === 'fundedTeamIds')).toBe(true);
  });
});

describe('applyBetDetailDraft', () => {
  it('updates the bet in SteerSpec without changing outcome linkage', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyBetDetailDraft(opened.value, 'bet_pickup', {
      title: 'Pickup promises that hold',
      successSignal: 'Misses under five percent',
      killCriteria: 'No lift after one quarter',
      status: 'at_risk',
      fundedTeamIds: ['team_storefront', 'team_catalog'],
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const bet = applied.value.spec.bets.find((item) => item.id === 'bet_pickup');
    expect(bet).toMatchObject({
      title: 'Pickup promises that hold',
      successSignal: 'Misses under five percent',
      killCriteria: 'No lift after one quarter',
      status: 'at_risk',
      fundedTeamIds: ['team_storefront', 'team_catalog'],
      outcomeId: 'out_promise',
    });
  });
});
