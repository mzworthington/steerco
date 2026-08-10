import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentWorkspaceDiff } from './presentWorkspaceDiff';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentWorkspaceDiff', () => {
  it('summarises pending bet and note changes for the board', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const baseline = opened.value;
    const working = structuredClone(baseline);
    const bet = working.spec.bets.find((item) => item.id === 'bet_loyalty');
    expect(bet).toBeTruthy();
    if (!bet) return;
    bet.status = 'stopped';

    const model = presentWorkspaceDiff(baseline, working, { sourceLabel: 'sample' });
    expect(model.hasChanges).toBe(true);
    expect(model.summary).toMatch(/modified/i);
    expect(model.sections.some((section) => section.section === 'bets')).toBe(true);
    expect(model.acceptHint).toMatch(/downloads steertree\.yaml/i);
  });

  it('reports a clean baseline when nothing changed', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentWorkspaceDiff(opened.value, structuredClone(opened.value));
    expect(model.hasChanges).toBe(false);
    expect(model.summary).toMatch(/matches the last accepted baseline/i);
    expect(model.sections).toEqual([]);
  });
});
