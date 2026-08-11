import type { SteerSpec } from '@steerco/core';

export type TechnicalTreeOutcome = {
  id: string;
  title: string;
  status: string;
  metricIds: string[];
};

export type TechnicalTreeBet = {
  id: string;
  title: string;
  outcomeId: string;
  status: string;
  kind: string | null;
  fundingStance: string | null;
  valueRank: number | null;
  fundedTeamIds: string[];
  metricIds: string[];
  executiveHref: string;
};

export type TechnicalTreeTeam = {
  id: string;
  displayName: string;
  role: string;
  provenance: string;
  externalRefs: Array<{ system: string; id: string }>;
  streamIds: string[];
  executiveHref: string;
};

export type TechnicalTreeRelationship = {
  fromTeamId: string;
  toTeamId: string;
  fromLabel: string;
  toLabel: string;
  mode: string;
  expectedUntil: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
};

export type TechnicalTreeModel = {
  workspaceTitle: string;
  techRadarUrl: string | null;
  outcomes: TechnicalTreeOutcome[];
  bets: TechnicalTreeBet[];
  teams: TechnicalTreeTeam[];
  relationships: TechnicalTreeRelationship[];
  initiativeCount: number;
  productCount: number;
};

export function presentTechnicalTree(spec: SteerSpec): TechnicalTreeModel {
  const teamLabel = new Map(spec.spec.teams.map((team) => [team.id, team.displayName]));

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    techRadarUrl: spec.spec.techRadarUrl?.trim() || null,
    outcomes: spec.spec.outcomes.map((outcome) => ({
      id: outcome.id,
      title: outcome.title,
      status: outcome.status,
      metricIds: outcome.metrics.map((metric) => metric.id),
    })),
    bets: spec.spec.bets.map((bet) => ({
      id: bet.id,
      title: bet.title,
      outcomeId: bet.outcomeId,
      status: bet.status,
      kind: bet.kind ?? null,
      fundingStance: bet.fundingStance ?? null,
      valueRank: typeof bet.valueRank === 'number' ? bet.valueRank : null,
      fundedTeamIds: [...bet.fundedTeamIds],
      metricIds: [...(bet.metricIds ?? [])],
      executiveHref: `/workspace/bets/${bet.id}`,
    })),
    teams: spec.spec.teams.map((team) => ({
      id: team.id,
      displayName: team.displayName,
      role: team.role,
      provenance: team.provenance,
      externalRefs: team.externalRefs.map((ref) => ({ system: ref.system, id: ref.id })),
      streamIds: [...(team.streamIds ?? [])],
      executiveHref: '/workspace/organisation',
    })),
    relationships: spec.spec.relationships.map((rel) => ({
      fromTeamId: rel.fromTeamId,
      toTeamId: rel.toTeamId,
      fromLabel: teamLabel.get(rel.fromTeamId) ?? rel.fromTeamId,
      toLabel: teamLabel.get(rel.toTeamId) ?? rel.toTeamId,
      mode: rel.mode,
      expectedUntil: rel.expectedUntil ?? null,
      effectiveFrom: rel.effectiveFrom ?? null,
      effectiveUntil: rel.effectiveUntil ?? null,
    })),
    initiativeCount: spec.spec.initiatives?.length ?? 0,
    productCount: spec.spec.products?.length ?? 0,
  };
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
