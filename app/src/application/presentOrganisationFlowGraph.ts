import type { OrganisationInteractionMode, OrganisationRelationship } from './presentOrganisation';

export type OrganisationFlowOrientation = 'TB' | 'LR';

export type OrganisationFlowGraphTeamMeta = {
  id: string;
  displayName: string;
  domainTitle: string;
  roleLabel: string;
  purpose: string;
  capacityLabel: string;
};

export type OrganisationFlowGraphDomainOption = {
  title: string;
};

export type OrganisationFlowGraphListGroup = {
  domainTitle: string;
  relationships: OrganisationRelationship[];
};

export type OrganisationFlowGraphNode = {
  id: string;
  label: string;
  domainTitle: string;
  roleLabel: string;
  purpose: string;
  capacityLabel: string;
  position: { x: number; y: number };
};

export type OrganisationFlowGraphEdge = {
  id: string;
  source: string;
  target: string;
  mode: OrganisationInteractionMode;
  modeLabel: string;
  modeTeaching: string;
  sentence: string;
  expectedUntil: string | null;
};

export type OrganisationFlowGraphModel = {
  orientation: OrganisationFlowOrientation;
  nodes: OrganisationFlowGraphNode[];
  edges: OrganisationFlowGraphEdge[];
  domainOptions: OrganisationFlowGraphDomainOption[];
  listGroups: OrganisationFlowGraphListGroup[];
  edgeCount: number;
  empty: boolean;
  lead: string;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 78;
const GAP_X = 64;
const GAP_Y = 36;
const DOMAIN_GAP = 48;

const MODE_EDGE_LABEL: Record<OrganisationInteractionMode, string> = {
  x_as_a_service: 'XaaS',
  collaboration: 'Collab',
  facilitation: 'Facilitate',
};

/**
 * Present organisation relationships as positioned nodes/edges (domain columns/rows)
 * plus a domain-grouped list alternative for accessibility.
 */
export function presentOrganisationFlowGraph(
  relationships: OrganisationRelationship[],
  teams: OrganisationFlowGraphTeamMeta[],
  options: {
    domainTitle?: string | null;
    orientation?: OrganisationFlowOrientation;
  } = {},
): OrganisationFlowGraphModel {
  const domainFilter = options.domainTitle?.trim() || null;
  const orientation = options.orientation ?? 'LR';
  const domainByTeamId = new Map(teams.map((team) => [team.id, team.domainTitle] as const));
  const teamById = new Map(teams.map((team) => [team.id, team] as const));

  const filtered = domainFilter
    ? relationships.filter((rel) => {
        const fromDomain = domainByTeamId.get(rel.fromTeamId) ?? 'Ungrouped';
        const toDomain = domainByTeamId.get(rel.toTeamId) ?? 'Ungrouped';
        return fromDomain === domainFilter || toDomain === domainFilter;
      })
    : relationships;

  const domainOptions = uniqueSorted(
    teams.map((team) => team.domainTitle).filter((title) => title.trim().length > 0),
  ).map((title) => ({ title }));

  const listGroups = groupRelationshipsByDomain(filtered, domainByTeamId);
  const { nodes, edges } = layoutInteractionGraph(filtered, teamById, orientation);

  return {
    orientation,
    nodes,
    edges,
    domainOptions,
    listGroups,
    edgeCount: filtered.length,
    empty: filtered.length === 0,
    lead: domainFilter
      ? `${orientation === 'LR' ? 'Left-to-right' : 'Top-down'} interaction graph focused on ${domainFilter} (${filtered.length} edge${filtered.length === 1 ? '' : 's'}). Select a team or edge for detail.`
      : `${orientation === 'LR' ? 'Left-to-right' : 'Top-down'} organisation-wide interaction graph (${filtered.length} edge${filtered.length === 1 ? '' : 's'}). Filter by domain when noisy.`,
  };
}

function layoutInteractionGraph(
  relationships: OrganisationRelationship[],
  teamById: Map<string, OrganisationFlowGraphTeamMeta>,
  orientation: OrganisationFlowOrientation,
): { nodes: OrganisationFlowGraphNode[]; edges: OrganisationFlowGraphEdge[] } {
  const involved = new Set<string>();
  for (const rel of relationships) {
    involved.add(rel.fromTeamId);
    involved.add(rel.toTeamId);
  }

  const byDomain = new Map<string, string[]>();
  for (const teamId of involved) {
    const team = teamById.get(teamId);
    const domain = team?.domainTitle ?? 'Ungrouped';
    const list = byDomain.get(domain) ?? [];
    list.push(teamId);
    byDomain.set(domain, list);
  }

  const domains = [...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b));
  const nodes: OrganisationFlowGraphNode[] = [];

  let domainOffset = 0;
  for (const [domainTitle, teamIds] of domains) {
    const sortedIds = [...teamIds].sort((a, b) => {
      const left = teamById.get(a)?.displayName ?? a;
      const right = teamById.get(b)?.displayName ?? b;
      return left.localeCompare(right);
    });

    sortedIds.forEach((teamId, index) => {
      const team = teamById.get(teamId);
      const x = orientation === 'LR' ? domainOffset : index * (NODE_WIDTH + GAP_X);
      const y = orientation === 'LR' ? index * (NODE_HEIGHT + GAP_Y) : domainOffset;

      nodes.push({
        id: teamId,
        label: team?.displayName ?? teamId,
        domainTitle,
        roleLabel: team?.roleLabel ?? 'Team',
        purpose: team?.purpose ?? '',
        capacityLabel: team?.capacityLabel ?? '',
        position: { x, y },
      });
    });

    const span = orientation === 'LR' ? NODE_WIDTH + DOMAIN_GAP : NODE_HEIGHT + DOMAIN_GAP;
    domainOffset += span;
  }

  const edges: OrganisationFlowGraphEdge[] = relationships.map((rel) => ({
    id: `${rel.fromTeamId}-${rel.mode}-${rel.toTeamId}`,
    source: rel.fromTeamId,
    target: rel.toTeamId,
    mode: rel.mode,
    modeLabel: MODE_EDGE_LABEL[rel.mode],
    modeTeaching: rel.modeTeaching,
    sentence: rel.sentence,
    expectedUntil: rel.expectedUntil,
  }));

  return { nodes, edges };
}

function groupRelationshipsByDomain(
  relationships: OrganisationRelationship[],
  domainByTeamId: Map<string, string>,
): OrganisationFlowGraphListGroup[] {
  const buckets = new Map<string, OrganisationRelationship[]>();
  for (const rel of relationships) {
    const domain = domainByTeamId.get(rel.fromTeamId) ?? 'Ungrouped';
    const list = buckets.get(domain) ?? [];
    list.push(rel);
    buckets.set(domain, list);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([domainTitle, items]) => ({
      domainTitle,
      relationships: items,
    }));
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
