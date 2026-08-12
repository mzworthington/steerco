import type { SteerSpec } from './steerSpecSchema';
import { TEAM_SIZE_GUIDANCE } from '../teamTopologies/vocabulary';

export const DEFAULT_PLATFORM_OVERLOAD_THRESHOLD = 8;
/** Soft caution when recorded member count reaches Dunbar high-trust boundary (~15). */
export const DEFAULT_TEAM_OVERSIZED_THRESHOLD = TEAM_SIZE_GUIDANCE.oversizedThreshold;

export type SteerMismatchCode =
  | 'bet_without_team'
  | 'bet_without_kill_criteria'
  | 'platform_overload'
  | 'team_without_bet'
  | 'orphan_outcome'
  | 'bet_without_mos_link'
  | 'collab_without_end'
  | 'stream_bet_wip'
  | 'enabling_owns_delivery'
  | 'stream_missing_product'
  | 'stream_aligned_without_stream'
  | 'stream_aligned_multi_stream'
  | 'css_without_stream'
  | 'team_oversized'
  | 'stream_multi_team';

/** Bet statuses considered "active" - funded and being steered, not just proposed or closed out. */
const ACTIVE_BET_STATUSES = new Set(['on_track', 'at_risk', 'stop_ready']);
/** Bet statuses that count toward work-in-progress - active plus proposed-but-not-yet-started. */
const WIP_BET_STATUSES = new Set(['proposed', 'on_track', 'at_risk', 'stop_ready']);
/** Interaction modes expected to be temporary and therefore worth time-boxing. */
const TIME_BOXABLE_MODES = new Set(['collaboration', 'facilitation']);
const STREAM_BET_WIP_THRESHOLD = 2;

export type SteerMismatchSeverity = 'error' | 'warning';

export type SteerMismatch = {
  code: SteerMismatchCode;
  severity: SteerMismatchSeverity;
  title: string;
  headline: string;
  relatedTeamIds?: string[];
  relatedBetIds?: string[];
  relatedOutcomeIds?: string[];
  relatedStreamIds?: string[];
};

export type DetectMismatchesOptions = {
  platformOverloadThreshold?: number;
  teamOversizedThreshold?: number;
};

function communicationPaths(memberCount: number): number {
  return (memberCount * (memberCount - 1)) / 2;
}

export function detectSteerSpecMismatches(
  doc: SteerSpec,
  options?: DetectMismatchesOptions,
): SteerMismatch[] {
  const threshold = options?.platformOverloadThreshold ?? DEFAULT_PLATFORM_OVERLOAD_THRESHOLD;
  const oversizedThreshold = options?.teamOversizedThreshold ?? DEFAULT_TEAM_OVERSIZED_THRESHOLD;
  const mismatches: SteerMismatch[] = [];
  const teamsById = new Map(doc.spec.teams.map((team) => [team.id, team]));

  for (const bet of doc.spec.bets) {
    if (bet.fundedTeamIds.length === 0) {
      mismatches.push({
        code: 'bet_without_team',
        severity: 'error',
        title: 'Bet without a delivering team',
        headline: `“${bet.title}” has no funded teams yet.`,
        relatedBetIds: [bet.id],
      });
    }
    if (!bet.killCriteria.trim()) {
      mismatches.push({
        code: 'bet_without_kill_criteria',
        severity: 'error',
        title: 'Bet without kill criteria',
        headline: `“${bet.title}” needs kill criteria before a stop decision is fair.`,
        relatedBetIds: [bet.id],
      });
    }
    const hasMosLink = bet.metricIds.length > 0 || Boolean(bet.primaryMetricId);
    if (ACTIVE_BET_STATUSES.has(bet.status) && !hasMosLink) {
      mismatches.push({
        code: 'bet_without_mos_link',
        severity: 'warning',
        title: 'Bet without a Measure of Success link',
        headline: `“${bet.title}” is active but has no linked metric - steering conversations need a number to point at.`,
        relatedBetIds: [bet.id],
      });
    }
  }

  for (const outcome of doc.spec.outcomes) {
    const betCount = doc.spec.bets.filter((bet) => bet.outcomeId === outcome.id).length;
    if (betCount === 0) {
      mismatches.push({
        code: 'orphan_outcome',
        severity: 'warning',
        title: 'Goal with no bets',
        headline: `“${outcome.title}” has no funded bets yet.`,
        relatedOutcomeIds: [outcome.id],
      });
    }
  }

  const fundedTeamIds = new Set(doc.spec.bets.flatMap((bet) => bet.fundedTeamIds));
  for (const team of doc.spec.teams) {
    if (team.role === 'stream_aligned' && !fundedTeamIds.has(team.id)) {
      mismatches.push({
        code: 'team_without_bet',
        severity: 'warning',
        title: 'Customer-facing team without a bet',
        headline: `“${team.displayName}” is not funding any bet yet.`,
        relatedTeamIds: [team.id],
      });
    }
  }

  for (const team of doc.spec.teams) {
    if (team.role !== 'platform') continue;
    const dependents = doc.spec.relationships.filter(
      (relationship) => relationship.toTeamId === team.id && relationship.mode === 'x_as_a_service',
    );
    if (dependents.length >= threshold) {
      mismatches.push({
        code: 'platform_overload',
        severity: 'warning',
        title: 'Platform under heavy load',
        headline: `“${team.displayName}” has ${dependents.length} teams using it as a service - a cognitive-load and flow risk for those dependents, not a headcount problem.`,
        relatedTeamIds: [team.id, ...dependents.map((item) => item.fromTeamId)],
      });
    }
  }

  for (const relationship of doc.spec.relationships) {
    if (!TIME_BOXABLE_MODES.has(relationship.mode) || relationship.expectedUntil) continue;
    const from = teamsById.get(relationship.fromTeamId);
    const to = teamsById.get(relationship.toTeamId);
    mismatches.push({
      code: 'collab_without_end',
      severity: 'warning',
      title: 'Time-boxed interaction without an end date',
      headline: `“${from?.displayName ?? relationship.fromTeamId}” → “${to?.displayName ?? relationship.toTeamId}” (${relationship.mode}) has no expectedUntil - collaboration and facilitation are meant to be temporary.`,
      relatedTeamIds: [relationship.fromTeamId, relationship.toTeamId],
    });
  }

  for (const team of doc.spec.teams) {
    if (team.role !== 'stream_aligned') continue;
    const activeBets = doc.spec.bets.filter(
      (bet) => WIP_BET_STATUSES.has(bet.status) && bet.fundedTeamIds.includes(team.id),
    );
    if (activeBets.length > STREAM_BET_WIP_THRESHOLD) {
      mismatches.push({
        code: 'stream_bet_wip',
        severity: 'warning',
        title: 'Stream-aligned team stretched across too many active bets',
        headline: `“${team.displayName}” is funded on ${activeBets.length} active bets at once - a work-in-progress risk, not a headcount problem.`,
        relatedTeamIds: [team.id],
        relatedBetIds: activeBets.map((bet) => bet.id),
      });
    }
  }

  for (const bet of doc.spec.bets) {
    if (!ACTIVE_BET_STATUSES.has(bet.status) || bet.fundedTeamIds.length !== 1) continue;
    const soleTeam = teamsById.get(bet.fundedTeamIds[0]);
    if (soleTeam?.role === 'enabling') {
      mismatches.push({
        code: 'enabling_owns_delivery',
        severity: 'warning',
        title: 'Enabling team carrying sole delivery ownership',
        headline: `“${soleTeam.displayName}” is the only funded team on “${bet.title}” - enabling teams should coach delivery, not own it long-term.`,
        relatedTeamIds: [soleTeam.id],
        relatedBetIds: [bet.id],
      });
    }
  }

  for (const team of doc.spec.teams) {
    if (team.role !== 'stream_aligned') continue;
    if (team.members.length === 0) continue;
    const hasProduct = team.members.some((member) => member.discipline === 'product');
    if (!hasProduct) {
      mismatches.push({
        code: 'stream_missing_product',
        severity: 'warning',
        title: 'Stream team without product capacity',
        headline: `“${team.displayName}” has members recorded but no product discipline FTE - discovery and goal framing may stall.`,
        relatedTeamIds: [team.id],
      });
    }
  }

  for (const team of doc.spec.teams) {
    const streamIds = team.streamIds ?? [];
    if (team.role === 'stream_aligned') {
      if (streamIds.length === 0) {
        mismatches.push({
          code: 'stream_aligned_without_stream',
          severity: 'warning',
          title: 'Stream-aligned team without a stream',
          headline: `“${team.displayName}” is stream-aligned but not assigned to a stream - ideally one team owns one flow of change end-to-end.`,
          relatedTeamIds: [team.id],
        });
      } else if (streamIds.length > 1) {
        mismatches.push({
          code: 'stream_aligned_multi_stream',
          severity: 'warning',
          title: 'Stream-aligned team across multiple streams',
          headline: `“${team.displayName}” is aligned to ${streamIds.length} streams - allowed to model reality, but ideal is one stream per stream-aligned team to protect cognitive load and flow.`,
          relatedTeamIds: [team.id],
        });
      }
    }
    if (team.role === 'complicated_subsystem' && streamIds.length === 0) {
      mismatches.push({
        code: 'css_without_stream',
        severity: 'warning',
        title: 'Complicated subsystem outside a stream',
        headline: `“${team.displayName}” is a complicated subsystem with no stream - place it in a stream and use interaction modes (X-as-a-Service / Collaboration) to show how embedded it is.`,
        relatedTeamIds: [team.id],
      });
    }
  }

  for (const team of doc.spec.teams) {
    const memberCount = team.members.length;
    if (memberCount < oversizedThreshold) continue;
    const paths = communicationPaths(memberCount);
    mismatches.push({
      code: 'team_oversized',
      severity: 'warning',
      title: 'Team size raising cognitive load',
      headline: `“${team.displayName}” has ${memberCount} people recorded (~${paths} communication paths). Team Topologies aims near ${TEAM_SIZE_GUIDANCE.idealAround}; above ~${oversizedThreshold} trust and coordination strain. ${TEAM_SIZE_GUIDANCE.evolutionTeaching}`,
      relatedTeamIds: [team.id],
    });
  }

  const streamAlignedByStream = new Map<string, string[]>();
  for (const team of doc.spec.teams) {
    if (team.role !== 'stream_aligned') continue;
    for (const streamId of team.streamIds ?? []) {
      const list = streamAlignedByStream.get(streamId) ?? [];
      list.push(team.id);
      streamAlignedByStream.set(streamId, list);
    }
  }
  const streamTitleById = new Map(doc.spec.streams.map((stream) => [stream.id, stream.title]));
  for (const [streamId, teamIds] of streamAlignedByStream) {
    if (teamIds.length < 2) continue;
    const names = teamIds.map((id) => teamsById.get(id)?.displayName ?? id);
    mismatches.push({
      code: 'stream_multi_team',
      severity: 'warning',
      title: 'Multiple stream-aligned teams on one stream',
      headline: `Stream “${streamTitleById.get(streamId) ?? streamId}” has ${teamIds.length} stream-aligned teams (${names.join(', ')}). Ideal is one team owning one flow - if load is high, fracture into peer domain slices each with its own stream, rather than stacking teams under one stream.`,
      relatedTeamIds: teamIds,
      relatedStreamIds: [streamId],
    });
  }

  // Keep relatedTeamIds only for teams that still exist (defensive).
  return mismatches.map((mismatch) => {
    if (!mismatch.relatedTeamIds) return mismatch;
    return {
      ...mismatch,
      relatedTeamIds: mismatch.relatedTeamIds.filter((id) => teamsById.has(id) || id.length > 0),
    };
  });
}
