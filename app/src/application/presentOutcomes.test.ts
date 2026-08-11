import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyOutcomeMetricEdit,
  applyProductDraft,
  presentOutcomes,
  validateOutcomeMetricEdit,
} from './presentOutcomes';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentOutcomes', () => {
  it('presents sample MoS heroes and funded bet rows', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentOutcomes(opened.value);
    expect(model.framingLine).toMatch(/measures of success/i);
    expect(model.outcomes.length).toBeGreaterThanOrEqual(2);

    const outcome = model.outcomes.find((item) => item.title === 'Reliable customer promises');
    expect(outcome).toBeTruthy();
    expect(outcome?.measures.map((measure) => measure.title)).toEqual([
      'Promise hit rate',
      'Promise-to-fulfilil days',
      'Shared-service wait time',
    ]);
    expect(outcome?.measures[0]?.displayValue).toBe('91%');
    expect(outcome?.measures[0]?.interpretation).toMatch(/climbing/i);
    expect(outcome?.bets.map((bet) => bet.title)).toEqual(
      expect.arrayContaining([
        'Same-day pickup reliability',
        'Shared fulfilment spine',
        'Loyalty ledger unification',
      ]),
    );
    expect(outcome?.bets.every((bet) => bet.progressCue.length > 0)).toBe(true);
    expect(outcome?.measures[0]?.claimedByBets.map((bet) => bet.id)).toEqual(
      expect.arrayContaining(['bet_pickup', 'bet_loyalty']),
    );
    expect(outcome?.measures[1]?.claimedByBets.map((bet) => bet.id)).toEqual(['bet_fulfilil']);
    expect(outcome?.measures[2]?.claimedByBets.map((bet) => bet.id)).toEqual(['bet_fulfilil']);
    expect(model.products.some((product) => product.title === 'Customer promises')).toBe(true);
    expect(model.products[0]?.betLinks.map((bet) => bet.id)).toEqual(
      expect.arrayContaining(['bet_pickup', 'bet_fulfilil']),
    );
  });

  it('adds a lightweight product brief', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyProductDraft(opened.value, {
      title: 'Store tools',
      problem: 'Associates lack trustworthy stock and staffing cues',
      customers: 'Store teams',
      nonGoals: 'HR payroll',
      outcomeIds: ['out_store'],
      betIds: ['bet_pos_resilience'],
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.products.some((product) => product.title === 'Store tools')).toBe(
      true,
    );
  });
});

describe('validateOutcomeMetricEdit', () => {
  it('rejects non-numeric current values', () => {
    const result = validateOutcomeMetricEdit({ current: 'abc', target: '95' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/number/i);
  });
});

describe('applyOutcomeMetricEdit', () => {
  it('updates metric current and target on the SteerSpec', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyOutcomeMetricEdit(opened.value, 'out_promise', 'met_promise_hit', {
      current: '93',
      target: '96',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const metric = applied.value.spec.outcomes[0]?.metrics.find(
      (item) => item.id === 'met_promise_hit',
    );
    expect(metric?.current).toBe(93);
    expect(metric?.target).toBe(96);
  });
});
