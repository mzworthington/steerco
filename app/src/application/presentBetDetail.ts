import type { BetKind, FundingStance, SteerSpec } from '@steerlens/core';
import {
  presentBetStatus,
  type ExecutiveBetStatus,
  type SteeringBetCard,
} from './presentSteeringOverview';

export type BetDetailStatus = SteerSpec['spec']['bets'][number]['status'];

export type BetDetailMeasure = {
  id: string;
  title: string;
  cue: string;
};

export type BetDetailTeamOption = {
  id: string;
  displayName: string;
  selected: boolean;
};

export type BetDetailMetricOption = {
  id: string;
  title: string;
  outcomeTitle: string;
  selected: boolean;
};

/** Active bet statuses expected to carry a Measure-of-Success link (Slice 1.5). */
const ACTIVE_BET_STATUSES = new Set<BetDetailStatus>(['on_track', 'at_risk', 'stop_ready']);

export type BetDetailModel = {
  id: string;
  title: string;
  successSignal: string;
  killCriteria: string;
  status: BetDetailStatus;
  statusLabel: ExecutiveBetStatus;
  statusTone: SteeringBetCard['statusTone'];
  outcome: {
    id: string;
    title: string;
    summary: string | null;
    measures: BetDetailMeasure[];
  } | null;
  fundedTeams: BetDetailTeamOption[];
  metricOptions: BetDetailMetricOption[];
  primaryMetricId: string | null;
  reviewDate: string;
  horizon: string;
  fundingStance: FundingStance | null;
  kind: BetKind | null;
};

export type BetDetailDraft = {
  title: string;
  successSignal: string;
  killCriteria: string;
  status: BetDetailStatus;
  fundedTeamIds: string[];
  metricIds: string[];
  primaryMetricId: string | null;
  reviewDate: string;
  horizon: string;
  fundingStance: FundingStance | null;
  kind: BetKind | null;
};

export type BetDetailFieldIssue = {
  field: 'title' | 'successSignal' | 'killCriteria' | 'fundedTeamIds' | 'status' | 'metricIds';
  message: string;
};

export type BetDetailValidation =
  | { ok: true; warnings: BetDetailFieldIssue[] }
  | { ok: false; errors: BetDetailFieldIssue[]; warnings: BetDetailFieldIssue[] };

export type ApplyBetDetailResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

const STATUS_OPTIONS: BetDetailStatus[] = [
  'proposed',
  'on_track',
  'at_risk',
  'stop_ready',
  'stopped',
  'done',
];

const FUNDING_STANCE_LABELS: Record<FundingStance, string> = {
  explore: 'Explore',
  exploit: 'Exploit',
  sustain: 'Sustain',
};

const BET_KIND_LABELS: Record<BetKind, string> = {
  opportunity: 'Opportunity',
  capability: 'Capability',
};

export function betDetailStatusOptions(): Array<{
  value: BetDetailStatus;
  label: ExecutiveBetStatus;
}> {
  return STATUS_OPTIONS.map((value) => ({
    value,
    label: presentBetStatus(value).label,
  }));
}

export function betDetailFundingStanceOptions(): Array<{
  value: FundingStance;
  label: string;
}> {
  return (Object.keys(FUNDING_STANCE_LABELS) as FundingStance[]).map((value) => ({
    value,
    label: FUNDING_STANCE_LABELS[value],
  }));
}

export function betDetailKindOptions(): Array<{ value: BetKind; label: string }> {
  return (Object.keys(BET_KIND_LABELS) as BetKind[]).map((value) => ({
    value,
    label: BET_KIND_LABELS[value],
  }));
}

export function presentBetDetail(spec: SteerSpec, betId: string): BetDetailModel | null {
  const bet = spec.spec.bets.find((item) => item.id === betId);
  if (!bet) return null;

  const outcome = spec.spec.outcomes.find((item) => item.id === bet.outcomeId) ?? null;
  const status = presentBetStatus(bet.status);
  const selectedTeams = new Set(bet.fundedTeamIds);
  const selectedMetrics = new Set(bet.metricIds);

  return {
    id: bet.id,
    title: bet.title,
    successSignal: bet.successSignal,
    killCriteria: bet.killCriteria,
    status: bet.status,
    statusLabel: status.label,
    statusTone: status.tone,
    outcome: outcome
      ? {
          id: outcome.id,
          title: outcome.title,
          summary: outcome.summary ?? null,
          measures: outcome.metrics.map((metric) => ({
            id: metric.id,
            title: metric.title,
            cue: formatMeasureCue(metric),
          })),
        }
      : null,
    fundedTeams: spec.spec.teams.map((team) => ({
      id: team.id,
      displayName: team.displayName,
      selected: selectedTeams.has(team.id),
    })),
    metricOptions: collectWorkspaceMetrics(spec).map((metric) => ({
      ...metric,
      selected: selectedMetrics.has(metric.id),
    })),
    primaryMetricId: bet.primaryMetricId ?? null,
    reviewDate: bet.reviewDate ?? '',
    horizon: bet.horizon ?? '',
    fundingStance: bet.fundingStance ?? null,
    kind: bet.kind ?? null,
  };
}

export function validateBetDetailDraft(draft: BetDetailDraft): BetDetailValidation {
  const errors: BetDetailFieldIssue[] = [];
  const warnings: BetDetailFieldIssue[] = [];

  if (!draft.title.trim()) {
    errors.push({
      field: 'title',
      message: 'Give this bet a short name before saving.',
    });
  }
  if (!draft.successSignal.trim()) {
    errors.push({
      field: 'successSignal',
      message: 'Describe what success looks like before saving.',
    });
  }
  if (!draft.killCriteria.trim()) {
    errors.push({
      field: 'killCriteria',
      message: 'Add kill criteria so a stop decision is pre-agreed.',
    });
  }
  if (draft.fundedTeamIds.length === 0) {
    warnings.push({
      field: 'fundedTeamIds',
      message: 'No funded teams yet — assign who delivers this bet when you can.',
    });
  }
  const hasMosLink = draft.metricIds.length > 0 || Boolean(draft.primaryMetricId);
  if (ACTIVE_BET_STATUSES.has(draft.status) && !hasMosLink) {
    warnings.push({
      field: 'metricIds',
      message:
        'This bet is active but has no linked Measure of Success — steering conversations need a number to point at.',
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings };
  }
  return { ok: true, warnings };
}

export function applyBetDetailDraft(
  spec: SteerSpec,
  betId: string,
  draft: BetDetailDraft,
): ApplyBetDetailResult {
  const validation = validateBetDetailDraft(draft);
  if (!validation.ok) {
    return { ok: false, error: validation.errors[0]?.message ?? 'Could not save this bet.' };
  }

  const index = spec.spec.bets.findIndex((item) => item.id === betId);
  if (index < 0) {
    return { ok: false, error: 'That bet is not in the open workspace.' };
  }

  const knownTeams = new Set(spec.spec.teams.map((team) => team.id));
  const fundedTeamIds = draft.fundedTeamIds.filter((id) => knownTeams.has(id));
  const knownMetrics = new Set(collectWorkspaceMetrics(spec).map((metric) => metric.id));
  const metricIds = draft.metricIds.filter((id) => knownMetrics.has(id));
  const primaryMetricId =
    draft.primaryMetricId && metricIds.includes(draft.primaryMetricId)
      ? draft.primaryMetricId
      : null;
  const current = spec.spec.bets[index];
  if (!current) {
    return { ok: false, error: 'That bet is not in the open workspace.' };
  }

  const nextBets = [...spec.spec.bets];
  nextBets[index] = {
    ...current,
    title: draft.title.trim(),
    successSignal: draft.successSignal.trim(),
    killCriteria: draft.killCriteria.trim(),
    status: draft.status,
    fundedTeamIds,
    metricIds,
    primaryMetricId,
    reviewDate: draft.reviewDate.trim() || undefined,
    horizon: draft.horizon.trim() || undefined,
    fundingStance: draft.fundingStance ?? undefined,
    kind: draft.kind ?? undefined,
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        bets: nextBets,
      },
    },
  };
}

/** All metrics across every outcome in the workspace, for "measures this bet moves" pickers. */
function collectWorkspaceMetrics(
  spec: SteerSpec,
): Array<{ id: string; title: string; outcomeTitle: string }> {
  return spec.spec.outcomes.flatMap((outcome) =>
    outcome.metrics.map((metric) => ({
      id: metric.id,
      title: metric.title,
      outcomeTitle: outcome.title,
    })),
  );
}

function formatMeasureCue(metric: {
  title: string;
  unit?: string;
  current?: number | null;
  target?: number | null;
  interpretation?: string;
}): string {
  if (metric.interpretation?.trim()) {
    return metric.interpretation.trim();
  }
  const parts: string[] = [];
  if (typeof metric.current === 'number') {
    parts.push(`Now ${formatMeasureNumber(metric.current, metric.unit)}`);
  }
  if (typeof metric.target === 'number') {
    parts.push(`target ${formatMeasureNumber(metric.target, metric.unit)}`);
  }
  return parts.length > 0 ? parts.join(' · ') : metric.title;
}

function formatMeasureNumber(value: number, unit?: string): string {
  const rendered = Number.isInteger(value) ? String(value) : String(value);
  if (!unit) return rendered;
  if (unit === 'percent') return `${rendered}%`;
  return `${rendered} ${unit}`;
}
