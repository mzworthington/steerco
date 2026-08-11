import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentSteeringOverview, reorderBetValueStack } from './presentSteeringOverview';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentSteeringOverview', () => {
  it('maps sample workspace to executive labels without entity refs', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentSteeringOverview(opened.value, { periodLabel: 'Sample period' });

    expect(model.workspaceTitle).toBe('Northwind Q3 alignment');
    expect(model.periodLabel).toBe('Sample period');
    expect(model.vision).toMatch(/customer promises/i);
    expect(model.alignmentSummary).toMatch(/one recommended to stop/i);
    expect(model.alignmentSummary).toMatch(/five bets funded/i);
    expect(model.statusCounts).toEqual({ onTrack: 3, atRisk: 1, stop: 1 });
    expect(model.decisionNotesSummary).toMatch(/stop recommendation/i);
    expect(model.decisionNotes[0]?.title).toMatch(/loyalty ledger/i);
    expect(model.nextReviewSummary).toMatch(/review/i);

    const bets = model.outcomes.flatMap((outcome) => outcome.bets);
    expect(bets).toHaveLength(5);
    expect(bets.map((bet) => bet.status)).toEqual(
      expect.arrayContaining(['At risk', 'On track', 'Stop']),
    );
    const visible = [
      model.vision,
      ...bets.flatMap((bet) => [bet.title, bet.metricCue, bet.status]),
    ];
    expect(visible.join('\n')).not.toMatch(/team_fulfilil|out_promise|entityRef/i);
    expect(model.portfolioMix.hint).toMatch(/opportunity|capability|explore|exploit|sustain/i);
    expect(model.wipMismatchCount).toBeGreaterThanOrEqual(0);
    if (model.wipMismatchCount > 0) {
      expect(model.wipMismatchSummary).toMatch(/topology cue/i);
    } else {
      expect(model.wipMismatchSummary).toBeNull();
    }
    expect(model.valueStack.map((bet) => bet.id)).toEqual([
      'bet_pickup',
      'bet_fulfilil',
      'bet_pos_resilience',
      'bet_insights',
      'bet_loyalty',
    ]);
    expect(model.valueStack[0]?.outcomeTitle).toMatch(/reliable customer promises/i);
  });

  it('reorders the portfolio value stack from drag order', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const reordered = reorderBetValueStack(opened.value, [
      'bet_loyalty',
      'bet_pickup',
      'bet_fulfilil',
      'bet_pos_resilience',
      'bet_insights',
    ]);
    expect(reordered.ok).toBe(true);
    if (!reordered.ok) return;

    const ranks = Object.fromEntries(
      reordered.value.spec.bets.map((bet) => [bet.id, bet.valueRank ?? null]),
    );
    expect(ranks).toEqual({
      bet_loyalty: 1,
      bet_pickup: 2,
      bet_fulfilil: 3,
      bet_pos_resilience: 4,
      bet_insights: 5,
    });
    expect(presentSteeringOverview(reordered.value).valueStack.map((bet) => bet.id)).toEqual([
      'bet_loyalty',
      'bet_pickup',
      'bet_fulfilil',
      'bet_pos_resilience',
      'bet_insights',
    ]);
  });

  it('rejects unknown bet ids when reordering', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const rejected = reorderBetValueStack(opened.value, ['bet_pickup', 'bet_missing']);
    expect(rejected.ok).toBe(false);
  });
});
