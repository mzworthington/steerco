import type { SteerSpec } from '@steerlens/core';
import {
  presentBetStatus,
  type ExecutiveBetStatus,
  type SteeringBetCard,
} from './presentSteeringOverview';

export type OutcomesMeasure = {
  id: string;
  title: string;
  unit: string | null;
  current: number | null;
  baseline: number | null;
  target: number | null;
  displayValue: string;
  interpretation: string;
  textAlternative: string;
  claimedByBets: Array<{ id: string; title: string }>;
};

export type OutcomesBetRow = {
  id: string;
  title: string;
  progressCue: string;
  statusLabel: ExecutiveBetStatus;
  statusTone: SteeringBetCard['statusTone'];
};

export type OutcomesSection = {
  id: string;
  title: string;
  summary: string | null;
  statusLabel: string;
  measures: OutcomesMeasure[];
  bets: OutcomesBetRow[];
};

export type OutcomesModel = {
  workspaceTitle: string;
  framingLine: string;
  outcomes: OutcomesSection[];
};

export type OutcomeMetricEditInput = {
  current: string;
  target: string;
};

export type OutcomeMetricEditResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

export function presentOutcomes(spec: SteerSpec): OutcomesModel {
  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    framingLine: 'Measures of success for this outcome - not a status dashboard.',
    outcomes: spec.spec.outcomes.map((outcome) => {
      const outcomeBets = spec.spec.bets.filter((bet) => bet.outcomeId === outcome.id);
      return {
        id: outcome.id,
        title: outcome.title,
        summary: outcome.summary ?? null,
        statusLabel: presentOutcomeStatus(outcome.status),
        measures: outcome.metrics.map((metric) =>
          presentMeasure(metric, betsClaimingMetric(outcomeBets, metric.id)),
        ),
        bets: outcomeBets.map((bet) => {
          const status = presentBetStatus(bet.status);
          return {
            id: bet.id,
            title: bet.title,
            progressCue: bet.successSignal,
            statusLabel: status.label,
            statusTone: status.tone,
          };
        }),
      };
    }),
  };
}

export function validateOutcomeMetricEdit(
  input: OutcomeMetricEditInput,
): { ok: true; current: number | null; target: number | null } | { ok: false; error: string } {
  const current = parseOptionalNumber(input.current);
  if (!current.ok) {
    return { ok: false, error: 'Current value must be a number, or left blank.' };
  }
  const target = parseOptionalNumber(input.target);
  if (!target.ok) {
    return { ok: false, error: 'Target value must be a number, or left blank.' };
  }
  return { ok: true, current: current.value, target: target.value };
}

export function applyOutcomeMetricEdit(
  spec: SteerSpec,
  outcomeId: string,
  metricId: string,
  input: OutcomeMetricEditInput,
): OutcomeMetricEditResult {
  const parsed = validateOutcomeMetricEdit(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const outcomeIndex = spec.spec.outcomes.findIndex((item) => item.id === outcomeId);
  if (outcomeIndex < 0) {
    return { ok: false, error: 'That outcome is not in the open workspace.' };
  }
  const outcome = spec.spec.outcomes[outcomeIndex];
  if (!outcome) {
    return { ok: false, error: 'That outcome is not in the open workspace.' };
  }

  const metricIndex = outcome.metrics.findIndex((item) => item.id === metricId);
  if (metricIndex < 0) {
    return { ok: false, error: 'That measure is not on this outcome.' };
  }
  const metric = outcome.metrics[metricIndex];
  if (!metric) {
    return { ok: false, error: 'That measure is not on this outcome.' };
  }

  const nextMetrics = [...outcome.metrics];
  nextMetrics[metricIndex] = {
    ...metric,
    current: parsed.current,
    target: parsed.target,
  };

  const nextOutcomes = [...spec.spec.outcomes];
  nextOutcomes[outcomeIndex] = {
    ...outcome,
    metrics: nextMetrics,
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        outcomes: nextOutcomes,
      },
    },
  };
}

function betsClaimingMetric(
  bets: SteerSpec['spec']['bets'],
  metricId: string,
): Array<{ id: string; title: string }> {
  return bets
    .filter((bet) => {
      if (bet.primaryMetricId === metricId) return true;
      return (bet.metricIds ?? []).includes(metricId);
    })
    .map((bet) => ({ id: bet.id, title: bet.title }));
}

function presentMeasure(
  metric: {
    id: string;
    title: string;
    unit?: string;
    current?: number | null;
    baseline?: number | null;
    target?: number | null;
    interpretation?: string;
  },
  claimedByBets: Array<{ id: string; title: string }>,
): OutcomesMeasure {
  const unit = metric.unit ?? null;
  const current = typeof metric.current === 'number' ? metric.current : null;
  const baseline = typeof metric.baseline === 'number' ? metric.baseline : null;
  const target = typeof metric.target === 'number' ? metric.target : null;
  const displayValue = current === null ? '-' : formatMeasureNumber(current, unit ?? undefined);
  const interpretation =
    metric.interpretation?.trim() ||
    buildInterpretation({ title: metric.title, current, baseline, target, unit });
  const textAlternative = [
    metric.title,
    displayValue === '-' ? 'no current value' : `current ${displayValue}`,
    target === null ? null : `target ${formatMeasureNumber(target, unit ?? undefined)}`,
    interpretation,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    id: metric.id,
    title: metric.title,
    unit,
    current,
    baseline,
    target,
    displayValue,
    interpretation,
    textAlternative,
    claimedByBets,
  };
}

function buildInterpretation(input: {
  title: string;
  current: number | null;
  baseline: number | null;
  target: number | null;
  unit: string | null;
}): string {
  if (input.current === null) {
    return `No current reading yet for ${input.title}.`;
  }
  if (input.target !== null) {
    if (input.current === input.target) {
      return `At the target of ${formatMeasureNumber(input.target, input.unit ?? undefined)}.`;
    }
    const direction = input.current < input.target ? 'short of' : 'ahead of';
    return `${formatMeasureNumber(input.current, input.unit ?? undefined)} is ${direction} the target of ${formatMeasureNumber(input.target, input.unit ?? undefined)}.`;
  }
  if (input.baseline !== null) {
    return `Moved from ${formatMeasureNumber(input.baseline, input.unit ?? undefined)} to ${formatMeasureNumber(input.current, input.unit ?? undefined)}.`;
  }
  return `Current reading for ${input.title}.`;
}

function presentOutcomeStatus(status: SteerSpec['spec']['outcomes'][number]['status']): string {
  switch (status) {
    case 'on_track':
      return 'On track';
    case 'at_risk':
      return 'At risk';
    case 'achieved':
      return 'Achieved';
    case 'abandoned':
      return 'Abandoned';
  }
}

function parseOptionalNumber(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false };
  return { ok: true, value };
}

function formatMeasureNumber(value: number, unit?: string): string {
  const rendered = Number.isInteger(value) ? String(value) : String(value);
  if (!unit) return rendered;
  if (unit === 'percent') return `${rendered}%`;
  return `${rendered} ${unit}`;
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
