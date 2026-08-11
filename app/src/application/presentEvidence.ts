import type { SteerSpec } from '@steerco/core';
import {
  applyGoalMetricEdit,
  validateGoalMetricEdit,
  type GoalMetricEditInput,
} from './presentGoals';

export type EvidenceSourceKind = 'sample' | 'manual' | 'github' | 'other';

export type EvidenceCard = {
  metricId: string;
  outcomeId: string;
  outcomeTitle: string;
  title: string;
  unit: string | null;
  current: number | null;
  target: number | null;
  displayValue: string;
  /** Learning cue - shown before / above the figure framing. */
  learning: string;
  measuredLine: string;
  source: EvidenceSourceKind;
  sourceLabel: string;
  evidenceNote: string | null;
  textAlternative: string;
};

export type EvidenceOutcomeOption = {
  id: string;
  title: string;
};

export type EvidenceModel = {
  workspaceTitle: string;
  framingLine: string;
  sampleBanner: string;
  cards: EvidenceCard[];
  outcomeOptions: EvidenceOutcomeOption[];
  allMeasuredLines: string[];
};

export type EvidenceMetricEditInput = GoalMetricEditInput;

export type AddEvidenceInput = {
  outcomeId: string;
  title: string;
  unit?: string;
  current: string;
  target: string;
  interpretation?: string;
  note?: string;
};

export type AddEvidenceResult =
  { ok: true; value: SteerSpec; metricId: string } | { ok: false; error: string };

export function presentEvidence(spec: SteerSpec): EvidenceModel {
  const evidenceByMetric = new Map(
    spec.spec.evidence
      .filter((item) => item.metricId)
      .map((item) => [item.metricId as string, item] as const),
  );

  const cards: EvidenceCard[] = [];
  for (const outcome of spec.spec.outcomes) {
    for (const metric of outcome.metrics) {
      const evidence = evidenceByMetric.get(metric.id);
      const unit = metric.unit ?? null;
      const current = typeof metric.current === 'number' ? metric.current : null;
      const target = typeof metric.target === 'number' ? metric.target : null;
      const displayValue = current === null ? '-' : formatMeasureNumber(current, unit ?? undefined);
      const learning =
        metric.interpretation?.trim() ||
        buildLearning({ title: metric.title, current, target, unit });
      const source: EvidenceSourceKind = evidence?.source ?? 'manual';
      const measuredLine = `${metric.title}: ${learning}`;
      cards.push({
        metricId: metric.id,
        outcomeId: outcome.id,
        outcomeTitle: outcome.title,
        title: metric.title,
        unit,
        current,
        target,
        displayValue,
        learning,
        measuredLine,
        source,
        sourceLabel: sourceLabel(source),
        evidenceNote: evidence?.note?.trim() || null,
        textAlternative: [
          metric.title,
          displayValue === '-' ? 'no current value' : `current ${displayValue}`,
          learning,
        ].join('. '),
      });
    }
  }

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    framingLine: 'What we learned from the numbers - lead with the cue, not the vanity figure.',
    sampleBanner: 'Sample data · connect systems later',
    cards,
    outcomeOptions: spec.spec.outcomes.map((outcome) => ({
      id: outcome.id,
      title: outcome.title,
    })),
    allMeasuredLines: cards.map((card) => card.measuredLine),
  };
}

export function applyEvidenceMetricEdit(
  spec: SteerSpec,
  outcomeId: string,
  metricId: string,
  input: EvidenceMetricEditInput,
) {
  return applyGoalMetricEdit(spec, outcomeId, metricId, input);
}

/** Add a measure of success on a goal plus a manual evidence provenance row. */
export function applyAddEvidence(spec: SteerSpec, input: AddEvidenceInput): AddEvidenceResult {
  const title = collapseWhitespace(input.title);
  if (!title) {
    return { ok: false, error: 'Give the measure a short title.' };
  }

  if (spec.spec.outcomes.length === 0) {
    return { ok: false, error: 'Add a goal on Goals before recording evidence.' };
  }

  const outcomeIndex = spec.spec.outcomes.findIndex((item) => item.id === input.outcomeId);
  if (outcomeIndex < 0) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }
  const outcome = spec.spec.outcomes[outcomeIndex];
  if (!outcome) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }

  const parsed = validateGoalMetricEdit({
    current: input.current,
    target: input.target,
  });
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const unit = collapseWhitespace(input.unit ?? '');
  const interpretation = collapseWhitespace(input.interpretation ?? '');
  const note = collapseWhitespace(input.note ?? '');
  const metricId = uniqueMetricId(spec, title);
  const evidenceId = uniqueEvidenceId(spec, title);

  const nextMetrics = [
    ...outcome.metrics,
    {
      id: metricId,
      title,
      ...(unit ? { unit } : {}),
      current: parsed.current,
      target: parsed.target,
      ...(interpretation ? { interpretation } : {}),
    },
  ];

  const nextOutcomes = [...spec.spec.outcomes];
  nextOutcomes[outcomeIndex] = {
    ...outcome,
    metrics: nextMetrics,
  };

  return {
    ok: true,
    metricId,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        outcomes: nextOutcomes,
        evidence: [
          ...spec.spec.evidence,
          {
            id: evidenceId,
            metricId,
            source: 'manual' as const,
            ...(note ? { note } : {}),
          },
        ],
      },
    },
  };
}

function uniqueMetricId(spec: SteerSpec, title: string): string {
  const existing = new Set(
    spec.spec.outcomes.flatMap((outcome) => outcome.metrics.map((metric) => metric.id)),
  );
  const base = `met_${slugify(title)}`;
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function uniqueEvidenceId(spec: SteerSpec, title: string): string {
  const existing = new Set(spec.spec.evidence.map((item) => item.id));
  const base = `ev_${slugify(title)}`;
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
  return slug || 'measure';
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function sourceLabel(source: EvidenceSourceKind): string {
  switch (source) {
    case 'sample':
      return 'Sample';
    case 'manual':
      return 'Manual';
    case 'github':
      return 'GitHub';
    case 'other':
      return 'Other';
  }
}

function buildLearning(input: {
  title: string;
  current: number | null;
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
  return `Current reading for ${input.title}.`;
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
