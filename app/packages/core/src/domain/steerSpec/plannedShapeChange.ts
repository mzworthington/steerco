import { INTERACTION_MODES, type InteractionMode, type SteerSpec } from './steerSpecSchema';

export type PlannedShapeChangeKind = 'capacity' | 'relationship';

export type PlannedShapeChange = {
  id: string;
  at: string;
  kind: PlannedShapeChangeKind;
  summary: string;
  teamIds: string[];
  memberId?: string;
  fromTeamId?: string;
  toTeamId?: string;
  mode?: InteractionMode;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value.trim());
}

/** Inclusive calendar compare - YYYY-MM-DD lexicographic order is safe. */
export function isFutureIsoDate(at: string, today: string): boolean {
  return isIsoDate(at) && isIsoDate(today) && at.trim() > today.trim();
}

export function calendarTodayIsoDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function plannedChangeIdForMember(memberId: string): string {
  return `planned_member/${memberId}`;
}

export function plannedChangeIdForRelationship(
  fromTeamId: string,
  toTeamId: string,
  mode: InteractionMode,
): string {
  return `planned_rel/${fromTeamId}/${toTeamId}/${mode}`;
}

export function parsePlannedShapeChangeId(
  id: string,
):
  | { kind: 'capacity'; memberId: string }
  | { kind: 'relationship'; fromTeamId: string; toTeamId: string; mode: InteractionMode }
  | null {
  const capacityPrefix = 'planned_member/';
  if (id.startsWith(capacityPrefix)) {
    const memberId = id.slice(capacityPrefix.length).trim();
    return memberId ? { kind: 'capacity', memberId } : null;
  }

  const relationshipPrefix = 'planned_rel/';
  if (!id.startsWith(relationshipPrefix)) return null;
  const rest = id.slice(relationshipPrefix.length);
  const parts = rest.split('/');
  if (parts.length !== 3) return null;
  const [fromTeamId, toTeamId, rawMode] = parts;
  if (!fromTeamId || !toTeamId || !rawMode) return null;
  const mode = parseInteractionMode(rawMode);
  if (!mode) return null;
  return { kind: 'relationship', fromTeamId, toTeamId, mode };
}

function parseInteractionMode(value: string): InteractionMode | null {
  for (const mode of INTERACTION_MODES) {
    if (mode === value) return mode;
  }
  return null;
}

/**
 * Future-dated capacity seats and relationships - manual planned events only.
 * Historical windows (from ≤ today) are not planned.
 */
export function listPlannedShapeChanges(doc: SteerSpec, today: string): PlannedShapeChange[] {
  const day = today.trim();
  const teamName = new Map(doc.spec.teams.map((team) => [team.id, team.displayName] as const));
  const planned: PlannedShapeChange[] = [];

  for (const team of doc.spec.teams) {
    for (const member of team.members ?? []) {
      const at = member.effectiveFrom?.trim();
      if (!at || !isFutureIsoDate(at, day)) continue;
      planned.push({
        id: plannedChangeIdForMember(member.id),
        at,
        kind: 'capacity',
        summary: `${member.displayName} joins ${team.displayName} on ${at}`,
        teamIds: [team.id],
        memberId: member.id,
      });
    }
  }

  for (const relationship of doc.spec.relationships ?? []) {
    const at = relationship.effectiveFrom?.trim();
    if (!at || !isFutureIsoDate(at, day)) continue;
    const fromLabel = teamName.get(relationship.fromTeamId) ?? relationship.fromTeamId;
    const toLabel = teamName.get(relationship.toTeamId) ?? relationship.toTeamId;
    planned.push({
      id: plannedChangeIdForRelationship(
        relationship.fromTeamId,
        relationship.toTeamId,
        relationship.mode,
      ),
      at,
      kind: 'relationship',
      summary: `${fromLabel} will use ${toLabel} (${relationship.mode}) from ${at}`,
      teamIds: [relationship.fromTeamId, relationship.toTeamId],
      fromTeamId: relationship.fromTeamId,
      toTeamId: relationship.toTeamId,
      mode: relationship.mode,
    });
  }

  planned.sort((left, right) => {
    if (left.at !== right.at) return left.at.localeCompare(right.at);
    return left.id.localeCompare(right.id);
  });
  return planned;
}

export function plannedShapeChangeCue(
  planned: PlannedShapeChange[],
  asOf: string | null,
): string | null {
  if (planned.length === 0) return null;

  const dates = [...new Set(planned.map((item) => item.at))];
  const asOfDate = asOf?.trim() || null;
  if (asOfDate && dates.includes(asOfDate)) {
    return `Showing the planned shape for ${asOfDate}. Load and flow checks use that date.`;
  }

  const dateList =
    dates.length === 1
      ? dates[0]
      : `${dates.slice(0, -1).join(', ')} and ${dates[dates.length - 1]}`;
  const noun = planned.length === 1 ? 'A planned shape change is' : 'Planned shape changes are';
  return `${noun} recorded for ${dateList}. Today is unchanged - set as-of to a planned date to see load.`;
}
