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
        initials: member.initials,
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
    expect(graph.nodes.length).toBe(meta.length);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.some((edge) => /XaaS|Facilitate|Collab/.test(edge.modeLabel))).toBe(true);
    expect(graph.listGroups.length).toBeGreaterThan(1);
    expect(graph.domainOptions.some((option) => /commerce/i.test(option.title))).toBe(true);
    expect(graph.nodes.some((node) => node.members.length > 0)).toBe(true);

    const focused = presentOrganisationFlowGraph(org.relationships, meta, {
      domainTitles: ['Commerce'],
    });
    expect(focused.edgeCount).toBeLessThan(graph.edgeCount);
    expect(focused.lead).toMatch(/commerce/i);
    expect(focused.focusDomainTitles).toEqual(['Commerce']);
    expect(focused.crossDomainEdgeCount).toBeGreaterThan(0);
    expect(focused.edges.some((edge) => edge.crossesBoundary)).toBe(true);
    expect(focused.nodes.some((node) => node.inFocusDomain)).toBe(true);
    expect(focused.nodes.some((node) => node.isExternal)).toBe(true);
    expect(
      focused.nodes.filter((node) => node.isExternal).every((node) => !node.inFocusDomain),
    ).toBe(true);

    const multi = presentOrganisationFlowGraph(org.relationships, meta, {
      domainTitles: ['Commerce', 'Customer'],
    });
    expect(multi.focusDomainTitles).toEqual(['Commerce', 'Customer']);
    expect(multi.edgeCount).toBeGreaterThan(focused.edgeCount);
    expect(multi.lead).toMatch(/2 domains/i);

    const tb = presentOrganisationFlowGraph(org.relationships, meta, { orientation: 'TB' });
    expect(tb.orientation).toBe('TB');
    expect(tb.lead).toMatch(/top-down/i);
    expect(tb.focusDomainTitles).toEqual([]);
    expect(tb.edges.every((edge) => edge.crossesBoundary === false)).toBe(true);
    expect(tb.nodes.every((node) => !node.isExternal && !node.inFocusDomain)).toBe(true);
  });

  it('marks outbound relationships when viewing depends-on for a team', () => {
    const { org, meta } = teamMetaFromOrg();
    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    const focus = presentOrganisationFlowFocus(
      graph.edges,
      { kind: 'team', id: 'team_storefront' },
      'depends_on',
    );

    expect(focus.hasFocus).toBe(true);
    expect(focus.activeNodeIds).toContain('team_storefront');
    expect(focus.activeNodeIds.length).toBeGreaterThan(1);
    expect(focus.activeEdgeIds.length).toBeGreaterThan(0);
    expect(focus.activeEdgeIds.every((id) => id.startsWith('team_storefront-'))).toBe(true);
    expect(focus.activeEdgeIds.some((id) => id.includes('team_enablement'))).toBe(false);
  });

  it('marks inbound relationships when viewing depended-on-by for a team', () => {
    const { org, meta } = teamMetaFromOrg();
    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    const focus = presentOrganisationFlowFocus(
      graph.edges,
      { kind: 'team', id: 'team_storefront' },
      'depended_on_by',
    );

    expect(focus.hasFocus).toBe(true);
    expect(focus.activeEdgeIds).toContain('team_enablement-facilitation-team_storefront');
    expect(focus.activeEdgeIds.every((id) => id.endsWith('-team_storefront'))).toBe(true);
    expect(focus.activeNodeIds).toEqual(
      expect.arrayContaining(['team_storefront', 'team_enablement']),
    );
    expect(focus.activeEdgeIds.some((id) => id.startsWith('team_storefront-'))).toBe(false);
  });

  it('includes cross-domain dependents when a shared platform is selected as depended-on-by', () => {
    const { org, meta } = teamMetaFromOrg();
    const graph = presentOrganisationFlowGraph(org.relationships, meta);
    const pricingMl = graph.nodes.find((node) => node.id === 'team_pricing_ml');
    const pricingEngine = graph.nodes.find((node) => node.id === 'team_pricing');
    expect(pricingMl?.domainTitle).toBe('Shared support');
    expect(pricingEngine?.domainTitle).toBe('Commerce');
    expect(pricingMl && pricingEngine && pricingMl.position.x !== pricingEngine.position.x).toBe(
      true,
    );

    const focus = presentOrganisationFlowFocus(
      graph.edges,
      { kind: 'team', id: 'team_pricing_ml' },
      'depended_on_by',
    );
    expect(focus.activeNodeIds).toEqual(
      expect.arrayContaining(['team_pricing_ml', 'team_pricing']),
    );
    expect(focus.activeEdgeIds).toContain('team_pricing-x_as_a_service-team_pricing_ml');

    const outboundOnly = presentOrganisationFlowFocus(
      graph.edges,
      { kind: 'team', id: 'team_pricing_ml' },
      'depends_on',
    );
    expect(outboundOnly.activeEdgeIds).not.toContain('team_pricing-x_as_a_service-team_pricing_ml');
  });

  it('filters edges to dependencies active in the selected date range', () => {
    const { org, meta } = teamMetaFromOrg();
    const all = presentOrganisationFlowGraph(org.relationships, meta);
    const late = presentOrganisationFlowGraph(org.relationships, meta, {
      rangeFrom: '2027-06-01',
      rangeTo: '2027-12-31',
    });
    expect(late.edgeCount).toBeLessThan(all.edgeCount);
    expect(late.lead).toMatch(/2027-06-01/);
    expect(late.edges.length).toBe(late.edgeCount);

    const mid = presentOrganisationFlowGraph(org.relationships, meta, {
      rangeFrom: '2026-08-01',
      rangeTo: '2026-08-31',
    });
    expect(mid.edgeCount).toBeGreaterThan(0);
    expect(mid.lead).toMatch(/2026-08-01/);
  });
});
