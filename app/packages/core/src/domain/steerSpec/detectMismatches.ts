import type { SteerSpec } from './steerSpecSchema';

export const DEFAULT_PLATFORM_OVERLOAD_THRESHOLD = 8;

export type SteerMismatchCode =
  | 'bet_without_team'
  | 'bet_without_kill_criteria'
  | 'platform_overload'
  | 'team_without_bet'
  | 'orphan_outcome';

export type SteerMismatchSeverity = 'error' | 'warning';

export type SteerMismatch = {
  code: SteerMismatchCode;
  severity: SteerMismatchSeverity;
  title: string;
  headline: string;
  relatedTeamIds?: string[];
  relatedBetIds?: string[];
  relatedOutcomeIds?: string[];
};

export type DetectMismatchesOptions = {
  platformOverloadThreshold?: number;
};

export function detectSteerSpecMismatches(
  doc: SteerSpec,
  options?: DetectMismatchesOptions,
): SteerMismatch[] {
  const threshold = options?.platformOverloadThreshold ?? DEFAULT_PLATFORM_OVERLOAD_THRESHOLD;
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
  }

  for (const outcome of doc.spec.outcomes) {
    const betCount = doc.spec.bets.filter((bet) => bet.outcomeId === outcome.id).length;
    if (betCount === 0) {
      mismatches.push({
        code: 'orphan_outcome',
        severity: 'warning',
        title: 'Outcome with no bets',
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
        headline: `“${team.displayName}” has ${dependents.length} teams using it as a service — a cognitive-load and flow risk for those dependents, not a headcount problem.`,
        relatedTeamIds: [team.id, ...dependents.map((item) => item.fromTeamId)],
      });
    }
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
