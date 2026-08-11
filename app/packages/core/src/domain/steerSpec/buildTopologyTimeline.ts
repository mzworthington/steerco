import type { InteractionMode, SteerSpec, TopologyEventKind } from './steerSpecSchema';

export type TopologyTimelineCapacityDelta = {
  at: string;
  teamId: string;
  memberId: string;
  memberDisplayName: string;
  deltaFtePercent: number;
  kind: 'capacity_up' | 'capacity_down';
};

export type TopologyTimelineRelationshipSpan = {
  key: string;
  fromTeamId: string;
  toTeamId: string;
  mode: InteractionMode;
  /** Inclusive start; null means open-ended into the past. */
  start: string | null;
  /** Inclusive end; prefers effectiveUntil, then expectedUntil. */
  end: string | null;
};

export type TopologyTimelineListEvent = {
  id: string;
  at: string;
  kind: TopologyEventKind;
  summary: string;
  teamIds: string[];
  relationshipKey?: string;
  source: 'ledger' | 'derived';
};

export type TopologyTimeline = {
  rangeStart: string | null;
  rangeEnd: string | null;
  capacityDeltas: TopologyTimelineCapacityDelta[];
  relationshipSpans: TopologyTimelineRelationshipSpan[];
  events: TopologyTimelineListEvent[];
};

function relationshipKey(fromTeamId: string, toTeamId: string): string {
  return `${fromTeamId}::${toTeamId}`;
}

function compareIsoDate(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Derive capacity deltas, relationship spans, and a dated event list for the
 * topology timeline deep-dive (F13). Pure projection - does not mutate the document.
 */
export function buildTopologyTimeline(doc: SteerSpec): TopologyTimeline {
  const capacityDeltas: TopologyTimelineCapacityDelta[] = [];
  const events: TopologyTimelineListEvent[] = [];
  const dates: string[] = [];
  const ledger = doc.spec.topologyEvents ?? [];

  for (const event of ledger) {
    const at = event.at.trim();
    dates.push(at);
    events.push({
      id: event.id,
      at,
      kind: event.kind,
      summary: event.summary,
      teamIds: [...event.teamIds],
      relationshipKey: event.relationshipKey,
      source: 'ledger',
    });
  }

  const ledgerCovers = (at: string, kind: TopologyEventKind, teamId: string): boolean =>
    ledger.some(
      (event) => event.at.trim() === at && event.kind === kind && event.teamIds.includes(teamId),
    );

  for (const team of doc.spec.teams) {
    for (const member of team.members ?? []) {
      const from = member.effectiveFrom?.trim() || null;
      const until = member.effectiveUntil?.trim() || null;
      if (from) {
        capacityDeltas.push({
          at: from,
          teamId: team.id,
          memberId: member.id,
          memberDisplayName: member.displayName,
          deltaFtePercent: member.ftePercent,
          kind: 'capacity_up',
        });
        if (!ledgerCovers(from, 'capacity_up', team.id)) {
          events.push({
            id: `derived:${member.id}:up`,
            at: from,
            kind: 'capacity_up',
            summary: `${member.displayName} joined ${team.displayName} (+${member.ftePercent}% FTE)`,
            teamIds: [team.id],
            source: 'derived',
          });
        }
        dates.push(from);
      }
      if (until) {
        capacityDeltas.push({
          at: until,
          teamId: team.id,
          memberId: member.id,
          memberDisplayName: member.displayName,
          deltaFtePercent: -member.ftePercent,
          kind: 'capacity_down',
        });
        if (!ledgerCovers(until, 'capacity_down', team.id)) {
          events.push({
            id: `derived:${member.id}:down`,
            at: until,
            kind: 'capacity_down',
            summary: `${member.displayName} left ${team.displayName} (−${member.ftePercent}% FTE)`,
            teamIds: [team.id],
            source: 'derived',
          });
        }
        dates.push(until);
      }
    }
  }

  capacityDeltas.sort((a, b) => compareIsoDate(a.at, b.at) || a.memberId.localeCompare(b.memberId));

  const relationshipSpans: TopologyTimelineRelationshipSpan[] = (doc.spec.relationships ?? []).map(
    (relationship) => {
      const start = relationship.effectiveFrom?.trim() || null;
      const end = relationship.effectiveUntil?.trim() || relationship.expectedUntil?.trim() || null;
      if (start) dates.push(start);
      if (end) dates.push(end);
      return {
        key: relationshipKey(relationship.fromTeamId, relationship.toTeamId),
        fromTeamId: relationship.fromTeamId,
        toTeamId: relationship.toTeamId,
        mode: relationship.mode,
        start,
        end,
      };
    },
  );

  events.sort((a, b) => compareIsoDate(a.at, b.at) || a.id.localeCompare(b.id));

  dates.sort(compareIsoDate);
  const rangeStart = dates[0] ?? null;
  const rangeEnd = dates.length > 0 ? (dates[dates.length - 1] ?? null) : null;

  return {
    rangeStart,
    rangeEnd,
    capacityDeltas,
    relationshipSpans,
    events,
  };
}
