import type { SteerSpec } from '../steerSpec/steerSpecSchema';
import type { AdviceRecommendation } from './types';

/** Bet statuses considered "active" for MoS-link advice. */
const ACTIVE_BET_STATUSES = new Set(['on_track', 'at_risk', 'stop_ready']);

/**
 * Portfolio / LVT advice family - goals, bets, MoS links.
 * Extensible home for future goal fitness and investment recommendations.
 */
export function analyzePortfolioAdvice(doc: SteerSpec): AdviceRecommendation[] {
  const advice: AdviceRecommendation[] = [];

  for (const bet of doc.spec.bets) {
    if (bet.fundedTeamIds.length === 0) {
      advice.push({
        code: 'bet_without_team',
        family: 'portfolio',
        severity: 'error',
        title: 'Bet without a delivering team',
        headline: `“${bet.title}” has no funded teams yet.`,
        relatedBetIds: [bet.id],
      });
    }
    if (!bet.killCriteria.trim()) {
      advice.push({
        code: 'bet_without_kill_criteria',
        family: 'portfolio',
        severity: 'error',
        title: 'Bet without kill criteria',
        headline: `“${bet.title}” needs kill criteria before a stop decision is fair.`,
        relatedBetIds: [bet.id],
      });
    }
    const hasMosLink = bet.metricIds.length > 0 || Boolean(bet.primaryMetricId);
    if (ACTIVE_BET_STATUSES.has(bet.status) && !hasMosLink) {
      advice.push({
        code: 'bet_without_mos_link',
        family: 'portfolio',
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
      advice.push({
        code: 'orphan_outcome',
        family: 'portfolio',
        severity: 'warning',
        title: 'Goal with no bets',
        headline: `“${outcome.title}” has no funded bets yet.`,
        relatedOutcomeIds: [outcome.id],
      });
    }
  }

  return advice;
}
