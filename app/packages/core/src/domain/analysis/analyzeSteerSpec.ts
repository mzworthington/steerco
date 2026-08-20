import type { SteerSpec } from '../steerSpec/steerSpecSchema';
import { analyzePortfolioAdvice } from './portfolioAdvice';
import { analyzeTeamAdvice } from './teamAdvice';
import { resolveAnalysisOptions } from './thresholds';
import type { AnalysisOptions, AnalysisReport, AdviceRecommendation } from './types';

/**
 * Run the SteerCo analysis engine over a SteerSpec.
 * Returns recommendation sets by family (team today; portfolio/LVT extensible).
 */
export function analyzeSteerSpec(doc: SteerSpec, options?: AnalysisOptions): AnalysisReport {
  const resolved = resolveAnalysisOptions(options);
  const portfolio = analyzePortfolioAdvice(doc);
  const teams = analyzeTeamAdvice(doc, resolved);
  return {
    portfolio,
    teams,
    all: [...portfolio, ...teams],
  };
}

/** Map analysis recommendations onto the legacy SteerMismatch shape for existing callers. */
export function adviceToSteerMismatch(item: AdviceRecommendation): {
  code: string;
  severity: 'error' | 'warning';
  title: string;
  headline: string;
  relatedTeamIds?: string[];
  relatedBetIds?: string[];
  relatedOutcomeIds?: string[];
  relatedStreamIds?: string[];
} {
  return {
    code: item.code,
    severity: item.severity === 'info' ? 'warning' : item.severity,
    title: item.title,
    headline: item.rationale ? `${item.headline} ${item.rationale}` : item.headline,
    relatedTeamIds: item.relatedTeamIds,
    relatedBetIds: item.relatedBetIds,
    relatedOutcomeIds: item.relatedOutcomeIds,
    relatedStreamIds: item.relatedStreamIds,
  };
}
