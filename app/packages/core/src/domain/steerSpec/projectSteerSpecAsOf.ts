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

/**
 * True when the effective window overlaps [rangeFrom, rangeTo] (inclusive).
 * Empty bounds are open-ended. A single bound behaves like {@link isEffectiveOnDate}.
 */
export function isEffectiveInRange(
  window: EffectiveWindow,
  rangeFrom?: string | null,
  rangeTo?: string | null,
): boolean {
  const from = rangeFrom?.trim() || null;
  const to = rangeTo?.trim() || null;
  if (!from && !to) return true;

  let start = from;
  let end = to;
  if (start && end && start > end) {
    start = to;
    end = from;
  }

  if (start && !end) return isEffectiveOnDate(window, start);
  if (!start && end) return isEffectiveOnDate(window, end);

  const winFrom = window.effectiveFrom?.trim();
  const winUntil = window.effectiveUntil?.trim();
  if (winFrom && end && winFrom > end) return false;
  if (winUntil && start && winUntil < start) return false;
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
