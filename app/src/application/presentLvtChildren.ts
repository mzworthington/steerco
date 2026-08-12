import type { SteerSpec } from '@steerco/core';

export type GoalDraft = {
  title: string;
  summary: string;
};

export type BetDraft = {
  title: string;
  successSignal: string;
  killCriteria: string;
};

export type InitiativeDraft = {
  title: string;
  successSignal: string;
  externalUrl: string;
};

export type ApplyAddChildResult =
  { ok: true; value: SteerSpec; id: string } | { ok: false; error: string };

/** Add a goal (outcome) under the workspace vision. */
export function applyAddGoal(spec: SteerSpec, draft: GoalDraft): ApplyAddChildResult {
  const title = draft.title.trim();
  if (!title) {
    return { ok: false, error: 'Give the goal a short title.' };
  }

  const id = uniqueId(
    'out_',
    title,
    spec.spec.outcomes.map((item) => item.id),
  );
  const summary = draft.summary.trim() || undefined;

  return {
    ok: true,
    id,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        outcomes: [
          ...spec.spec.outcomes,
          {
            id,
            title,
            summary,
            status: 'on_track',
            metrics: [],
          },
        ],
      },
    },
  };
}

/** Add a bet under a goal. New bets start as proposed with empty funding links. */
export function applyAddBet(
  spec: SteerSpec,
  outcomeId: string,
  draft: BetDraft,
): ApplyAddChildResult {
  if (!spec.spec.outcomes.some((outcome) => outcome.id === outcomeId)) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }

  const title = draft.title.trim();
  const successSignal = draft.successSignal.trim();
  const killCriteria = draft.killCriteria.trim();
  if (!title) {
    return { ok: false, error: 'Give the bet a short title.' };
  }
  if (!successSignal) {
    return { ok: false, error: 'Describe the success signal for this bet.' };
  }
  if (!killCriteria) {
    return { ok: false, error: 'Write the kill criteria before funding the bet.' };
  }

  const id = uniqueId(
    'bet_',
    title,
    spec.spec.bets.map((item) => item.id),
  );

  return {
    ok: true,
    id,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        bets: [
          ...spec.spec.bets,
          {
            id,
            outcomeId,
            title,
            successSignal,
            killCriteria,
            status: 'proposed',
            fundedTeamIds: [],
            metricIds: [],
          },
        ],
      },
    },
  };
}

/** Add a thin initiative narrative under a bet (never an execution backlog item). */
export function applyAddInitiative(
  spec: SteerSpec,
  betId: string,
  draft: InitiativeDraft,
): ApplyAddChildResult {
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
    id,
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
