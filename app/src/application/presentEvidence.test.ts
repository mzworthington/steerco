import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openWorkspaceFromYaml } from './openWorkspace';
import { applyEvidenceMetricEdit, presentEvidence } from './presentEvidence';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentEvidence', () => {
  it('lists sample MoS with learning cues and measured lines', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentEvidence(opened.value);
    expect(model.sampleBanner).toMatch(/sample data/i);
    expect(model.cards.length).toBeGreaterThanOrEqual(3);
    const promise = model.cards.find((card) => card.metricId === 'met_promise_hit');
    expect(promise?.source).toBe('sample');
    expect(promise?.learning).toMatch(/climbing/i);
    expect(promise?.measuredLine).toMatch(/promise hit rate/i);
    expect(model.allMeasuredLines[0]).toMatch(/:/);
  });

  it('applies a manual current override onto the metric', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyEvidenceMetricEdit(opened.value, 'out_promise', 'met_promise_hit', {
      current: '93',
      target: '95',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const metric = applied.value.spec.outcomes[0]?.metrics.find((m) => m.id === 'met_promise_hit');
    expect(metric?.current).toBe(93);
  });
});
