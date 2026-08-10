import type { SteerSpec } from '@steerlens/core';

export type DecisionRecommendation = SteerSpec['spec']['decisionNotes'][number]['recommendation'];

export type DecisionNoteDraft = {
  id: string | null;
  title: string;
  recommendation: DecisionRecommendation;
  betId: string | null;
  why: string;
  measuredText: string;
  affectedTeamIds: string[];
  nextStep: string;
};

export type DecisionNoteCard = {
  id: string;
  title: string;
  recommendation: DecisionRecommendation;
  recommendationLabel: string;
  recommendationTone: 'stop' | 'continue' | 'start' | 'rescope';
  betTitle: string | null;
  whyPreview: string;
  measured: string[];
  affectedTeams: string[];
  nextStep: string;
};

export type DecisionNotesModel = {
  workspaceTitle: string;
  helperMeasured: string;
  mosSuggestions: string[];
  notes: DecisionNoteCard[];
  bets: Array<{ id: string; title: string }>;
  teams: Array<{ id: string; displayName: string }>;
};

export type DecisionNoteValidation = { ok: true } | { ok: false; error: string };

const RECOMMENDATION_COPY: Record<
  DecisionRecommendation,
  { label: string; tone: DecisionNoteCard['recommendationTone'] }
> = {
  start: { label: 'Start', tone: 'start' },
  continue: { label: 'Continue', tone: 'continue' },
  stop: { label: 'Stop', tone: 'stop' },
  rescope: { label: 'Re-scope', tone: 'rescope' },
};

export function decisionRecommendationOptions(): Array<{
  value: DecisionRecommendation;
  label: string;
}> {
  return (Object.keys(RECOMMENDATION_COPY) as DecisionRecommendation[]).map((value) => ({
    value,
    label: RECOMMENDATION_COPY[value].label,
  }));
}

export function presentDecisionNotes(spec: SteerSpec): DecisionNotesModel {
  const teamById = new Map(spec.spec.teams.map((team) => [team.id, team.displayName]));
  const betById = new Map(spec.spec.bets.map((bet) => [bet.id, bet.title]));
  const mosSuggestions = spec.spec.outcomes.flatMap((outcome) =>
    outcome.metrics.map((metric) => {
      const cue = metric.interpretation?.trim()
        ? metric.interpretation.trim()
        : [metric.title, metric.current != null ? `current ${metric.current}` : null]
            .filter(Boolean)
            .join(' — ');
      return `${metric.title}: ${cue}`;
    }),
  );

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    helperMeasured:
      'Prefer Measures of Success and evidence language (hit rate, wait time, adoption) over activity counts (tickets closed, meetings held).',
    mosSuggestions,
    notes: spec.spec.decisionNotes.map((note) => {
      const copy = RECOMMENDATION_COPY[note.recommendation];
      return {
        id: note.id,
        title: note.title,
        recommendation: note.recommendation,
        recommendationLabel: copy.label,
        recommendationTone: copy.tone,
        betTitle: note.betId ? (betById.get(note.betId) ?? null) : null,
        whyPreview: collapseWhitespace(note.why),
        measured: note.measured,
        affectedTeams: note.affectedTeamIds
          .map((id) => teamById.get(id))
          .filter((name): name is string => Boolean(name)),
        nextStep: note.nextStep,
      };
    }),
    bets: spec.spec.bets.map((bet) => ({ id: bet.id, title: bet.title })),
    teams: spec.spec.teams.map((team) => ({ id: team.id, displayName: team.displayName })),
  };
}

export function draftFromDecisionNote(
  note: SteerSpec['spec']['decisionNotes'][number] | null,
): DecisionNoteDraft {
  if (!note) {
    return {
      id: null,
      title: '',
      recommendation: 'stop',
      betId: null,
      why: '',
      measuredText: '',
      affectedTeamIds: [],
      nextStep: '',
    };
  }
  return {
    id: note.id,
    title: note.title,
    recommendation: note.recommendation,
    betId: note.betId ?? null,
    why: note.why,
    measuredText: note.measured.join('\n'),
    affectedTeamIds: [...note.affectedTeamIds],
    nextStep: note.nextStep,
  };
}

export function validateDecisionNoteDraft(draft: DecisionNoteDraft): DecisionNoteValidation {
  if (!draft.title.trim()) {
    return { ok: false, error: 'Give this decision note a short title before saving.' };
  }
  if (!draft.why.trim()) {
    return { ok: false, error: 'Explain why this recommendation is needed.' };
  }
  if (!draft.nextStep.trim()) {
    return { ok: false, error: 'Add a clear next step for the board.' };
  }
  return { ok: true };
}

export function applyDecisionNoteDraft(
  spec: SteerSpec,
  draft: DecisionNoteDraft,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const validation = validateDecisionNoteDraft(draft);
  if (!validation.ok) return validation;

  const measured = draft.measuredText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const knownTeams = new Set(spec.spec.teams.map((team) => team.id));
  const knownBets = new Set(spec.spec.bets.map((bet) => bet.id));
  const affectedTeamIds = draft.affectedTeamIds.filter((id) => knownTeams.has(id));
  const resolvedBetId = draft.betId && knownBets.has(draft.betId) ? draft.betId : null;

  const note = {
    id: draft.id ?? uniqueDecisionId(spec, draft.title),
    betId: resolvedBetId,
    recommendation: draft.recommendation,
    title: draft.title.trim(),
    why: draft.why.trim(),
    measured,
    affectedTeamIds,
    nextStep: draft.nextStep.trim(),
  };

  const existingIndex = spec.spec.decisionNotes.findIndex((item) => item.id === note.id);
  const nextNotes = [...spec.spec.decisionNotes];
  if (existingIndex >= 0) {
    nextNotes[existingIndex] = note;
  } else {
    nextNotes.push(note);
  }

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        decisionNotes: nextNotes,
      },
    },
  };
}

function uniqueDecisionId(spec: SteerSpec, title: string): string {
  const base = `dec_${slugify(title)}`;
  const existing = new Set(spec.spec.decisionNotes.map((note) => note.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'note';
}

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
