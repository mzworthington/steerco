import type { SteerSpec, TeamMember, Relationship } from './steerSpecSchema';

export type EffectiveWindow = {
  effectiveFrom?: string;
  effectiveUntil?: string;
};

/** Inclusive ISO-date window check (YYYY-MM-DD lexicographic compare is safe). */
export function isEffectiveOnDate(window: EffectiveWindow, asOf: string): boolean {
  const from = window.effectiveFrom?.trim();
  const until = window.effectiveUntil?.trim();
  if (from && asOf < from) return false;
  if (until && asOf > until) return false;
  return true;
}

function projectMembers(members: TeamMember[], asOf: string): TeamMember[] {
  return members.filter((member) => isEffectiveOnDate(member, asOf));
}

function projectRelationships(relationships: Relationship[], asOf: string): Relationship[] {
  return relationships.filter((relationship) => isEffectiveOnDate(relationship, asOf));
}

/**
 * Project topology capacity and relationships as of a date.
 * Teams, groupings, bets, and outcomes are kept; members and relationships are window-filtered.
 * Pass null/undefined asOf to return the document unchanged.
 */
export function projectSteerSpecAsOf(doc: SteerSpec, asOf: string | null | undefined): SteerSpec {
  const date = asOf?.trim();
  if (!date) return doc;

  return {
    ...doc,
    spec: {
      ...doc.spec,
      teams: doc.spec.teams.map((team) => ({
        ...team,
        members: projectMembers(team.members ?? [], date),
      })),
      relationships: projectRelationships(doc.spec.relationships ?? [], date),
    },
  };
}
