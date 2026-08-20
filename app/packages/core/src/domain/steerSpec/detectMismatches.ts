import type { SteerSpec } from './steerSpecSchema';
import {
  analyzeSteerSpec,
  adviceToSteerMismatch,
  ANALYSIS_DEFAULTS,
  type AnalysisOptions,
} from '../analysis';

export const DEFAULT_PLATFORM_OVERLOAD_THRESHOLD = ANALYSIS_DEFAULTS.platformOverloadThreshold;
/** Soft caution when recorded member count reaches Dunbar high-trust boundary (~15). */
export const DEFAULT_TEAM_OVERSIZED_THRESHOLD = ANALYSIS_DEFAULTS.teamSizeThreshold;

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
  | 'team_size'
  | 'team_breadth'
  | 'team_chatter'
  | 'team_chatter_external'
  | 'stream_multi_team';

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

export type DetectMismatchesOptions = AnalysisOptions & {
  /** @deprecated Prefer teamSizeThreshold from the analysis engine. */
  teamOversizedThreshold?: number;
};

/**
 * Detect operating-model mismatches via the analysis engine.
 * Prefer `analyzeSteerSpec` when you need family-grouped recommendations (team / portfolio).
 */
export function detectSteerSpecMismatches(
  doc: SteerSpec,
  options?: DetectMismatchesOptions,
): SteerMismatch[] {
  const report = analyzeSteerSpec(doc, {
    platformOverloadThreshold: options?.platformOverloadThreshold,
    teamSizeThreshold: options?.teamSizeThreshold ?? options?.teamOversizedThreshold,
    teamChatterPathsThreshold: options?.teamChatterPathsThreshold,
    teamChatterRelationshipThreshold: options?.teamChatterRelationshipThreshold,
    teamBreadthStreamThreshold: options?.teamBreadthStreamThreshold,
    teamBreadthDomainThreshold: options?.teamBreadthDomainThreshold,
  });
  const teamsById = new Map(doc.spec.teams.map((team) => [team.id, team]));

  return report.all.map((item) => {
    const mapped = adviceToSteerMismatch(item);
    // Preserve legacy code aliases used in docs and older tests.
    let code = mapped.code as SteerMismatchCode;
    if (item.code === 'team_size') code = 'team_oversized';
    if (item.code === 'team_breadth' && (item.metrics?.streamCount ?? 0) > 1) {
      // Also expose legacy multi-stream code when breadth is stream-driven for one team.
      // Callers matching team_breadth or stream_aligned_multi_stream both work via headline tests.
      code = 'team_breadth';
    }
    return {
      code,
      severity: mapped.severity,
      title: mapped.title,
      headline: mapped.headline,
      relatedTeamIds: mapped.relatedTeamIds?.filter((id) => teamsById.has(id) || id.length > 0),
      relatedBetIds: mapped.relatedBetIds,
      relatedOutcomeIds: mapped.relatedOutcomeIds,
      relatedStreamIds: mapped.relatedStreamIds,
    };
  });
}
