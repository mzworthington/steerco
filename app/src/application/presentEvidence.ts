import type { SteerSpec } from '@steerco/core';
import { applyOutcomeMetricEdit, type OutcomeMetricEditInput } from './presentOutcomes';

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

export type EvidenceModel = {
  workspaceTitle: string;
  framingLine: string;
  sampleBanner: string;
  cards: EvidenceCard[];
  allMeasuredLines: string[];
};

export type EvidenceMetricEditInput = OutcomeMetricEditInput;

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
    allMeasuredLines: cards.map((card) => card.measuredLine),
  };
}

export function applyEvidenceMetricEdit(
  spec: SteerSpec,
  outcomeId: string,
  metricId: string,
  input: EvidenceMetricEditInput,
) {
  return applyOutcomeMetricEdit(spec, outcomeId, metricId, input);
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
