import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openWorkspaceFromYaml } from './openWorkspace';
import { createBlankSteerSpec } from './createBlankWorkspace';
import { applyAddBet, applyAddGoal, applyAddInitiative } from './presentLvtChildren';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

const emptyBetDraft = {
  title: '',
  successSignal: '',
  killCriteria: '',
  status: 'proposed' as const,
  fundedTeamIds: [] as string[],
  metricIds: [] as string[],
  primaryMetricId: null as string | null,
  reviewDate: '',
  horizon: '',
  fundingStance: null,
  kind: null,
};

describe('applyAddGoal', () => {
  it('adds a goal under the vision on a blank workspace', () => {
    const blank = createBlankSteerSpec();
    const applied = applyAddGoal(blank, {
      title: 'Reliable customer promises',
      summary: 'Customers get what we said, when we said.',
      status: 'on_track',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.id).toMatch(/^out_/);
    expect(applied.value.spec.outcomes).toHaveLength(1);
    expect(applied.value.spec.outcomes[0]).toMatchObject({
      id: applied.id,
      title: 'Reliable customer promises',
      summary: 'Customers get what we said, when we said.',
      status: 'on_track',
      metrics: [],
    });
  });

  it('rejects an empty title', () => {
    const blank = createBlankSteerSpec();
    const applied = applyAddGoal(blank, { title: '  ', summary: '', status: 'on_track' });
    expect(applied.ok).toBe(false);
    if (applied.ok) return;
    expect(applied.error).toMatch(/title/i);
  });

  it('honours an explicit goal status', () => {
    const blank = createBlankSteerSpec();
    const applied = applyAddGoal(blank, {
      title: 'At risk outcome',
      summary: '',
      status: 'at_risk',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.outcomes[0]?.status).toBe('at_risk');
  });
});

describe('applyAddBet', () => {
  it('adds a proposed bet under a goal', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddBet(opened.value, 'out_promise', {
      ...emptyBetDraft,
      title: 'Promise dashboard slice',
      successSignal: 'Ops can see miss risk a day early',
      killCriteria: 'No ops adoption after six weeks',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.id).toMatch(/^bet_/);
    const bet = applied.value.spec.bets.find((item) => item.id === applied.id);
    expect(bet).toMatchObject({
      outcomeId: 'out_promise',
      title: 'Promise dashboard slice',
      status: 'proposed',
      fundedTeamIds: [],
      metricIds: [],
    });
  });

  it('persists optional funding fields when provided', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const teamId = opened.value.spec.teams[0]?.id;
    const metricId = opened.value.spec.outcomes
      .flatMap((outcome) => outcome.metrics)
      .map((metric) => metric.id)[0];
    expect(teamId).toBeTruthy();
    expect(metricId).toBeTruthy();
    if (!teamId || !metricId) return;

    const applied = applyAddBet(opened.value, 'out_promise', {
      ...emptyBetDraft,
      title: 'Funded slice',
      successSignal: 'Signal',
      killCriteria: 'Kill',
      status: 'on_track',
      fundedTeamIds: [teamId],
      metricIds: [metricId],
      primaryMetricId: metricId,
      reviewDate: '2026-09-01',
      horizon: 'Q3 review',
      fundingStance: 'explore',
      kind: 'opportunity',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const bet = applied.value.spec.bets.find((item) => item.id === applied.id);
    expect(bet).toMatchObject({
      status: 'on_track',
      fundedTeamIds: [teamId],
      metricIds: [metricId],
      primaryMetricId: metricId,
      reviewDate: '2026-09-01',
      horizon: 'Q3 review',
      fundingStance: 'explore',
      kind: 'opportunity',
    });
  });

  it('rejects an unknown goal and missing kill criteria', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    expect(
      applyAddBet(opened.value, 'out_missing', {
        ...emptyBetDraft,
        title: 'x',
        successSignal: 'y',
        killCriteria: 'z',
      }).ok,
    ).toBe(false);

    const missingKill = applyAddBet(opened.value, 'out_promise', {
      ...emptyBetDraft,
      title: 'x',
      successSignal: 'y',
      killCriteria: ' ',
    });
    expect(missingKill.ok).toBe(false);
    if (missingKill.ok) return;
    expect(missingKill.error).toMatch(/kill/i);
  });
});

describe('applyAddInitiative', () => {
  it('adds a thin initiative and returns its id', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddInitiative(opened.value, 'bet_pickup', {
      title: 'Pilot store cohort',
      successSignal: 'One cohort completes with under 5% miss',
      externalUrl: 'https://example.com/tracker/pilot',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.id).toMatch(/^init_/);
    expect(applied.value.spec.initiatives.some((item) => item.id === applied.id)).toBe(true);
  });
});
