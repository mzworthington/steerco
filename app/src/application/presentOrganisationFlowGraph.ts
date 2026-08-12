import { isEffectiveInRange } from '@steerco/core';
import type { OrganisationInteractionMode, OrganisationRelationship } from './presentOrganisation';

export type OrganisationFlowOrientation = 'TB' | 'LR';

export type OrganisationFlowGraphMember = {
  id: string;
  displayName: string;
  title: string;
  disciplineLabel: string;
  ftePercent: number;
  initials: string;
};

export type OrganisationFlowGraphTeamMeta = {
  id: string;
  displayName: string;
  domainTitle: string;
  roleLabel: string;
  purpose: string;
  capacityLabel: string;
  streamTitles: string[];
  platformScopeLabel: string | null;
  facilitatesLabels: string[];
  members: OrganisationFlowGraphMember[];
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
  streamTitles: string[];
  platformScopeLabel: string | null;
  facilitatesLabels: string[];
  members: OrganisationFlowGraphMember[];
  /** True when domain filters are active and this team belongs to a selected domain. */
  inFocusDomain: boolean;
  /** True when domain filters are active and this team is outside the selected domains. */
  isExternal: boolean;
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
  /** True when domain filters are active and the edge leaves/enters a selected domain. */
  crossesBoundary: boolean;
};

export type OrganisationFlowGraphModel = {
  orientation: OrganisationFlowOrientation;
  nodes: OrganisationFlowGraphNode[];
  edges: OrganisationFlowGraphEdge[];
  domainOptions: OrganisationFlowGraphDomainOption[];
  listGroups: OrganisationFlowGraphListGroup[];
  edgeCount: number;
  crossDomainEdgeCount: number;
  empty: boolean;
  /** Domain titles currently focused (empty = organisation-wide). */
  focusDomainTitles: string[];
  lead: string;
};

export type OrganisationFlowFocusSelection =
  { kind: 'team'; id: string } | { kind: 'edge'; id: string } | null;

/** Filter team neighbourhood by relationship direction (from selected team's point of view). */
export type OrganisationFlowRelationView = 'depends_on' | 'depended_on_by';

export type OrganisationFlowFocus = {
  hasFocus: boolean;
  activeNodeIds: string[];
  activeEdgeIds: string[];
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
    /** Multi-select domain focus. Empty / omitted = all domains. */
    domainTitles?: readonly string[] | null;
    /** @deprecated Prefer domainTitles. Single-domain shorthand. */
    domainTitle?: string | null;
    orientation?: OrganisationFlowOrientation;
    /** Inclusive start of the dependency window to show. */
    rangeFrom?: string | null;
    /** Inclusive end of the dependency window to show. */
    rangeTo?: string | null;
  } = {},
): OrganisationFlowGraphModel {
  const focusDomainTitles = normalizeDomainFilters(options);
  const orientation = options.orientation ?? 'LR';
  const domainByTeamId = new Map(teams.map((team) => [team.id, team.domainTitle] as const));
  const teamById = new Map(teams.map((team) => [team.id, team] as const));

  const inDateRange = relationships.filter((rel) =>
    isEffectiveInRange(relationshipWindow(rel), options.rangeFrom, options.rangeTo),
  );

  const filtered =
    focusDomainTitles.length === 0
      ? inDateRange
      : inDateRange.filter((rel) => {
          const fromDomain = domainByTeamId.get(rel.fromTeamId) ?? 'Ungrouped';
          const toDomain = domainByTeamId.get(rel.toTeamId) ?? 'Ungrouped';
          return focusDomainTitles.includes(fromDomain) || focusDomainTitles.includes(toDomain);
        });

  const domainOptions = uniqueSorted(
    teams.map((team) => team.domainTitle).filter((title) => title.trim().length > 0),
  ).map((title) => ({ title }));

  const listGroups = groupRelationshipsByDomain(filtered, domainByTeamId);
  const { nodes, edges } = layoutInteractionGraph(
    filtered,
    teams,
    teamById,
    orientation,
    focusDomainTitles,
  );
  const crossDomainEdgeCount = edges.filter((edge) => edge.crossesBoundary).length;

  return {
    orientation,
    nodes,
    edges,
    domainOptions,
    listGroups,
    edgeCount: filtered.length,
    crossDomainEdgeCount,
    empty: nodes.length === 0,
    focusDomainTitles,
    lead: buildLead(
      orientation,
      focusDomainTitles,
      filtered.length,
      crossDomainEdgeCount,
      options.rangeFrom,
      options.rangeTo,
    ),
  };
}

/** Which nodes/edges stay bright when a team or interaction is selected. */
export function presentOrganisationFlowFocus(
  edges: OrganisationFlowGraphEdge[],
  selection: OrganisationFlowFocusSelection,
  relationView: OrganisationFlowRelationView = 'depends_on',
): OrganisationFlowFocus {
  if (!selection) {
    return { hasFocus: false, activeNodeIds: [], activeEdgeIds: [] };
  }

  if (selection.kind === 'edge') {
    const edge = edges.find((item) => item.id === selection.id);
    if (!edge) {
      return { hasFocus: false, activeNodeIds: [], activeEdgeIds: [] };
    }
    return {
      hasFocus: true,
      activeEdgeIds: [edge.id],
      activeNodeIds: [edge.source, edge.target],
    };
  }

  const related = edges.filter((edge) =>
    relationView === 'depends_on' ? edge.source === selection.id : edge.target === selection.id,
  );
  const activeNodeIds = new Set<string>([selection.id]);
  for (const edge of related) {
    activeNodeIds.add(edge.source);
    activeNodeIds.add(edge.target);
  }

  return {
    hasFocus: true,
    activeNodeIds: [...activeNodeIds],
    activeEdgeIds: related.map((edge) => edge.id),
  };
}

function normalizeDomainFilters(options: {
  domainTitles?: readonly string[] | null;
  domainTitle?: string | null;
}): string[] {
  const fromMulti = (options.domainTitles ?? [])
    .map((title) => title.trim())
    .filter((title) => title.length > 0);
  if (fromMulti.length > 0) return uniqueSorted(fromMulti);

  const single = options.domainTitle?.trim() || null;
  return single ? [single] : [];
}

function buildLead(
  orientation: OrganisationFlowOrientation,
  focusDomainTitles: string[],
  edgeCount: number,
  crossDomainEdgeCount: number,
  rangeFrom?: string | null,
  rangeTo?: string | null,
): string {
  const orient = orientation === 'LR' ? 'Left-to-right' : 'Top-down';
  const edgePhrase = `${edgeCount} edge${edgeCount === 1 ? '' : 's'}`;
  const from = rangeFrom?.trim() || null;
  const to = rangeTo?.trim() || null;
  const rangePhrase =
    from && to
      ? from === to
        ? ` as of ${from}`
        : ` active ${from} → ${to}`
      : from
        ? ` as of ${from}`
        : to
          ? ` as of ${to}`
          : '';
  if (focusDomainTitles.length === 0) {
    return `${orient} organisation-wide interaction graph (${edgePhrase}${rangePhrase}). Filter by domain when noisy.`;
  }
  if (focusDomainTitles.length === 1) {
    return `${orient} interaction graph focused on ${focusDomainTitles[0]} (${edgePhrase}, ${crossDomainEdgeCount} cross-domain${rangePhrase}). Highlighted edges show dependencies on other domains.`;
  }
  const labels = focusDomainTitles.join(', ');
  return `${orient} interaction graph focused on ${focusDomainTitles.length} domains (${labels}; ${edgePhrase}, ${crossDomainEdgeCount} cross-domain${rangePhrase}). Highlighted edges show dependencies on other domains.`;
}

/** Prefer effectiveUntil; fall back to expectedUntil for time-boxed modes. */
function relationshipWindow(rel: OrganisationRelationship): {
  effectiveFrom?: string;
  effectiveUntil?: string;
} {
  return {
    effectiveFrom: rel.effectiveFrom ?? undefined,
    effectiveUntil: rel.effectiveUntil ?? rel.expectedUntil ?? undefined,
  };
}

function layoutInteractionGraph(
  relationships: OrganisationRelationship[],
  teams: OrganisationFlowGraphTeamMeta[],
  teamById: Map<string, OrganisationFlowGraphTeamMeta>,
  orientation: OrganisationFlowOrientation,
  focusDomainTitles: string[],
): { nodes: OrganisationFlowGraphNode[]; edges: OrganisationFlowGraphEdge[] } {
  const focusActive = focusDomainTitles.length > 0;
  const involved = new Set<string>();

  for (const rel of relationships) {
    involved.add(rel.fromTeamId);
    involved.add(rel.toTeamId);
  }

  for (const team of teams) {
    if (!focusActive || focusDomainTitles.includes(team.domainTitle)) {
      involved.add(team.id);
    }
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
    const inFocusDomain = focusActive && focusDomainTitles.includes(domainTitle);
    const isExternal = focusActive && !focusDomainTitles.includes(domainTitle);

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
        streamTitles: team?.streamTitles ?? [],
        platformScopeLabel: team?.platformScopeLabel ?? null,
        facilitatesLabels: team?.facilitatesLabels ?? [],
        members: team?.members ?? [],
        inFocusDomain,
        isExternal,
        position: { x, y },
      });
    });

    const span = orientation === 'LR' ? NODE_WIDTH + DOMAIN_GAP : NODE_HEIGHT + DOMAIN_GAP;
    domainOffset += span;
  }

  const edges: OrganisationFlowGraphEdge[] = relationships.map((rel) => {
    const fromDomain = teamById.get(rel.fromTeamId)?.domainTitle ?? 'Ungrouped';
    const toDomain = teamById.get(rel.toTeamId)?.domainTitle ?? 'Ungrouped';
    const fromInFocus = focusDomainTitles.includes(fromDomain);
    const toInFocus = focusDomainTitles.includes(toDomain);
    const crossesBoundary = focusActive && fromInFocus !== toInFocus;

    return {
      id: `${rel.fromTeamId}-${rel.mode}-${rel.toTeamId}`,
      source: rel.fromTeamId,
      target: rel.toTeamId,
      mode: rel.mode,
      modeLabel: MODE_EDGE_LABEL[rel.mode],
      modeTeaching: rel.modeTeaching,
      sentence: rel.sentence,
      expectedUntil: rel.expectedUntil,
      crossesBoundary,
    };
  });

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
