import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentTechnicalTree } from './presentTechnicalTree';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentTechnicalTree', () => {
  it('lists outcomes, bets, teams, and relationships with ids and refs', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentTechnicalTree(opened.value);
    expect(model.outcomes.some((item) => item.id === 'out_promise')).toBe(true);
    expect(
      model.bets.find((bet) => bet.id === 'bet_fulfilil')?.fundedTeamIds.length,
    ).toBeGreaterThan(0);
    expect(model.teams.some((team) => team.id === 'team_storefront')).toBe(true);
    expect(model.relationships.length).toBeGreaterThan(0);
    expect(model.techRadarUrl).toBe('https://example.com/tech-radar');
    expect(model.initiativeCount).toBeGreaterThan(0);
    expect(model.productCount).toBeGreaterThan(0);
  });
});
