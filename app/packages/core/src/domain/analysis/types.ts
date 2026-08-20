/**
 * SteerCo analysis engine - recommendation sets over a SteerSpec.
 * Team advice is the first family; portfolio (LVT) advice shares the same report shape.
 */

export const ADVICE_FAMILIES = ['team', 'portfolio'] as const;

export type AdviceFamily = (typeof ADVICE_FAMILIES)[number];

export type AdviceSeverity = 'error' | 'warning' | 'info';

export type AdviceRecommendation = {
  /** Stable code for tests, Technical mode, and future policy. */
  code: string;
  family: AdviceFamily;
  severity: AdviceSeverity;
  title: string;
  headline: string;
  /** Short teaching line for UI / board packs. */
  rationale?: string;
  relatedTeamIds?: string[];
  relatedBetIds?: string[];
  relatedOutcomeIds?: string[];
  relatedStreamIds?: string[];
  relatedDomainIds?: string[];
  /** Optional numeric evidence (size, path count, breadth). */
  metrics?: Record<string, number>;
};

export type AnalysisReport = {
  teams: AdviceRecommendation[];
  portfolio: AdviceRecommendation[];
  /** Flat list: portfolio then teams (stable order for CI diffs). */
  all: AdviceRecommendation[];
};

export type AnalysisOptions = {
  /** Platform XaaS dependent count before platform_overload. */
  platformOverloadThreshold?: number;
  /** Recorded member count before team_size advice. */
  teamSizeThreshold?: number;
  /** Within-team communication paths n(n-1)/2 before team_chatter. */
  teamChatterPathsThreshold?: number;
  /** Concurrent collaboration/facilitation edges before external chatter. */
  teamChatterRelationshipThreshold?: number;
  /** Stream count on one team before team_breadth. */
  teamBreadthStreamThreshold?: number;
  /** Distinct domains spanned via streams before team_breadth. */
  teamBreadthDomainThreshold?: number;
};
