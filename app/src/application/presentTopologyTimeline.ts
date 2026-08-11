import {
  buildTopologyTimeline,
  INTERACTION_MODE_COPY,
  normalizeInteractionMode,
  type InteractionMode,
  type InteractionShapeGeometry,
  type SteerSpec,
  type TopologyEventKind,
} from '@steerco/core';

export type TopologyTimelineCapacityMarker = {
  at: string;
  percent: number;
  teamId: string;
  teamLabel: string;
  memberLabel: string;
  kind: 'capacity_up' | 'capacity_down';
  deltaLabel: string;
  label: string;
};

export type TopologyTimelineRelationshipBand = {
  key: string;
  fromTeamId: string;
  toTeamId: string;
  fromLabel: string;
  toLabel: string;
  mode: InteractionMode;
  modeLabel: string;
  shape: InteractionShapeGeometry;
  startPercent: number;
  endPercent: number;
  startLabel: string;
  endLabel: string;
  sentence: string;
};

export type TopologyTimelineEventRow = {
  id: string;
  at: string;
  kind: TopologyEventKind;
  kindLabel: string;
  summary: string;
  teamLabels: string[];
  source: 'ledger' | 'derived';
};

export type TopologyTimelineModel = {
  rangeStart: string | null;
  rangeEnd: string | null;
  asOf: string | null;
  asOfPercent: number | null;
  empty: boolean;
  lead: string;
  capacityMarkers: TopologyTimelineCapacityMarker[];
  relationshipBands: TopologyTimelineRelationshipBand[];
  events: TopologyTimelineEventRow[];
};

const EVENT_KIND_LABEL: Record<TopologyEventKind, string> = {
  capacity_up: 'Capacity up',
  capacity_down: 'Capacity down',
  relationship_added: 'Relationship added',
  relationship_ended: 'Relationship ended',
  relationship_mode_changed: 'Mode changed',
  other: 'Other',
};

function dateToPercent(date: string, rangeStart: string, rangeEnd: string): number {
  if (rangeStart === rangeEnd) return 50;
  const startMs = Date.parse(rangeStart);
  const endMs = Date.parse(rangeEnd);
  const atMs = Date.parse(date);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !Number.isFinite(atMs)) return 0;
  const raw = ((atMs - startMs) / (endMs - startMs)) * 100;
  return Math.min(100, Math.max(0, Math.round(raw * 10) / 10));
}

function formatSignedFte(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}% FTE`;
}

/**
 * Present capacity deltas and relationship spans for the F13 topology timeline.
 * Uses the same date window vocabulary as `projectSteerSpecAsOf` / org as-of.
 */
export function presentTopologyTimeline(
  spec: SteerSpec,
  options: { asOf?: string | null } = {},
): TopologyTimelineModel {
  const timeline = buildTopologyTimeline(spec);
  const asOf = options.asOf?.trim() || null;
  const teamLabelById = new Map(
    spec.spec.teams.map((team) => [team.id, team.displayName] as const),
  );
  const rangeStart = timeline.rangeStart;
  const rangeEnd = timeline.rangeEnd;
  const hasRange = Boolean(rangeStart && rangeEnd);

  const capacityMarkers: TopologyTimelineCapacityMarker[] =
    hasRange && rangeStart && rangeEnd
      ? timeline.capacityDeltas.map((delta) => {
          const teamLabel = teamLabelById.get(delta.teamId) ?? delta.teamId;
          const deltaLabel = formatSignedFte(delta.deltaFtePercent);
          return {
            at: delta.at,
            percent: dateToPercent(delta.at, rangeStart, rangeEnd),
            teamId: delta.teamId,
            teamLabel,
            memberLabel: delta.memberDisplayName,
            kind: delta.kind,
            deltaLabel,
            label: `${delta.memberDisplayName} · ${teamLabel} · ${deltaLabel}`,
          };
        })
      : [];

  const relationshipBands: TopologyTimelineRelationshipBand[] =
    hasRange && rangeStart && rangeEnd
      ? timeline.relationshipSpans
          .map((span) => ({
            ...span,
            mode: normalizeInteractionMode(span.mode) as InteractionMode,
          }))
          .filter(
            (span) =>
              span.start !== null ||
              span.end !== null ||
              span.mode === 'collaboration' ||
              span.mode === 'facilitation',
          )
          .map((span) => {
            const fromLabel = teamLabelById.get(span.fromTeamId) ?? span.fromTeamId;
            const toLabel = teamLabelById.get(span.toTeamId) ?? span.toTeamId;
            const copy = INTERACTION_MODE_COPY[span.mode];
            const start = span.start ?? rangeStart;
            const end = span.end ?? rangeEnd;
            return {
              key: span.key,
              fromTeamId: span.fromTeamId,
              toTeamId: span.toTeamId,
              fromLabel,
              toLabel,
              mode: span.mode,
              modeLabel: copy.modeName,
              shape: copy.shape,
              startPercent: dateToPercent(start, rangeStart, rangeEnd),
              endPercent: dateToPercent(end, rangeStart, rangeEnd),
              startLabel: span.start ?? 'open',
              endLabel: span.end ?? 'open',
              sentence: `${fromLabel} ${copy.sentenceVerb} ${toLabel}`,
            };
          })
      : [];

  const events: TopologyTimelineEventRow[] = timeline.events.map((event) => ({
    id: event.id,
    at: event.at,
    kind: event.kind,
    kindLabel: EVENT_KIND_LABEL[event.kind],
    summary: event.summary,
    teamLabels: event.teamIds.map((id) => teamLabelById.get(id) ?? id),
    source: event.source,
  }));

  return {
    rangeStart,
    rangeEnd,
    asOf,
    asOfPercent:
      asOf && hasRange && rangeStart && rangeEnd ? dateToPercent(asOf, rangeStart, rangeEnd) : null,
    empty: capacityMarkers.length === 0 && relationshipBands.length === 0 && events.length === 0,
    lead: hasRange
      ? `Capacity changes and interaction windows from ${rangeStart} to ${rangeEnd}. Scrub as-of to match the organisation projection.`
      : 'Add member or relationship effective dates (or topology events) to see capacity and interaction history.',
    capacityMarkers,
    relationshipBands,
    events,
  };
}
