import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyDecisionNoteDraft,
  draftFromDecisionNote,
  presentDecisionNotes,
  validateDecisionNoteDraft,
} from './presentDecisionNotes';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentDecisionNotes', () => {
  it('presents the sample stop note with MoS helper suggestions', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentDecisionNotes(opened.value);
    expect(model.helperMeasured).toMatch(/measures of success/i);
    expect(model.mosSuggestions.some((item) => /promise hit rate/i.test(item))).toBe(true);
    expect(model.metricOptions.some((metric) => metric.title === 'Promise hit rate')).toBe(true);
    expect(model.notes).toHaveLength(1);
    expect(model.notes[0]?.recommendationLabel).toBe('Stop');
    expect(model.notes[0]?.title).toMatch(/loyalty ledger/i);
    expect(model.notes[0]?.betTitle).toBe('Loyalty ledger unification');
    expect(model.notes[0]?.affectedTeams).toEqual(
      expect.arrayContaining(['Fulfilment platform', 'Storefront experience']),
    );
    expect(model.teamGroups.length).toBeGreaterThan(1);
    expect(model.teamGroups.map((group) => group.title)).toEqual(
      expect.arrayContaining(['Commerce', 'Shared support']),
    );
    expect(
      model.teamGroups
        .find((group) => group.title === 'Commerce')
        ?.teams.some((team) => team.displayName === 'Storefront experience'),
    ).toBe(true);
  });
});

describe('validateDecisionNoteDraft', () => {
  it('requires title, why, and next step', () => {
    const result = validateDecisionNoteDraft(draftFromDecisionNote(null));
    expect(result.ok).toBe(false);
  });
});

describe('applyDecisionNoteDraft', () => {
  it('updates the loyalty stop note measured lines', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const existing = opened.value.spec.decisionNotes[0];
    expect(existing).toBeTruthy();
    if (!existing) return;

    const draft = draftFromDecisionNote(existing);
    expect(draft.measuredMetricIds).toEqual(['met_promise_hit', 'met_shared_wait']);
    draft.measuredText = 'Promise hit rate unchanged\nShared-service wait time still elevated';
    const applied = applyDecisionNoteDraft(opened.value, draft);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.decisionNotes[0]?.measured).toEqual([
      'Promise hit rate unchanged',
      'Shared-service wait time still elevated',
    ]);
    expect(applied.value.spec.decisionNotes[0]?.measuredMetricIds).toEqual([
      'met_promise_hit',
      'met_shared_wait',
    ]);
  });

  it('creates a new continue note with measured metric links', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyDecisionNoteDraft(opened.value, {
      id: null,
      title: 'Continue same-day pickup reliability',
      recommendation: 'continue',
      betId: 'bet_pickup',
      why: 'Hit rate is climbing and kill criteria have not been met.',
      measuredText: 'Promise hit rate 91%, climbing toward 95%',
      measuredMetricIds: ['met_promise_hit', 'met_unknown'],
      affectedTeamIds: ['team_storefront', 'team_catalog'],
      nextStep: 'Keep funding for one more quarter; review at Q4 steering.',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.decisionNotes).toHaveLength(2);
    const created = applied.value.spec.decisionNotes.find(
      (note) => note.recommendation === 'continue',
    );
    expect(created?.measuredMetricIds).toEqual(['met_promise_hit']);
  });
});
