import type { SteerSpec } from '@steerlens/core';

export type ExecutiveBetStatus = 'On track' | 'At risk' | 'Stop' | 'Proposed' | 'Done';

export type SteeringBetCard = {
  id: string;
  title: string;
  metricCue: string;
  status: ExecutiveBetStatus;
  statusTone: 'on-track' | 'at-risk' | 'stop' | 'neutral';
};

export type SteeringOutcomeGroup = {
  id: string;
  title: string;
  summary: string | null;
  bets: SteeringBetCard[];
};

export type SteeringOverviewModel = {
  workspaceTitle: string;
  periodLabel: string;
  vision: string;
  alignmentSummary: string;
  mismatchSummary: string | null;
  decisionNotesSummary: string | null;
  /** Soonest review horizon across funded bets (Slice 1.5). */
  nextReviewSummary: string | null;
  decisionNotes: Array<{ id: string; title: string; recommendationLabel: string }>;
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

  const outcomes = spec.spec.outcomes.map((outcome) => ({
    id: outcome.id,
    title: outcome.title,
    summary: outcome.summary ?? null,
    bets: bets
      .filter((bet) => bet.outcomeId === outcome.id)
      .map((bet) => {
        const presented = presentBetStatus(bet.status);
        return {
          id: bet.id,
          title: bet.title,
          metricCue: bet.successSignal,
          status: presented.label,
          statusTone: presented.tone,
        };
      })
      .sort((a, b) => STATUS_SORT[a.statusTone] - STATUS_SORT[b.statusTone]),
  }));

  const decisionNotes = spec.spec.decisionNotes.map((note) => ({
    id: note.id,
    title: note.title,
    recommendationLabel: recommendationLabel(note.recommendation),
  }));

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    periodLabel: options?.periodLabel ?? 'Local workspace',
    vision: spec.spec.vision,
    alignmentSummary: buildAlignmentSummary(bets.length, statusCounts.stop),
    mismatchSummary: buildMismatchSummary(statusCounts),
    decisionNotesSummary: buildDecisionNotesSummary(decisionNotes),
    nextReviewSummary: buildNextReviewSummary(bets),
    decisionNotes,
    outcomes,
    statusCounts,
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
