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
      model.fundedTeams
        .filter((team) => team.selected)
        .map((team) => team.displayName)
        .sort(),
    ).toEqual(['Care workspace', 'Loyalty experience', 'Returns experience']);
    expect(model.fundedTeams).toHaveLength(opened.value.spec.teams.length);
    expect(model.fundedTeamGroups.some((group) => group.domainTitle === 'Customer')).toBe(true);
    const fulfil = model.fundedTeams.find((team) => team.id === 'team_fulfilil');
    expect(fulfil?.interactions.length).toBeGreaterThan(0);
    expect(fulfil?.cues.some((cue) => cue.kind === 'many_dependents')).toBe(true);
    expect(
      model.metricOptions.filter((metric) => metric.selected).map((metric) => metric.title),
    ).toEqual(['Promise hit rate']);
    expect(model.metricOptions.length).toBeGreaterThan(1);
    expect(model.fundingStance).toBe('sustain');
    expect(model.kind).toBe('opportunity');
    expect(model.primaryMetricId).toBeNull();
    expect(model.flowOverlay?.participants.some((p) => p.teamId === 'team_loyalty_cx')).toBe(true);
    expect(model.flowOverlay?.edges.length).toBeGreaterThan(0);
  });

  it('groups delivery teams by domain and surfaces dependency load cues', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentBetDetail(opened.value, 'bet_pickup');
    expect(model).not.toBeNull();
    if (!model) return;

    expect(model.fundedTeamGroups.map((group) => group.domainTitle)).toEqual(
      expect.arrayContaining(['Commerce', 'Shared support']),
    );
    const storefront = model.fundedTeams.find((team) => team.id === 'team_storefront');
    expect(storefront?.domainTitle).toBe('Commerce');
    expect(storefront?.interactions.some((item) => item.modeLabel === 'X-as-a-Service')).toBe(true);
    expect(storefront?.cues.some((cue) => cue.kind === 'many_dependencies')).toBe(true);
    expect(model.deliveryLoadSummary).toMatch(/depends on/i);
  });

  it('presents review timing and primary metric for a bet that has them', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentBetDetail(opened.value, 'bet_pickup');
    expect(model).not.toBeNull();
    if (!model) return;

    expect(model.reviewDate).toBe('2026-09-30');
    expect(model.horizon).toBe('Q3 review');
    expect(model.fundingStance).toBe('exploit');
    expect(model.kind).toBe('opportunity');
    expect(model.primaryMetricId).toBe('met_promise_hit');
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
    metricIds: ['met_promise_hit'],
    primaryMetricId: 'met_promise_hit',
    reviewDate: '2026-09-30',
    horizon: 'Q3 review',
    fundingStance: 'exploit',
    kind: 'opportunity',
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

  it('warns when an active bet has no linked Measure of Success', () => {
    const result = validateBetDetailDraft({
      ...base,
      metricIds: [],
      primaryMetricId: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.some((warning) => warning.field === 'metricIds')).toBe(true);
  });

  it('does not warn about a missing Measure of Success for a proposed bet', () => {
    const result = validateBetDetailDraft({
      ...base,
      status: 'proposed',
      metricIds: [],
      primaryMetricId: null,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings.some((warning) => warning.field === 'metricIds')).toBe(false);
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
      metricIds: ['met_promise_hit', 'met_cycle_days'],
      primaryMetricId: 'met_cycle_days',
      reviewDate: '2026-11-01',
      horizon: 'Q4 review',
      fundingStance: 'explore',
      kind: 'capability',
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
      metricIds: ['met_promise_hit', 'met_cycle_days'],
      primaryMetricId: 'met_cycle_days',
      reviewDate: '2026-11-01',
      horizon: 'Q4 review',
      fundingStance: 'explore',
      kind: 'capability',
    });
  });

  it('drops the primary metric when it is not among the selected metrics', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyBetDetailDraft(opened.value, 'bet_pickup', {
      title: 'Same-day pickup reliability',
      successSignal: 'Hit rate stays high',
      killCriteria: 'Hit rate stays flat after one quarter',
      status: 'on_track',
      fundedTeamIds: ['team_storefront'],
      metricIds: ['met_cycle_days'],
      primaryMetricId: 'met_promise_hit',
      reviewDate: '',
      horizon: '',
      fundingStance: null,
      kind: null,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const bet = applied.value.spec.bets.find((item) => item.id === 'bet_pickup');
    expect(bet?.primaryMetricId).toBeNull();
    expect(bet?.metricIds).toEqual(['met_cycle_days']);
    expect(bet?.reviewDate).toBeUndefined();
    expect(bet?.horizon).toBeUndefined();
    expect(bet?.fundingStance).toBeUndefined();
    expect(bet?.kind).toBeUndefined();
  });
});
