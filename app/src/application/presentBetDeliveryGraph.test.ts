import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentBetDetail } from './presentBetDetail';
import { filterBetDeliveryTeamGroups, presentBetDeliveryGraph } from './presentBetDeliveryGraph';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentBetDeliveryGraph', () => {
  it('grows direct neighbours from funded teams and marks related distinctly', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const graph = presentBetDeliveryGraph(opened.value, ['team_storefront'], { depth: 'direct' });
    expect(graph.empty).toBe(false);
    expect(graph.fundedCount).toBe(1);
    expect(graph.relatedCount).toBeGreaterThan(0);

    const funded = graph.nodes.find((node) => node.id === 'team_storefront');
    expect(funded?.kind).toBe('funded');
    expect(graph.nodes.some((node) => node.kind === 'related')).toBe(true);
    expect(
      graph.edges.every(
        (edge) => edge.source === 'team_storefront' || edge.target === 'team_storefront',
      ),
    ).toBe(true);
  });

  it('expands transitive closure when show-all depth is requested', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const direct = presentBetDeliveryGraph(opened.value, ['team_storefront'], { depth: 'direct' });
    const all = presentBetDeliveryGraph(opened.value, ['team_storefront'], {
      depth: 'transitive',
    });

    expect(all.nodes.length).toBeGreaterThan(direct.nodes.length);
    expect(all.edges.length).toBeGreaterThan(direct.edges.length);
    expect(all.relatedCount).toBeGreaterThan(direct.relatedCount);
  });

  it('attaches overload cues to graph nodes for warning markers', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const graph = presentBetDeliveryGraph(opened.value, ['team_storefront'], {
      depth: 'transitive',
    });
    const fulfil = graph.nodes.find((node) => node.id === 'team_fulfilil');
    expect(
      fulfil?.cues.some((cue) => cue.kind === 'many_dependents' || cue.kind === 'overloaded'),
    ).toBe(true);
    const storefront = graph.nodes.find((node) => node.id === 'team_storefront');
    expect(storefront?.cues.some((cue) => cue.kind === 'many_dependencies')).toBe(true);
  });

  it('returns empty graph when no funded teams are selected', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const graph = presentBetDeliveryGraph(opened.value, []);
    expect(graph.empty).toBe(true);
    expect(graph.nodes).toHaveLength(0);
    expect(graph.edges).toHaveLength(0);
  });
});

describe('filterBetDeliveryTeamGroups', () => {
  it('filters picker groups by team name while keeping domain headers', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentBetDetail(opened.value, 'bet_pickup');
    expect(model).not.toBeNull();
    if (!model) return;

    const filtered = filterBetDeliveryTeamGroups(model.fundedTeamGroups, 'storefront experience');
    expect(filtered).toEqual([
      expect.objectContaining({
        teams: [expect.objectContaining({ id: 'team_storefront' })],
      }),
    ]);
  });
});
