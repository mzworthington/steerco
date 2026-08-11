import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentOrganisation } from './presentOrganisation';
import { presentOrganisationFlowGraph } from './presentOrganisationFlowGraph';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentOrganisationFlowGraph', () => {
  it('builds a mermaid flowchart with domain subgraphs for the sample', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const org = presentOrganisation(opened.value);
    const meta = org.zones.flatMap((zone) =>
      zone.teams.map((team) => ({
        id: team.id,
        displayName: team.displayName,
        domainTitle: team.domainTitle ?? 'Ungrouped',
      })),
    );

    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    expect(graph.empty).toBe(false);
    expect(graph.mermaid).toContain('flowchart LR');
    expect(graph.mermaid).toContain('subgraph');
    expect(graph.mermaid).toMatch(/XaaS|Facilitate|Collab/);
    expect(graph.listGroups.length).toBeGreaterThan(1);
    expect(graph.domainOptions.some((option) => /commerce/i.test(option.title))).toBe(true);

    const focused = presentOrganisationFlowGraph(org.relationships, meta, {
      domainTitle: 'Commerce',
    });
    expect(focused.edgeCount).toBeLessThan(graph.edgeCount);
    expect(focused.lead).toMatch(/commerce/i);
  });
});
