import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentTechnicalFitness } from './presentTechnicalFitness';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentTechnicalFitness', () => {
  it('surfaces a write-back policy panel for the sample workspace', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentTechnicalFitness(opened.value);
    expect(model.writeBack.localOnly).toBeGreaterThan(0);
    expect(model.writeBack.summary).toMatch(/Group YAML blocked/i);
    expect(model.writeBack.rows.every((row) => row.allowed === false)).toBe(true);
    expect(model.mismatchCount).toBeGreaterThanOrEqual(0);
  });

  it('lists mismatches when the workspace has topology cues', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const broken = {
      ...opened.value,
      spec: {
        ...opened.value.spec,
        bets: opened.value.spec.bets.map((bet) =>
          bet.id === 'bet_pickup' ? { ...bet, fundedTeamIds: [] } : bet,
        ),
      },
    };

    const model = presentTechnicalFitness(broken);
    expect(model.mismatchCount).toBeGreaterThan(0);
    expect(model.mismatches.some((item) => item.code === 'bet_without_team')).toBe(true);
    expect(model.mismatches.find((item) => item.code === 'bet_without_team')?.deepLink).toBe(
      '/workspace/bets/bet_pickup',
    );
  });
});
