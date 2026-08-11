import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { presentOrganisation } from './presentOrganisation';
import {
  presentOrganisationFlowFocus,
  presentOrganisationFlowGraph,
} from './presentOrganisationFlowGraph';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function teamMetaFromOrg() {
  const opened = openWorkspaceFromYaml(sampleYaml);
  if (!opened.ok) throw new Error('fixture failed');
  const org = presentOrganisation(opened.value);
  const meta = org.zones.flatMap((zone) =>
    zone.teams.map((team) => ({
      id: team.id,
      displayName: team.displayName,
      domainTitle: team.domainTitle ?? 'Ungrouped',
      roleLabel: team.roleLabel,
      purpose: team.purpose,
      capacityLabel: team.capacityLabel,
      streamTitles: team.streamTitles,
      platformScopeLabel: team.platformScopeLabel,
      facilitatesLabels: team.facilitatesLabels,
      members: team.members.map((member) => ({
        id: member.id,
        displayName: member.displayName,
        title: member.title,
        disciplineLabel: member.disciplineLabel,
        ftePercent: member.ftePercent,
      })),
    })),
  );
  return { org, meta };
}

describe('presentOrganisationFlowGraph', () => {
  it('builds positioned interaction graphs with domain layout for the sample', () => {
    const { org, meta } = teamMetaFromOrg();

    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    expect(graph.empty).toBe(false);
    expect(graph.nodes.length).toBeGreaterThan(1);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.some((edge) => /XaaS|Facilitate|Collab/.test(edge.modeLabel))).toBe(true);
    expect(graph.listGroups.length).toBeGreaterThan(1);
    expect(graph.domainOptions.some((option) => /commerce/i.test(option.title))).toBe(true);
    expect(graph.nodes.some((node) => node.members.length > 0)).toBe(true);

    const focused = presentOrganisationFlowGraph(org.relationships, meta, {
      domainTitle: 'Commerce',
    });
    expect(focused.edgeCount).toBeLessThan(graph.edgeCount);
    expect(focused.lead).toMatch(/commerce/i);

    const tb = presentOrganisationFlowGraph(org.relationships, meta, { orientation: 'TB' });
    expect(tb.orientation).toBe('TB');
    expect(tb.lead).toMatch(/top-down/i);
  });

  it('marks related nodes and edges when a team is selected', () => {
    const { org, meta } = teamMetaFromOrg();
    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    const focus = presentOrganisationFlowFocus(graph.edges, {
      kind: 'team',
      id: 'team_storefront',
    });

    expect(focus.hasFocus).toBe(true);
    expect(focus.activeNodeIds).toContain('team_storefront');
    expect(focus.activeNodeIds.length).toBeGreaterThan(1);
    expect(focus.activeEdgeIds.length).toBeGreaterThan(0);
    expect(focus.activeEdgeIds.every((id) => id.includes('team_storefront'))).toBe(true);
  });
});
