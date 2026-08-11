import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openWorkspaceFromYaml } from './openWorkspace';
import { applyAddEvidence, applyEvidenceMetricEdit, presentEvidence } from './presentEvidence';

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
    expect(model.outcomeOptions.length).toBeGreaterThan(0);
    expect(model.outcomeOptions.some((option) => option.id === 'out_promise')).toBe(true);
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

  it('adds a manual measure and evidence note onto a goal', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddEvidence(opened.value, {
      outcomeId: 'out_promise',
      title: 'Checkout conversion',
      unit: 'percent',
      current: '3.2',
      target: '4.0',
      interpretation: 'Still thin at peak hours.',
      note: 'From weekly product review sheet',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const outcome = applied.value.spec.outcomes.find((item) => item.id === 'out_promise');
    const metric = outcome?.metrics.find((item) => item.title === 'Checkout conversion');
    expect(metric?.id).toMatch(/^met_/);
    expect(metric?.current).toBe(3.2);
    expect(metric?.target).toBe(4);
    expect(metric?.interpretation).toMatch(/peak hours/i);

    const evidence = applied.value.spec.evidence.find((item) => item.metricId === metric?.id);
    expect(evidence?.source).toBe('manual');
    expect(evidence?.note).toMatch(/weekly product review/i);

    const model = presentEvidence(applied.value);
    const card = model.cards.find((item) => item.metricId === metric?.id);
    expect(card?.source).toBe('manual');
    expect(card?.learning).toMatch(/peak hours/i);
    expect(card?.evidenceNote).toMatch(/weekly product review/i);
  });

  it('rejects empty title and unknown goals', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    expect(
      applyAddEvidence(opened.value, {
        outcomeId: 'out_promise',
        title: '   ',
        current: '1',
        target: '',
      }).ok,
    ).toBe(false);

    expect(
      applyAddEvidence(opened.value, {
        outcomeId: 'out_missing',
        title: 'Latency',
        current: '1',
        target: '',
      }).ok,
    ).toBe(false);
  });
});
