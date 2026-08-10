import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentSteeringOverview } from './presentSteeringOverview';

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
    expect(model.alignmentSummary).toBe('Three bets funded. One recommended to stop.');
    expect(model.statusCounts).toEqual({ onTrack: 1, atRisk: 1, stop: 1 });
    expect(model.decisionNotesSummary).toMatch(/stop recommendation/i);
    expect(model.decisionNotes[0]?.title).toMatch(/loyalty ledger/i);

    const bets = model.outcomes.flatMap((outcome) => outcome.bets);
    expect(bets).toHaveLength(3);
    expect(bets.map((bet) => bet.status).sort()).toEqual(['At risk', 'On track', 'Stop']);
    const visible = [
      model.vision,
      ...bets.flatMap((bet) => [bet.title, bet.metricCue, bet.status]),
    ];
    expect(visible.join('\n')).not.toMatch(/team_fulfilil|out_promise|entityRef/i);
  });
});
