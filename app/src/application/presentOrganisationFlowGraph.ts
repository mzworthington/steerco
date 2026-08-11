import type { OrganisationInteractionMode, OrganisationRelationship } from './presentOrganisation';

export type OrganisationFlowGraphTeamMeta = {
  id: string;
  displayName: string;
  domainTitle: string;
};

export type OrganisationFlowGraphDomainOption = {
  title: string;
};

export type OrganisationFlowGraphListGroup = {
  domainTitle: string;
  relationships: OrganisationRelationship[];
};

export type OrganisationFlowGraphModel = {
  mermaid: string;
  domainOptions: OrganisationFlowGraphDomainOption[];
  listGroups: OrganisationFlowGraphListGroup[];
  edgeCount: number;
  empty: boolean;
  lead: string;
};

const MODE_EDGE: Record<OrganisationInteractionMode, { arrow: string; label: string }> = {
  x_as_a_service: { arrow: '-->', label: 'XaaS' },
  collaboration: { arrow: '==>', label: 'Collab' },
  facilitation: { arrow: '-.->', label: 'Facilitate' },
};

/**
 * Present organisation relationships as a Mermaid flowchart (domain subgraphs)
 * plus a domain-grouped list alternative for accessibility.
 */
export function presentOrganisationFlowGraph(
  relationships: OrganisationRelationship[],
  teams: OrganisationFlowGraphTeamMeta[],
  options: { domainTitle?: string | null } = {},
): OrganisationFlowGraphModel {
  const domainFilter = options.domainTitle?.trim() || null;
  const domainByTeamId = new Map(teams.map((team) => [team.id, team.domainTitle] as const));
  const nameByTeamId = new Map(teams.map((team) => [team.id, team.displayName] as const));

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
  const mermaid = buildMermaidFlowchart(filtered, domainByTeamId, nameByTeamId);

  return {
    mermaid,
    domainOptions,
    listGroups,
    edgeCount: filtered.length,
    empty: filtered.length === 0,
    lead: domainFilter
      ? `Interaction graph focused on ${domainFilter} (${filtered.length} edge${filtered.length === 1 ? '' : 's'}).`
      : `Organisation-wide interaction graph (${filtered.length} edge${filtered.length === 1 ? '' : 's'}). Filter by domain to reduce noise.`,
  };
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

function buildMermaidFlowchart(
  relationships: OrganisationRelationship[],
  domainByTeamId: Map<string, string>,
  nameByTeamId: Map<string, string>,
): string {
  if (relationships.length === 0) {
    return 'flowchart LR\n  empty["No interactions yet"]';
  }

  const involved = new Set<string>();
  for (const rel of relationships) {
    involved.add(rel.fromTeamId);
    involved.add(rel.toTeamId);
  }

  const byDomain = new Map<string, string[]>();
  for (const teamId of involved) {
    const domain = domainByTeamId.get(teamId) ?? 'Ungrouped';
    const list = byDomain.get(domain) ?? [];
    list.push(teamId);
    byDomain.set(domain, list);
  }

  const lines: string[] = ['flowchart LR'];

  for (const [domain, teamIds] of [...byDomain.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const subgraphId = mermaidSafeId(`dom_${domain}`);
    lines.push(`  subgraph ${subgraphId}["${escapeLabel(domain)}"]`);
    for (const teamId of teamIds.sort((a, b) => a.localeCompare(b))) {
      const label = nameByTeamId.get(teamId) ?? teamId;
      lines.push(`    ${mermaidSafeId(teamId)}["${escapeLabel(label)}"]`);
    }
    lines.push('  end');
  }

  for (const rel of relationships) {
    const style = MODE_EDGE[rel.mode];
    lines.push(
      `  ${mermaidSafeId(rel.fromTeamId)} ${style.arrow}|${style.label}| ${mermaidSafeId(rel.toTeamId)}`,
    );
  }

  return lines.join('\n');
}

function mermaidSafeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[0-9]/.test(cleaned) ? `n_${cleaned}` : cleaned;
}

function escapeLabel(value: string): string {
  return value.replace(/"/g, "'").replace(/[\[\]]/g, '');
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
