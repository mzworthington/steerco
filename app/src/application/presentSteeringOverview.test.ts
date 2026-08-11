import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { applyBetValueRank, presentSteeringOverview } from './presentSteeringOverview';

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
    expect(bets.some((bet) => bet.valueRank === 1)).toBe(true);
    const promiseBets = model.outcomes.find((outcome) => outcome.id === 'out_promise')?.bets ?? [];
    expect(promiseBets[0]?.valueRank).toBe(1);
  });

  it('persists value rank edits', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyBetValueRank(opened.value, 'bet_loyalty', 2);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.valueRank).toBe(2);
  });
});
