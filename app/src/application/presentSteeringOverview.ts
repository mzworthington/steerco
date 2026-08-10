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
  outcomes: SteeringOutcomeGroup[];
  statusCounts: {
    onTrack: number;
    atRisk: number;
    stop: number;
  };
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
      }),
  }));

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    periodLabel: options?.periodLabel ?? 'Local workspace',
    vision: spec.spec.vision,
    alignmentSummary: buildAlignmentSummary(bets.length, statusCounts.stop),
    mismatchSummary: buildMismatchSummary(statusCounts),
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
  const stopLabel =
    stopCount === 1 ? 'One recommended to stop' : `${spellCount(stopCount)} recommended to stop`;
  return `${betsLabel}. ${stopLabel}.`;
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
