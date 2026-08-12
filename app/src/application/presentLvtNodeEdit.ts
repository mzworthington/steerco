import type { SteerSpec } from '@steerco/core';

export type VisionEditDraft = {
  vision: string;
};

export type GoalEditDraft = {
  title: string;
  summary: string;
  status: SteerSpec['spec']['outcomes'][number]['status'];
  metrics: Array<{ id: string; current: string; target: string }>;
};

export type InitiativeEditDraft = {
  title: string;
  successSignal: string;
  externalUrl: string;
};

export type ApplyResult = { ok: true; value: SteerSpec } | { ok: false; error: string };

function parseOptionalNumber(
  raw: string,
): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'Values must be numbers, or left blank.' };
  }
  return { ok: true, value };
}

export function applyVisionEdit(spec: SteerSpec, draft: VisionEditDraft): ApplyResult {
  const vision = draft.vision.trim();
  if (!vision) {
    return { ok: false, error: 'Vision cannot be empty.' };
  }
  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        vision,
      },
    },
  };
}

export function applyGoalEdit(
  spec: SteerSpec,
  outcomeId: string,
  draft: GoalEditDraft,
): ApplyResult {
  const title = draft.title.trim();
  if (!title) {
    return { ok: false, error: 'Give the goal a title.' };
  }

  const outcomeIndex = spec.spec.outcomes.findIndex((item) => item.id === outcomeId);
  if (outcomeIndex < 0) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }
  const outcome = spec.spec.outcomes[outcomeIndex];
  if (!outcome) {
    return { ok: false, error: 'That goal is not in the open workspace.' };
  }

  const metrics = [...outcome.metrics];
  for (const row of draft.metrics) {
    const metricIndex = metrics.findIndex((item) => item.id === row.id);
    if (metricIndex < 0) {
      return { ok: false, error: 'A measure on this goal is missing from the workspace.' };
    }
    const current = parseOptionalNumber(row.current);
    if (!current.ok) return { ok: false, error: current.error };
    const target = parseOptionalNumber(row.target);
    if (!target.ok) return { ok: false, error: target.error };
    const metric = metrics[metricIndex];
    if (!metric) {
      return { ok: false, error: 'A measure on this goal is missing from the workspace.' };
    }
    metrics[metricIndex] = {
      ...metric,
      current: current.value ?? undefined,
      target: target.value ?? undefined,
    };
  }

  const outcomes = [...spec.spec.outcomes];
  outcomes[outcomeIndex] = {
    ...outcome,
    title,
    summary: draft.summary.trim() || undefined,
    status: draft.status,
    metrics,
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        outcomes,
      },
    },
  };
}

export function applyInitiativeEdit(
  spec: SteerSpec,
  initiativeId: string,
  draft: InitiativeEditDraft,
): ApplyResult {
  const title = draft.title.trim();
  const successSignal = draft.successSignal.trim();
  if (!title) {
    return { ok: false, error: 'Give the initiative a title.' };
  }
  if (!successSignal) {
    return { ok: false, error: 'Describe the success signal for this initiative.' };
  }

  const initiatives = [...(spec.spec.initiatives ?? [])];
  const index = initiatives.findIndex((item) => item.id === initiativeId);
  if (index < 0) {
    return { ok: false, error: 'That initiative is not in the open workspace.' };
  }
  const current = initiatives[index];
  if (!current) {
    return { ok: false, error: 'That initiative is not in the open workspace.' };
  }

  initiatives[index] = {
    ...current,
    title,
    successSignal,
    externalUrl: draft.externalUrl.trim() || undefined,
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        initiatives,
      },
    },
  };
}
