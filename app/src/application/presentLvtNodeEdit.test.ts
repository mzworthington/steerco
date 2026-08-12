import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { applyGoalEdit, applyInitiativeEdit, applyVisionEdit } from './presentLvtNodeEdit';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentLvtNodeEdit', () => {
  it('updates vision text', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyVisionEdit(opened.value, { vision: 'New vision statement' });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.vision).toBe('New vision statement');
  });

  it('updates goal title and measure values', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const outcome = opened.value.spec.outcomes[0];
    expect(outcome).toBeTruthy();
    if (!outcome) return;

    const applied = applyGoalEdit(opened.value, outcome.id, {
      title: 'Updated goal',
      summary: 'Updated summary',
      status: outcome.status,
      metrics: outcome.metrics.map((metric) => ({
        id: metric.id,
        current: metric.id === 'met_promise_hit' ? '93' : String(metric.current ?? ''),
        target: String(metric.target ?? ''),
      })),
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const next = applied.value.spec.outcomes.find((item) => item.id === outcome.id);
    expect(next?.title).toBe('Updated goal');
    expect(next?.metrics.find((metric) => metric.id === 'met_promise_hit')?.current).toBe(93);
  });

  it('updates initiative fields', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const initiative = opened.value.spec.initiatives?.[0];
    expect(initiative).toBeTruthy();
    if (!initiative) return;

    const applied = applyInitiativeEdit(opened.value, initiative.id, {
      title: 'Updated initiative',
      successSignal: 'Updated signal',
      externalUrl: 'https://example.com/tracker',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const next = applied.value.spec.initiatives?.find((item) => item.id === initiative.id);
    expect(next?.title).toBe('Updated initiative');
    expect(next?.externalUrl).toBe('https://example.com/tracker');
  });
});
