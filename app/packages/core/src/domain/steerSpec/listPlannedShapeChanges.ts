import type { SteerSpec } from './steerSpecSchema';
import { INTERACTION_MODE_COPY } from '../teamTopologies/vocabulary';

export type PlannedShapeChangeKind = 'capacity' | 'relationship';

export type PlannedShapeChange = {
  id: string;
  at: string;
  kind: PlannedShapeChangeKind;
  summary: string;
  teamIds: string[];
};

function compareIsoDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Windows that start after as-of — recorded future topology, not yet in the projection.
 */
export function listPlannedShapeChanges(doc: SteerSpec, asOf: string): PlannedShapeChange[] {
  const date = asOf.trim();
  if (!date) return [];

  const changes: PlannedShapeChange[] = [];
  const teamName = new Map(doc.spec.teams.map((team) => [team.id, team.displayName] as const));

  for (const team of doc.spec.teams) {
    for (const member of team.members ?? []) {
      const from = member.effectiveFrom?.trim();
      if (!from || from <= date) continue;
      changes.push({
        id: `capacity:${team.id}:${member.id}`,
        at: from,
        kind: 'capacity',
        summary: `${member.displayName} joins ${team.displayName} on ${from}`,
        teamIds: [team.id],
      });
    }
  }

  for (const relationship of doc.spec.relationships ?? []) {
    const from = relationship.effectiveFrom?.trim();
    if (!from || from <= date) continue;
    const fromLabel = teamName.get(relationship.fromTeamId) ?? relationship.fromTeamId;
    const toLabel = teamName.get(relationship.toTeamId) ?? relationship.toTeamId;
    const modeLabel = INTERACTION_MODE_COPY[relationship.mode]?.modeName ?? relationship.mode;
    changes.push({
      id: `relationship:${relationship.fromTeamId}::${relationship.toTeamId}::${relationship.mode}`,
      at: from,
      kind: 'relationship',
      summary: `${fromLabel} ${modeLabel} with ${toLabel} from ${from}`,
      teamIds: [relationship.fromTeamId, relationship.toTeamId],
    });
  }

  changes.sort((a, b) => compareIsoDate(a.at, b.at) || a.id.localeCompare(b.id));
  return changes;
}

export function plannedShapeChangeIdParts(
  id: string,
):
  | { kind: 'capacity'; teamId: string; memberId: string }
  | { kind: 'relationship'; fromTeamId: string; toTeamId: string; mode: string }
  | null {
  if (id.startsWith('capacity:')) {
    const rest = id.slice('capacity:'.length);
    const split = rest.indexOf(':');
    if (split <= 0 || split === rest.length - 1) return null;
    return {
      kind: 'capacity',
      teamId: rest.slice(0, split),
      memberId: rest.slice(split + 1),
    };
  }
  if (id.startsWith('relationship:')) {
    const rest = id.slice('relationship:'.length);
    const parts = rest.split('::');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
    return {
      kind: 'relationship',
      fromTeamId: parts[0],
      toTeamId: parts[1],
      mode: parts[2],
    };
  }
  return null;
}
