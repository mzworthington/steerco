import { detectSteerSpecMismatches, type SteerSpec } from '@steerco/core';

export type ExecutiveBetStatus = 'On track' | 'At risk' | 'Stop' | 'Proposed' | 'Done';

export type SteeringBetCard = {
  id: string;
  title: string;
  metricCue: string;
  status: ExecutiveBetStatus;
  statusTone: 'on-track' | 'at-risk' | 'stop' | 'neutral';
  /** Dense portfolio stack position (1 = highest priority), or null when unranked. */
  valueRank: number | null;
  outcomeId: string;
  outcomeTitle: string;
  kind: string | null;
  fundingStance: string | null;
};

export type SteeringOutcomeGroup = {
  id: string;
  title: string;
  summary: string | null;
  bets: SteeringBetCard[];
};

export type SteeringPortfolioMix = {
  byKind: { opportunity: number; capability: number; unset: number };
  byFundingStance: { explore: number; exploit: number; sustain: number; unset: number };
  hint: string;
};

export type SteeringOverviewModel = {
  workspaceTitle: string;
  periodLabel: string;
  vision: string;
  alignmentSummary: string;
  mismatchSummary: string | null;
  /** Topology / WIP mismatches from detectSteerSpecMismatches (calm summary). */
  wipMismatchSummary: string | null;
  wipMismatchCount: number;
  portfolioMix: SteeringPortfolioMix;
  decisionNotesSummary: string | null;
  /** Soonest review horizon across funded bets (Slice 1.5). */
  nextReviewSummary: string | null;
  decisionNotes: Array<{ id: string; title: string; recommendationLabel: string }>;
  /** Portfolio priority stack (highest value first). Drag order persists as dense valueRank. */
  valueStack: SteeringBetCard[];
  outcomes: SteeringOutcomeGroup[];
  statusCounts: {
    onTrack: number;
    atRisk: number;
    stop: number;
  };
};

const STATUS_SORT: Record<SteeringBetCard['statusTone'], number> = {
  stop: 0,
  'at-risk': 1,
  'on-track': 2,
  neutral: 3,
};

export function presentSteeringOverview(
  spec: SteerSpec,
  options?: { periodLabel?: string },
): SteeringOverviewModel {
  const bets = spec.spec.bets;
  const statusCounts = { onTrack: 0, atRisk: 0, stop: 0 };

  for (const bet of bets) {
    const presented = presentBetStatus(bet.status);
    if (presented.tone === 'on-track') statusCounts.onTrack += 1;
    if (presented.tone === 'at-risk') statusCounts.atRisk += 1;
    if (presented.tone === 'stop') statusCounts.stop += 1;
  }

  const outcomeTitleById = new Map(
    spec.spec.outcomes.map((outcome) => [outcome.id, outcome.title]),
  );

  const toCard = (bet: SteerSpec['spec']['bets'][number]): SteeringBetCard => {
    const presented = presentBetStatus(bet.status);
    return {
      id: bet.id,
      title: bet.title,
      metricCue: bet.successSignal,
      status: presented.label,
      statusTone: presented.tone,
      valueRank: typeof bet.valueRank === 'number' ? bet.valueRank : null,
      outcomeId: bet.outcomeId,
      outcomeTitle: outcomeTitleById.get(bet.outcomeId) ?? bet.outcomeId,
      kind: bet.kind ?? null,
      fundingStance: bet.fundingStance ?? null,
    };
  };

  const outcomes = spec.spec.outcomes.map((outcome) => ({
    id: outcome.id,
    title: outcome.title,
    summary: outcome.summary ?? null,
    bets: bets
      .filter((bet) => bet.outcomeId === outcome.id)
      .map(toCard)
      .sort((a, b) => {
        const rankA = a.valueRank ?? Number.POSITIVE_INFINITY;
        const rankB = b.valueRank ?? Number.POSITIVE_INFINITY;
        if (rankA !== rankB) return rankA - rankB;
        return STATUS_SORT[a.statusTone] - STATUS_SORT[b.statusTone];
      }),
  }));

  const valueStack = [...bets].map(toCard).sort((a, b) => {
    const rankA = a.valueRank ?? Number.POSITIVE_INFINITY;
    const rankB = b.valueRank ?? Number.POSITIVE_INFINITY;
    if (rankA !== rankB) return rankA - rankB;
    return STATUS_SORT[a.statusTone] - STATUS_SORT[b.statusTone];
  });

  const decisionNotes = spec.spec.decisionNotes.map((note) => ({
    id: note.id,
    title: note.title,
    recommendationLabel: recommendationLabel(note.recommendation),
  }));

  const topologyMismatches = detectSteerSpecMismatches(spec);
  const portfolioMix = buildPortfolioMix(bets);

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    periodLabel: options?.periodLabel ?? 'Local workspace',
    vision: spec.spec.vision,
    alignmentSummary: buildAlignmentSummary(bets.length, statusCounts.stop),
    mismatchSummary: buildMismatchSummary(statusCounts),
    wipMismatchSummary: buildWipMismatchSummary(topologyMismatches.length),
    wipMismatchCount: topologyMismatches.length,
    portfolioMix,
    decisionNotesSummary: buildDecisionNotesSummary(decisionNotes),
    nextReviewSummary: buildNextReviewSummary(bets),
    decisionNotes,
    valueStack,
    outcomes,
    statusCounts,
  };
}

export type ReorderBetValueStackResult =
  { ok: true; value: SteerSpec } | { ok: false; error: string };

/**
 * Persist a portfolio value stack from drag order (first id = highest priority).
 * Rewrites dense valueRank 1..n for the ordered ids; clears rank on bets omitted from the list.
 */
export function reorderBetValueStack(
  spec: SteerSpec,
  orderedBetIds: string[],
): ReorderBetValueStackResult {
  const knownIds = new Set(spec.spec.bets.map((bet) => bet.id));
  if (orderedBetIds.length !== new Set(orderedBetIds).size) {
    return { ok: false, error: 'Stack order cannot list the same bet twice.' };
  }
  for (const betId of orderedBetIds) {
    if (!knownIds.has(betId)) {
      return { ok: false, error: 'That bet is not in the open workspace.' };
    }
  }

  const rankById = new Map(orderedBetIds.map((id, position) => [id, position + 1]));
  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        bets: spec.spec.bets.map((bet) => {
          const nextRank = rankById.get(bet.id);
          if (nextRank === undefined) {
            if (bet.valueRank === undefined) return bet;
            return { ...bet, valueRank: undefined };
          }
          return { ...bet, valueRank: nextRank };
        }),
      },
    },
  };
}

export function presentBetStatus(status: SteerSpec['spec']['bets'][number]['status']): {
  label: ExecutiveBetStatus;
  tone: SteeringBetCard['statusTone'];
} {
  switch (status) {
    case 'on_track':
      return { label: 'On track', tone: 'on-track' };
    case 'at_risk':
      return { label: 'At risk', tone: 'at-risk' };
    case 'stop_ready':
    case 'stopped':
      return { label: 'Stop', tone: 'stop' };
    case 'proposed':
      return { label: 'Proposed', tone: 'neutral' };
    case 'done':
      return { label: 'Done', tone: 'neutral' };
  }
}

function buildAlignmentSummary(betCount: number, stopCount: number): string {
  const betsLabel = betCount === 1 ? 'One bet funded' : `${spellCount(betCount)} bets funded`;
  if (stopCount === 0) {
    return `${betsLabel}.`;
  }
  // Elevate stop-ready before vanity “funded” counts (Slice 1 operating-model bar).
  const stopLabel =
    stopCount === 1 ? 'One recommended to stop' : `${spellCount(stopCount)} recommended to stop`;
  return `${stopLabel}. ${betsLabel}.`;
}

function buildDecisionNotesSummary(notes: Array<{ recommendationLabel: string }>): string | null {
  if (notes.length === 0) return null;
  const stops = notes.filter((note) => note.recommendationLabel === 'Stop').length;
  if (stops === 0) {
    return notes.length === 1
      ? 'One decision note ready.'
      : `${notes.length} decision notes ready.`;
  }
  if (stops === notes.length) {
    return stops === 1
      ? 'One stop recommendation ready for the board.'
      : `${stops} stop recommendations ready for the board.`;
  }
  return `${notes.length} decision notes · ${stops} recommend stop.`;
}

function recommendationLabel(
  recommendation: SteerSpec['spec']['decisionNotes'][number]['recommendation'],
): string {
  switch (recommendation) {
    case 'start':
      return 'Start';
    case 'continue':
      return 'Continue';
    case 'stop':
      return 'Stop';
    case 'rescope':
      return 'Re-scope';
  }
}

function buildNextReviewSummary(bets: SteerSpec['spec']['bets']): string | null {
  const dated = bets
    .filter((bet) => bet.reviewDate || bet.horizon)
    .map((bet) => ({
      title: bet.title,
      reviewDate: bet.reviewDate ?? null,
      horizon: bet.horizon ?? null,
    }))
    .sort((a, b) => {
      if (a.reviewDate && b.reviewDate) return a.reviewDate.localeCompare(b.reviewDate);
      if (a.reviewDate) return -1;
      if (b.reviewDate) return 1;
      return a.title.localeCompare(b.title);
    });
  const soonest = dated[0];
  if (!soonest) return null;
  if (soonest.reviewDate && soonest.horizon) {
    return `Next review: ${soonest.horizon} (${soonest.reviewDate}) · ${soonest.title}`;
  }
  if (soonest.reviewDate) {
    return `Next review: ${soonest.reviewDate} · ${soonest.title}`;
  }
  return `Next review: ${soonest.horizon} · ${soonest.title}`;
}

function buildMismatchSummary(counts: SteeringOverviewModel['statusCounts']): string | null {
  if (counts.stop === 0 && counts.atRisk === 0) {
    return null;
  }
  const parts: string[] = [];
  if (counts.atRisk > 0) {
    parts.push(counts.atRisk === 1 ? '1 bet at risk' : `${counts.atRisk} bets at risk`);
  }
  if (counts.stop > 0) {
    parts.push(counts.stop === 1 ? '1 bet ready to stop' : `${counts.stop} bets ready to stop`);
  }
  return parts.join(' · ');
}

function buildWipMismatchSummary(count: number): string | null {
  if (count === 0) return null;
  return count === 1
    ? '1 topology cue worth a calm look (Technical → Fitness).'
    : `${count} topology cues worth a calm look (Technical → Fitness).`;
}

function buildPortfolioMix(bets: SteerSpec['spec']['bets']): SteeringPortfolioMix {
  const byKind = { opportunity: 0, capability: 0, unset: 0 };
  const byFundingStance = { explore: 0, exploit: 0, sustain: 0, unset: 0 };

  for (const bet of bets) {
    if (bet.kind === 'opportunity') byKind.opportunity += 1;
    else if (bet.kind === 'capability') byKind.capability += 1;
    else byKind.unset += 1;

    if (bet.fundingStance === 'explore') byFundingStance.explore += 1;
    else if (bet.fundingStance === 'exploit') byFundingStance.exploit += 1;
    else if (bet.fundingStance === 'sustain') byFundingStance.sustain += 1;
    else byFundingStance.unset += 1;
  }

  const kindParts = [
    byKind.opportunity > 0 ? `${byKind.opportunity} opportunity` : null,
    byKind.capability > 0 ? `${byKind.capability} capability` : null,
  ].filter(Boolean);
  const stanceParts = [
    byFundingStance.explore > 0 ? `${byFundingStance.explore} explore` : null,
    byFundingStance.exploit > 0 ? `${byFundingStance.exploit} exploit` : null,
    byFundingStance.sustain > 0 ? `${byFundingStance.sustain} sustain` : null,
  ].filter(Boolean);

  const hint =
    kindParts.length === 0 && stanceParts.length === 0
      ? 'Portfolio mix not set yet.'
      : `Portfolio mix: ${[...kindParts, ...stanceParts].join(' · ')}.`;

  return { byKind, byFundingStance, hint };
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function spellCount(n: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  return words[n] ?? String(n);
}
