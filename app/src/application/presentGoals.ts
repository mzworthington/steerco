import type { SteerSpec } from '@steerco/core';
import {
  presentBetStatus,
  type ExecutiveBetStatus,
  type SteeringBetCard,
} from './presentSteeringOverview';

export type GoalMeasure = {
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

export type GoalBetRow = {
  id: string;
  title: string;
  progressCue: string;
  statusLabel: ExecutiveBetStatus;
  statusTone: SteeringBetCard['statusTone'];
};

export type GoalSection = {
  id: string;
  title: string;
  summary: string | null;
  statusLabel: string;
  measures: GoalMeasure[];
  bets: GoalBetRow[];
};

export type GoalProductCard = {
  id: string;
  title: string;
  problem: string;
  customers: string | null;
  nonGoals: string | null;
  outcomeIds: string[];
  outcomeTitles: string[];
  betIds: string[];
  betLinks: Array<{ id: string; title: string }>;
};

export type GoalsModel = {
  workspaceTitle: string;
  framingLine: string;
  outcomes: GoalSection[];
  products: GoalProductCard[];
};

export type GoalMetricEditInput = {
  current: string;
  target: string;
};

export type GoalMetricEditResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

export type ProductDraft = {
  id?: string;
  title: string;
  problem: string;
  customers: string;
  nonGoals: string;
  outcomeIds: string[];
  betIds: string[];
};

export type ApplyProductResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

export function presentGoals(spec: SteerSpec): GoalsModel {
  const outcomeTitleById = new Map(spec.spec.outcomes.map((item) => [item.id, item.title]));
  const betTitleById = new Map(spec.spec.bets.map((item) => [item.id, item.title]));

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    framingLine: 'Measures of success for this goal - not a status dashboard.',
    outcomes: spec.spec.outcomes.map((outcome) => {
      const outcomeBets = spec.spec.bets.filter((bet) => bet.outcomeId === outcome.id);
      return {
        id: outcome.id,
        title: outcome.title,
        summary: outcome.summary ?? null,
        statusLabel: presentGoalStatus(outcome.status),
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
    products: (spec.spec.products ?? []).map((product) => ({
      id: product.id,
      title: product.title,
      problem: product.problem,
      customers: product.customers?.trim() || null,
      nonGoals: product.nonGoals?.trim() || null,
      outcomeIds: [...product.outcomeIds],
      outcomeTitles: product.outcomeIds
        .map((id) => outcomeTitleById.get(id))
        .filter((title): title is string => Boolean(title)),
      betIds: [...product.betIds],
      betLinks: product.betIds
        .map((id) => {
          const title = betTitleById.get(id);
          return title ? { id, title } : null;
        })
        .filter((link): link is { id: string; title: string } => Boolean(link)),
    })),
  };
}

export function validateGoalMetricEdit(
  input: GoalMetricEditInput,
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

/** Add or update a lightweight product brief (product mindset, not requirements). */
export function applyProductDraft(spec: SteerSpec, draft: ProductDraft): ApplyProductResult {
  const title = draft.title.trim();
  const problem = draft.problem.trim();
  if (!title) {
    return { ok: false, error: 'Give the product brief a short title.' };
  }
  if (!problem) {
    return { ok: false, error: 'Describe the customer problem this product addresses.' };
  }

  const knownOutcomes = new Set(spec.spec.outcomes.map((item) => item.id));
  const knownBets = new Set(spec.spec.bets.map((item) => item.id));
  const outcomeIds = draft.outcomeIds.filter((id) => knownOutcomes.has(id));
  const betIds = draft.betIds.filter((id) => knownBets.has(id));
  const customers = draft.customers.trim() || undefined;
  const nonGoals = draft.nonGoals.trim() || undefined;
  const products = [...(spec.spec.products ?? [])];
  const existingIndex = draft.id ? products.findIndex((item) => item.id === draft.id) : -1;

  if (existingIndex >= 0) {
    const current = products[existingIndex];
    if (!current) {
      return { ok: false, error: 'That product brief is not in the open workspace.' };
    }
    products[existingIndex] = {
      ...current,
      title,
      problem,
      customers,
      nonGoals,
      outcomeIds,
      betIds,
    };
  } else {
    const id =
      draft.id?.trim() ||
      uniqueProductId(
        title,
        products.map((item) => item.id),
      );
    products.push({
      id,
      title,
      problem,
      customers,
      nonGoals,
      outcomeIds,
      betIds,
    });
  }

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        products,
      },
    },
  };
}

function uniqueProductId(seed: string, existing: string[]): string {
  const base =
    'prod_' +
    seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);
  if (!existing.includes(base)) return base || `prod_${existing.length + 1}`;
  let n = 2;
  while (existing.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
}

export function applyGoalMetricEdit(
  spec: SteerSpec,
  outcomeId: string,
  metricId: string,
  input: GoalMetricEditInput,
): GoalMetricEditResult {
  const parsed = validateGoalMetricEdit(input);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const outcomeIndex = spec.spec.outcomes.findIndex((item) => item.id === outcomeId);
  if (outcomeIndex < 0) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }
  const outcome = spec.spec.outcomes[outcomeIndex];
  if (!outcome) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }

  const metricIndex = outcome.metrics.findIndex((item) => item.id === metricId);
  if (metricIndex < 0) {
    return { ok: false, error: 'That measure is not on this goal.' };
  }
  const metric = outcome.metrics[metricIndex];
  if (!metric) {
    return { ok: false, error: 'That measure is not on this goal.' };
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
): GoalMeasure {
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

function presentGoalStatus(status: SteerSpec['spec']['outcomes'][number]['status']): string {
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
