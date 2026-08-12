import { TEAM_SIZE_GUIDANCE } from '../teamTopologies/vocabulary';
import type { AnalysisOptions } from './types';

/** Defaults for the analysis engine - soft steering cues, not HR policy. */
export const ANALYSIS_DEFAULTS = {
  platformOverloadThreshold: 8,
  teamSizeThreshold: TEAM_SIZE_GUIDANCE.oversizedThreshold,
  /** Paths at ~9 people: elevated chatter before the Dunbar size caution. */
  teamChatterPathsThreshold: 36,
  /** Concurrent collaboration / facilitation edges (external chatter). */
  teamChatterRelationshipThreshold: 5,
  teamBreadthStreamThreshold: 2,
  teamBreadthDomainThreshold: 2,
} as const satisfies Required<AnalysisOptions>;

export function resolveAnalysisOptions(options?: AnalysisOptions): Required<AnalysisOptions> {
  return {
    platformOverloadThreshold:
      options?.platformOverloadThreshold ?? ANALYSIS_DEFAULTS.platformOverloadThreshold,
    teamSizeThreshold: options?.teamSizeThreshold ?? ANALYSIS_DEFAULTS.teamSizeThreshold,
    teamChatterPathsThreshold:
      options?.teamChatterPathsThreshold ?? ANALYSIS_DEFAULTS.teamChatterPathsThreshold,
    teamChatterRelationshipThreshold:
      options?.teamChatterRelationshipThreshold ??
      ANALYSIS_DEFAULTS.teamChatterRelationshipThreshold,
    teamBreadthStreamThreshold:
      options?.teamBreadthStreamThreshold ?? ANALYSIS_DEFAULTS.teamBreadthStreamThreshold,
    teamBreadthDomainThreshold:
      options?.teamBreadthDomainThreshold ?? ANALYSIS_DEFAULTS.teamBreadthDomainThreshold,
  };
}

export function communicationPaths(memberCount: number): number {
  if (memberCount < 2) return 0;
  return (memberCount * (memberCount - 1)) / 2;
}
