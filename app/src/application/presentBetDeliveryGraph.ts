import type { InteractionMode, SteerSpec } from '@steerco/core';
import {
  DEFAULT_PLATFORM_OVERLOAD_THRESHOLD,
  INTERACTION_MODE_COPY,
  TOPOLOGY_TYPE_COPY,
  projectSteerSpecAsOf,
  type TeamRole,
} from '@steerco/core';
import type { BetDetailTeamCue, BetDetailTeamGroup, BetDetailTeamOption } from './presentBetDetail';

export type BetDeliveryGraphDepth = 'direct' | 'transitive';

export type BetDeliveryGraphNodeKind = 'funded' | 'related';

export type BetDeliveryGraphCue = BetDetailTeamCue;

export type BetDeliveryGraphNode = {
  id: string;
  label: string;
  domainTitle: string;
  roleLabel: string;
  kind: BetDeliveryGraphNodeKind;
  cues: BetDeliveryGraphCue[];
  position: { x: number; y: number };
};

export type BetDeliveryGraphEdge = {
  id: string;
  source: string;
  target: string;
  mode: InteractionMode;
  modeLabel: string;
  sentence: string;
};

export type BetDeliveryGraphModel = {
  depth: BetDeliveryGraphDepth;
  nodes: BetDeliveryGraphNode[];
  edges: BetDeliveryGraphEdge[];
  empty: boolean;
  fundedCount: number;
  relatedCount: number;
  lead: string;
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 86;
const GAP_Y = 32;
const DOMAIN_GAP = 48;

const MODE_EDGE_LABEL: Record<InteractionMode, string> = {
  x_as_a_service: 'XaaS',
  collaboration: 'Collab',
  facilitation: 'Facilitate',
};

const MANY_DEPENDENTS_THRESHOLD = 5;
const MANY_DEPENDENCIES_THRESHOLD = 4;

/**
 * Subgraph of teams involved in delivering a bet.
 * - direct: funded teams plus 1-hop neighbours
 * - transitive: BFS from funded through all relationships to the leaves of the connected component
 */
export function presentBetDeliveryGraph(
  spec: SteerSpec,
  fundedTeamIds: readonly string[],
  options: { asOf?: string | null; depth?: BetDeliveryGraphDepth } = {},
): BetDeliveryGraphModel {
  const asOf = options.asOf?.trim() || null;
  const depth: BetDeliveryGraphDepth = options.depth ?? 'direct';
  const projected = projectSteerSpecAsOf(spec, asOf);
  const funded = new Set(
    fundedTeamIds.filter((id) => projected.spec.teams.some((t) => t.id === id)),
  );
  const teamById = new Map(projected.spec.teams.map((team) => [team.id, team]));
  const domainTitleByTeamId = buildDomainTitleByTeamId(projected);

  const adjacency = new Map<string, Set<string>>();
  for (const relationship of projected.spec.relationships) {
    if (!teamById.has(relationship.fromTeamId) || !teamById.has(relationship.toTeamId)) continue;
    addEdge(adjacency, relationship.fromTeamId, relationship.toTeamId);
    addEdge(adjacency, relationship.toTeamId, relationship.fromTeamId);
  }

  const included = new Set<string>(funded);
  if (depth === 'direct') {
    for (const id of funded) {
      for (const neighbour of adjacency.get(id) ?? []) {
        included.add(neighbour);
      }
    }
  } else {
    const queue = [...funded];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const neighbour of adjacency.get(current) ?? []) {
        if (included.has(neighbour)) continue;
        included.add(neighbour);
        queue.push(neighbour);
      }
    }
  }

  const edges: BetDeliveryGraphEdge[] = [];
  for (const relationship of projected.spec.relationships) {
    if (!included.has(relationship.fromTeamId) || !included.has(relationship.toTeamId)) continue;
    if (depth === 'direct') {
      const touchesFunded =
        funded.has(relationship.fromTeamId) || funded.has(relationship.toTeamId);
      if (!touchesFunded) continue;
    }
    const from = teamById.get(relationship.fromTeamId);
    const to = teamById.get(relationship.toTeamId);
    const modeCopy = INTERACTION_MODE_COPY[relationship.mode];
    if (!from || !to || !modeCopy) continue;
    edges.push({
      id: `${relationship.fromTeamId}-${relationship.mode}-${relationship.toTeamId}`,
      source: relationship.fromTeamId,
      target: relationship.toTeamId,
      mode: relationship.mode,
      modeLabel: MODE_EDGE_LABEL[relationship.mode],
      sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
    });
  }

  // Funded-only teams with no edges still appear as isolated nodes.
  for (const id of funded) included.add(id);

  const cueByTeamId = buildCueByTeamId(projected);
  const byDomain = new Map<string, string[]>();
  for (const teamId of included) {
    const domain = domainTitleByTeamId.get(teamId) ?? 'Ungrouped';
    const list = byDomain.get(domain) ?? [];
    list.push(teamId);
    byDomain.set(domain, list);
  }

  const domains = [...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b));
  const nodes: BetDeliveryGraphNode[] = [];
  let domainOffset = 0;
  for (const [domainTitle, teamIds] of domains) {
    const sortedIds = [...teamIds].sort((a, b) => {
      const left = teamById.get(a)?.displayName ?? a;
      const right = teamById.get(b)?.displayName ?? b;
      return left.localeCompare(right);
    });
    sortedIds.forEach((teamId, index) => {
      const team = teamById.get(teamId);
      if (!team) return;
      const role = team.role as TeamRole;
      nodes.push({
        id: teamId,
        label: team.displayName,
        domainTitle,
        roleLabel: TOPOLOGY_TYPE_COPY[role]?.topologyName ?? team.role,
        kind: funded.has(teamId) ? 'funded' : 'related',
        cues: cueByTeamId.get(teamId) ?? [],
        position: {
          x: domainOffset,
          y: index * (NODE_HEIGHT + GAP_Y),
        },
      });
    });
    domainOffset += NODE_WIDTH + DOMAIN_GAP;
  }

  const fundedCount = nodes.filter((node) => node.kind === 'funded').length;
  const relatedCount = nodes.filter((node) => node.kind === 'related').length;
  const empty = fundedCount === 0;

  return {
    depth,
    nodes,
    edges,
    empty,
    fundedCount,
    relatedCount,
    lead: empty
      ? 'Select funded teams to grow the delivery graph.'
      : depth === 'transitive'
        ? `Funded teams plus every reachable dependency (${relatedCount} related).`
        : `Funded teams plus direct neighbours (${relatedCount} related). Toggle “Show all dependencies” to walk to the leaves.`,
  };
}

/** Filter domain-grouped picker rows by team name / role / stream text. */
export function filterBetDeliveryTeamGroups(
  groups: BetDetailTeamGroup[],
  query: string,
): BetDetailTeamGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;

  return groups
    .map((group) => ({
      domainTitle: group.domainTitle,
      teams: group.teams.filter((team) => teamMatchesQuery(team, needle)),
    }))
    .filter((group) => group.teams.length > 0);
}

function teamMatchesQuery(team: BetDetailTeamOption, needle: string): boolean {
  const haystack = [team.displayName, team.roleLabel, team.domainTitle ?? '', ...team.streamTitles]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}

function buildDomainTitleByTeamId(spec: SteerSpec): Map<string, string> {
  const domainTitleByStreamId = new Map<string, string>();
  for (const domain of spec.spec.domains) {
    for (const streamId of domain.memberStreamIds) {
      if (!domainTitleByStreamId.has(streamId)) {
        domainTitleByStreamId.set(streamId, domain.title);
      }
    }
  }

  const result = new Map<string, string>();
  for (const team of spec.spec.teams) {
    const streamIds = team.streamIds ?? [];
    const domainTitle =
      streamIds.map((id) => domainTitleByStreamId.get(id)).find(Boolean) ??
      (team.role === 'platform' || team.role === 'enabling' ? 'Shared support' : 'Ungrouped');
    result.set(team.id, domainTitle);
  }
  return result;
}

function buildCueByTeamId(spec: SteerSpec): Map<string, BetDeliveryGraphCue[]> {
  const inboundService = new Map<string, number>();
  const outbound = new Map<string, number>();
  for (const relationship of spec.spec.relationships) {
    outbound.set(relationship.fromTeamId, (outbound.get(relationship.fromTeamId) ?? 0) + 1);
    if (relationship.mode === 'x_as_a_service') {
      inboundService.set(
        relationship.toTeamId,
        (inboundService.get(relationship.toTeamId) ?? 0) + 1,
      );
    }
  }

  const result = new Map<string, BetDeliveryGraphCue[]>();
  for (const team of spec.spec.teams) {
    const cues: BetDeliveryGraphCue[] = [];
    const inbound = inboundService.get(team.id) ?? 0;
    const out = outbound.get(team.id) ?? 0;
    if (inbound >= DEFAULT_PLATFORM_OVERLOAD_THRESHOLD) {
      cues.push({
        kind: 'overloaded',
        label: `${inbound} teams use this as a service - cognitive-load and flow risk`,
      });
    } else if (inbound >= MANY_DEPENDENTS_THRESHOLD) {
      cues.push({
        kind: 'many_dependents',
        label: `${inbound} teams already depend on this one`,
      });
    }
    if (out >= MANY_DEPENDENCIES_THRESHOLD) {
      cues.push({
        kind: 'many_dependencies',
        label: `Depends on ${out} other teams`,
      });
    }
    if (cues.length > 0) result.set(team.id, cues);
  }
  return result;
}

function addEdge(adjacency: Map<string, Set<string>>, from: string, to: string): void {
  const set = adjacency.get(from) ?? new Set<string>();
  set.add(to);
  adjacency.set(from, set);
}
