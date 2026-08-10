import type { SteerSpec } from '@steerlens/core';
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
};

export type BetDetailDraft = {
  title: string;
  successSignal: string;
  killCriteria: string;
  status: BetDetailStatus;
  fundedTeamIds: string[];
};

export type BetDetailFieldIssue = {
  field: 'title' | 'successSignal' | 'killCriteria' | 'fundedTeamIds' | 'status';
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

export function betDetailStatusOptions(): Array<{
  value: BetDetailStatus;
  label: ExecutiveBetStatus;
}> {
  return STATUS_OPTIONS.map((value) => ({
    value,
    label: presentBetStatus(value).label,
  }));
}

export function presentBetDetail(spec: SteerSpec, betId: string): BetDetailModel | null {
  const bet = spec.spec.bets.find((item) => item.id === betId);
  if (!bet) return null;

  const outcome = spec.spec.outcomes.find((item) => item.id === bet.outcomeId) ?? null;
  const status = presentBetStatus(bet.status);
  const selected = new Set(bet.fundedTeamIds);

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
      selected: selected.has(team.id),
    })),
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
