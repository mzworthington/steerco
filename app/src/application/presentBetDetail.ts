import type { BetKind, FundingStance, SteerSpec } from '@steerco/core';
import {
  DEFAULT_PLATFORM_OVERLOAD_THRESHOLD,
  INTERACTION_MODE_COPY,
  TOPOLOGY_TYPE_COPY,
  projectSteerSpecAsOf,
  type TeamRole,
} from '@steerco/core';
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

const MANY_DEPENDENTS_THRESHOLD = 5;
const MANY_DEPENDENCIES_THRESHOLD = 4;

export type BetDetailTeamCueKind = 'overloaded' | 'many_dependents' | 'many_dependencies';

export type BetDetailTeamCue = {
  kind: BetDetailTeamCueKind;
  label: string;
};

export type BetDetailTeamInteraction = {
  modeLabel: string;
  sentence: string;
  direction: 'outbound' | 'inbound';
  otherTeamLabel: string;
};

export type BetDetailTeamOption = {
  id: string;
  displayName: string;
  selected: boolean;
  roleLabel: string;
  domainTitle: string | null;
  streamTitles: string[];
  interactions: BetDetailTeamInteraction[];
  cues: BetDetailTeamCue[];
};

export type BetDetailTeamGroup = {
  domainTitle: string;
  teams: BetDetailTeamOption[];
};

export type BetDetailMetricOption = {
  id: string;
  title: string;
  outcomeTitle: string;
  selected: boolean;
};

/** Active bet statuses expected to carry a Measure-of-Success link (Slice 1.5). */
const ACTIVE_BET_STATUSES = new Set<BetDetailStatus>(['on_track', 'at_risk', 'stop_ready']);

export type BetDetailInitiative = {
  id: string;
  title: string;
  successSignal: string;
  externalUrl: string | null;
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
  fundedTeamGroups: BetDetailTeamGroup[];
  deliveryLoadSummary: string | null;
  metricOptions: BetDetailMetricOption[];
  primaryMetricId: string | null;
  reviewDate: string;
  horizon: string;
  fundingStance: FundingStance | null;
  kind: BetKind | null;
  techRadarUrl: string | null;
  techAtCoreCue: string | null;
  initiatives: BetDetailInitiative[];
  flowOverlay: BetFlowOverlay | null;
};

export type BetFlowParticipant = {
  teamId: string;
  displayName: string;
  roleLabel: string;
  kind: 'funded' | 'related';
};

export type BetFlowEdge = {
  fromLabel: string;
  toLabel: string;
  modeLabel: string;
  sentence: string;
};

export type BetFlowOverlay = {
  asOf: string | null;
  lead: string;
  participants: BetFlowParticipant[];
  edges: BetFlowEdge[];
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

export function presentBetDetail(
  spec: SteerSpec,
  betId: string,
  options: { asOf?: string | null } = {},
): BetDetailModel | null {
  const bet = spec.spec.bets.find((item) => item.id === betId);
  if (!bet) return null;

  const asOf = options.asOf?.trim() || null;
  const projected = projectSteerSpecAsOf(spec, asOf);
  const outcome = projected.spec.outcomes.find((item) => item.id === bet.outcomeId) ?? null;
  const status = presentBetStatus(bet.status);
  const selectedTeams = new Set(bet.fundedTeamIds);
  const selectedMetrics = new Set(bet.metricIds);
  const fundedTeams = presentBetDeliveryTeams(projected, selectedTeams);
  const fundedTeamGroups = groupBetDeliveryTeams(projected, fundedTeams);

  const initiatives = (spec.spec.initiatives ?? [])
    .filter((item) => item.betId === bet.id)
    .map((item) => ({
      id: item.id,
      title: item.title,
      successSignal: item.successSignal,
      externalUrl: item.externalUrl?.trim() || null,
    }));

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
    fundedTeams,
    fundedTeamGroups,
    deliveryLoadSummary: buildDeliveryLoadSummary(fundedTeams.filter((team) => team.selected)),
    metricOptions: collectWorkspaceMetrics(projected).map((metric) => ({
      ...metric,
      selected: selectedMetrics.has(metric.id),
    })),
    primaryMetricId: bet.primaryMetricId ?? null,
    reviewDate: bet.reviewDate ?? '',
    horizon: bet.horizon ?? '',
    fundingStance: bet.fundingStance ?? null,
    kind: bet.kind ?? null,
    techRadarUrl: spec.spec.techRadarUrl?.trim() || null,
    techAtCoreCue:
      bet.kind === 'capability'
        ? 'Tech@Core: this capability bet revitalizes a core system - treat it as a business investment, not a cost centre.'
        : null,
    initiatives,
    flowOverlay: presentBetFlowOverlay(projected, bet.fundedTeamIds, asOf),
  };
}

function presentBetDeliveryTeams(
  spec: SteerSpec,
  selectedTeams: ReadonlySet<string>,
): BetDetailTeamOption[] {
  const streamTitleById = new Map(spec.spec.streams.map((stream) => [stream.id, stream.title]));
  const domainTitleByStreamId = new Map<string, string>();
  for (const domain of spec.spec.domains) {
    for (const streamId of domain.memberStreamIds) {
      if (!domainTitleByStreamId.has(streamId)) {
        domainTitleByStreamId.set(streamId, domain.title);
      }
    }
  }
  const teamById = new Map(spec.spec.teams.map((team) => [team.id, team]));

  return spec.spec.teams.map((team) => {
    const role = team.role as TeamRole;
    const streamIds = team.streamIds ?? [];
    const streamTitles = streamIds.map((id) => streamTitleById.get(id) ?? id);
    const domainTitle =
      streamIds.map((id) => domainTitleByStreamId.get(id)).find(Boolean) ??
      (team.role === 'platform' || team.role === 'enabling' ? 'Shared support' : null);

    const interactions: BetDetailTeamInteraction[] = [];
    let outboundCount = 0;
    let inboundServiceCount = 0;

    for (const relationship of spec.spec.relationships) {
      const modeCopy = INTERACTION_MODE_COPY[relationship.mode];
      if (!modeCopy) continue;
      const from = teamById.get(relationship.fromTeamId);
      const to = teamById.get(relationship.toTeamId);
      if (!from || !to) continue;

      if (relationship.fromTeamId === team.id) {
        outboundCount += 1;
        interactions.push({
          modeLabel: modeCopy.modeName,
          sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
          direction: 'outbound',
          otherTeamLabel: to.displayName,
        });
      }
      if (relationship.toTeamId === team.id) {
        if (relationship.mode === 'x_as_a_service') inboundServiceCount += 1;
        interactions.push({
          modeLabel: modeCopy.modeName,
          sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
          direction: 'inbound',
          otherTeamLabel: from.displayName,
        });
      }
    }

    const cues: BetDetailTeamCue[] = [];
    if (inboundServiceCount >= DEFAULT_PLATFORM_OVERLOAD_THRESHOLD) {
      cues.push({
        kind: 'overloaded',
        label: `${inboundServiceCount} teams use this as a service - cognitive-load and flow risk`,
      });
    } else if (inboundServiceCount >= MANY_DEPENDENTS_THRESHOLD) {
      cues.push({
        kind: 'many_dependents',
        label: `${inboundServiceCount} teams already depend on this one`,
      });
    }
    if (outboundCount >= MANY_DEPENDENCIES_THRESHOLD) {
      cues.push({
        kind: 'many_dependencies',
        label: `Depends on ${outboundCount} other teams`,
      });
    }

    return {
      id: team.id,
      displayName: team.displayName,
      selected: selectedTeams.has(team.id),
      roleLabel: TOPOLOGY_TYPE_COPY[role]?.topologyName ?? team.role,
      domainTitle,
      streamTitles,
      interactions,
      cues,
    };
  });
}

function groupBetDeliveryTeams(
  spec: SteerSpec,
  teams: BetDetailTeamOption[],
): BetDetailTeamGroup[] {
  const domainOrder = [
    ...spec.spec.domains.map((domain) => domain.title),
    'Shared support',
    'Ungrouped',
  ];
  const byDomain = new Map<string, BetDetailTeamOption[]>();
  for (const team of teams) {
    const key = team.domainTitle ?? 'Ungrouped';
    const list = byDomain.get(key) ?? [];
    list.push(team);
    byDomain.set(key, list);
  }

  const groups: BetDetailTeamGroup[] = [];
  for (const title of domainOrder) {
    const groupTeams = byDomain.get(title);
    if (!groupTeams?.length) continue;
    groups.push({ domainTitle: title, teams: groupTeams });
    byDomain.delete(title);
  }
  for (const [domainTitle, groupTeams] of byDomain) {
    groups.push({ domainTitle, teams: groupTeams });
  }
  return groups;
}

function buildDeliveryLoadSummary(selected: BetDetailTeamOption[]): string | null {
  const parts: string[] = [];
  for (const team of selected) {
    for (const cue of team.cues) {
      parts.push(`${team.displayName}: ${cue.label}`);
    }
  }
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function presentBetFlowOverlay(
  spec: SteerSpec,
  fundedTeamIds: readonly string[],
  asOf: string | null = null,
): BetFlowOverlay {
  const funded = new Set(fundedTeamIds);
  const teamById = new Map(spec.spec.teams.map((team) => [team.id, team]));
  const relatedIds = new Set<string>();
  const edges: BetFlowEdge[] = [];

  for (const relationship of spec.spec.relationships) {
    const touchesFunded = funded.has(relationship.fromTeamId) || funded.has(relationship.toTeamId);
    if (!touchesFunded) continue;
    const from = teamById.get(relationship.fromTeamId);
    const to = teamById.get(relationship.toTeamId);
    const modeCopy = INTERACTION_MODE_COPY[relationship.mode];
    if (!from || !to || !modeCopy) continue;
    relatedIds.add(from.id);
    relatedIds.add(to.id);
    edges.push({
      fromLabel: from.displayName,
      toLabel: to.displayName,
      modeLabel: modeCopy.modeName,
      sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
    });
  }

  for (const id of funded) relatedIds.add(id);

  const participants: BetFlowParticipant[] = [...relatedIds]
    .map((id) => teamById.get(id))
    .filter((team): team is NonNullable<typeof team> => Boolean(team))
    .map((team) => {
      const role = team.role as TeamRole;
      const copy = TOPOLOGY_TYPE_COPY[role];
      return {
        teamId: team.id,
        displayName: team.displayName,
        roleLabel: copy?.topologyName ?? team.role,
        kind: funded.has(team.id) ? ('funded' as const) : ('related' as const),
      };
    })
    .sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'funded' ? -1 : 1;
      return a.displayName.localeCompare(b.displayName);
    });

  return {
    asOf,
    lead: asOf
      ? `Who sits on this bet’s flow of change as of ${asOf}.`
      : 'Who sits on this bet’s flow of change - funded streams plus related platform, enabling, and subsystem interactions.',
    participants,
    edges,
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
      message: 'No funded teams yet - assign who delivers this bet when you can.',
    });
  }
  const hasMosLink = draft.metricIds.length > 0 || Boolean(draft.primaryMetricId);
  if (ACTIVE_BET_STATUSES.has(draft.status) && !hasMosLink) {
    warnings.push({
      field: 'metricIds',
      message:
        'This bet is active but has no linked Measure of Success - steering conversations need a number to point at.',
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

export type InitiativeDraft = {
  title: string;
  successSignal: string;
  externalUrl: string;
};

export type ApplyInitiativeResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

/** Add a thin initiative narrative under a bet (never an execution backlog item). */
export function applyAddInitiative(
  spec: SteerSpec,
  betId: string,
  draft: InitiativeDraft,
): ApplyInitiativeResult {
  if (!spec.spec.bets.some((bet) => bet.id === betId)) {
    return { ok: false, error: 'That bet is not in the open workspace.' };
  }
  const title = draft.title.trim();
  const successSignal = draft.successSignal.trim();
  if (!title) {
    return { ok: false, error: 'Give the initiative a short title.' };
  }
  if (!successSignal) {
    return { ok: false, error: 'Describe what success looks like for this slice.' };
  }

  const id = uniqueId(
    'init_',
    title,
    (spec.spec.initiatives ?? []).map((item) => item.id),
  );
  const externalUrl = draft.externalUrl.trim() || undefined;

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        initiatives: [
          ...(spec.spec.initiatives ?? []),
          { id, betId, title, successSignal, externalUrl },
        ],
      },
    },
  };
}

function uniqueId(prefix: string, seed: string, existing: string[]): string {
  const base =
    prefix +
    seed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 24);
  if (!existing.includes(base)) return base || `${prefix}${existing.length + 1}`;
  let n = 2;
  while (existing.includes(`${base}_${n}`)) n += 1;
  return `${base}_${n}`;
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
