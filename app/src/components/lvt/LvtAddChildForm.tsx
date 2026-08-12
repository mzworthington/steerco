import { useMemo, useState } from 'react';
import type { BetKind, FundingStance } from '@steerco/core';
import type { BetDraft, GoalDraft, InitiativeDraft } from '../../application/presentLvtChildren';
import {
  betDetailFundingStanceOptions,
  betDetailKindOptions,
  betDetailStatusOptions,
} from '../../application/presentBetDetail';
import { useWorkspaceSession } from '../../workspace/WorkspaceSession';
import { DetailModalShell } from './DetailModalShell';

export type LvtAddChildKind = 'goal' | 'bet' | 'initiative';

type DraftForKind<K extends LvtAddChildKind> = K extends 'goal'
  ? GoalDraft
  : K extends 'bet'
    ? BetDraft
    : InitiativeDraft;

type LvtAddChildFormProps<K extends LvtAddChildKind> = {
  kind: K;
  /** Compact toggle for detail panels; `header` is a single primary CTA. */
  layout?: 'panel' | 'header';
  onAdd: (draft: DraftForKind<K>) => { ok: true } | { ok: false; error: string };
};

const GOAL_STATUS_OPTIONS: GoalDraft['status'][] = ['on_track', 'at_risk', 'achieved', 'abandoned'];

const emptyGoal = (): GoalDraft => ({ title: '', summary: '', status: 'on_track' });
const emptyBet = (): BetDraft => ({
  title: '',
  successSignal: '',
  killCriteria: '',
  status: 'proposed',
  fundedTeamIds: [],
  metricIds: [],
  primaryMetricId: null,
  reviewDate: '',
  horizon: '',
  fundingStance: null,
  kind: null,
});
const emptyInitiative = (): InitiativeDraft => ({
  title: '',
  successSignal: '',
  externalUrl: '',
});

function labelsFor(kind: LvtAddChildKind): {
  open: string;
  submit: string;
  heading: string;
  eyebrow: string;
} {
  switch (kind) {
    case 'goal':
      return {
        open: 'Add goal',
        submit: 'Add goal',
        heading: 'New goal under this vision',
        eyebrow: 'Add goal',
      };
    case 'bet':
      return {
        open: 'Add bet',
        submit: 'Add bet',
        heading: 'New bet under this goal',
        eyebrow: 'Add bet',
      };
    case 'initiative':
      return {
        open: 'Add initiative',
        submit: 'Add initiative',
        heading: 'New initiative under this bet',
        eyebrow: 'Add initiative',
      };
  }
}

function draftHasContent(
  kind: LvtAddChildKind,
  goal: GoalDraft,
  bet: BetDraft,
  initiative: InitiativeDraft,
): boolean {
  if (kind === 'goal') {
    return Boolean(goal.title.trim() || goal.summary.trim() || goal.status !== 'on_track');
  }
  if (kind === 'bet') {
    return Boolean(
      bet.title.trim() ||
      bet.successSignal.trim() ||
      bet.killCriteria.trim() ||
      bet.status !== 'proposed' ||
      bet.fundedTeamIds.length > 0 ||
      bet.metricIds.length > 0 ||
      bet.reviewDate.trim() ||
      bet.horizon.trim() ||
      bet.fundingStance ||
      bet.kind,
    );
  }
  return Boolean(
    initiative.title.trim() || initiative.successSignal.trim() || initiative.externalUrl.trim(),
  );
}

export function LvtAddChildForm<K extends LvtAddChildKind>({
  kind,
  layout = 'panel',
  onAdd,
}: LvtAddChildFormProps<K>) {
  const labels = labelsFor(kind);
  const { session } = useWorkspaceSession();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goalDraft, setGoalDraft] = useState<GoalDraft>(emptyGoal);
  const [betDraft, setBetDraft] = useState<BetDraft>(emptyBet);
  const [initiativeDraft, setInitiativeDraft] = useState<InitiativeDraft>(emptyInitiative);

  const statusOptions = useMemo(() => betDetailStatusOptions(), []);
  const fundingStanceOptions = useMemo(() => betDetailFundingStanceOptions(), []);
  const kindOptions = useMemo(() => betDetailKindOptions(), []);

  const teams = session?.spec.spec.teams ?? [];
  const metricOptions = useMemo(
    () =>
      (session?.spec.spec.outcomes ?? []).flatMap((outcome) =>
        outcome.metrics.map((metric) => ({
          id: metric.id,
          title: metric.title,
          outcomeTitle: outcome.title,
        })),
      ),
    [session],
  );

  const reset = () => {
    setGoalDraft(emptyGoal());
    setBetDraft(emptyBet());
    setInitiativeDraft(emptyInitiative());
    setError(null);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const requestClose = () => {
    if (
      draftHasContent(kind, goalDraft, betDraft, initiativeDraft) &&
      !window.confirm('Discard this draft and close?')
    ) {
      return;
    }
    close();
  };

  const submit = () => {
    const draft = (
      kind === 'goal' ? goalDraft : kind === 'bet' ? betDraft : initiativeDraft
    ) as DraftForKind<K>;
    const result = onAdd(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    close();
  };

  const toggleTeam = (teamId: string) => {
    const selected = new Set(betDraft.fundedTeamIds);
    if (selected.has(teamId)) selected.delete(teamId);
    else selected.add(teamId);
    setBetDraft({ ...betDraft, fundedTeamIds: [...selected] });
  };

  const toggleMetric = (metricId: string) => {
    const selected = new Set(betDraft.metricIds);
    if (selected.has(metricId)) selected.delete(metricId);
    else selected.add(metricId);
    const nextMetricIds = [...selected];
    const primaryMetricId = nextMetricIds.includes(betDraft.primaryMetricId ?? '')
      ? betDraft.primaryMetricId
      : null;
    setBetDraft({ ...betDraft, metricIds: nextMetricIds, primaryMetricId });
  };

  const openButtonClass = layout === 'header' ? 'btn-primary' : 'btn-secondary';

  return (
    <div
      className={layout === 'header' ? 'lvt-add-child lvt-add-child-header' : 'lvt-add-child'}
      data-testid={`lvt-add-${kind}`}
    >
      <button
        type="button"
        className={openButtonClass}
        data-testid={`lvt-add-${kind}-open`}
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
      >
        {labels.open}
      </button>

      {open ? (
        <DetailModalShell
          title={labels.heading}
          testId={`lvt-add-${kind}-modal`}
          onClose={requestClose}
        >
          <form
            className="lvt-edit-form"
            data-testid={`lvt-add-${kind}-form`}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <header className="lvt-edit-header">
              <p className="eyebrow">{labels.eyebrow}</p>
              <h2 className="lvt-edit-title">{labels.heading}</h2>
            </header>

            {kind === 'goal' ? (
              <>
                <label className="goals-mos-field">
                  <span>Goal title</span>
                  <input
                    type="text"
                    value={goalDraft.title}
                    data-testid="lvt-add-goal-title"
                    onChange={(event) => setGoalDraft({ ...goalDraft, title: event.target.value })}
                    required
                    autoFocus
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Summary (optional)</span>
                  <textarea
                    value={goalDraft.summary}
                    data-testid="lvt-add-goal-summary"
                    rows={3}
                    onChange={(event) =>
                      setGoalDraft({ ...goalDraft, summary: event.target.value })
                    }
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Status</span>
                  <select
                    value={goalDraft.status}
                    data-testid="lvt-add-goal-status"
                    onChange={(event) =>
                      setGoalDraft({
                        ...goalDraft,
                        status: event.target.value as GoalDraft['status'],
                      })
                    }
                  >
                    {GOAL_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            {kind === 'bet' ? (
              <>
                <label className="goals-mos-field">
                  <span>Bet title</span>
                  <input
                    type="text"
                    value={betDraft.title}
                    data-testid="lvt-add-bet-title"
                    onChange={(event) => setBetDraft({ ...betDraft, title: event.target.value })}
                    required
                    autoFocus
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Success signal</span>
                  <textarea
                    value={betDraft.successSignal}
                    data-testid="lvt-add-bet-success"
                    rows={3}
                    onChange={(event) =>
                      setBetDraft({ ...betDraft, successSignal: event.target.value })
                    }
                    required
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Kill criteria</span>
                  <textarea
                    value={betDraft.killCriteria}
                    data-testid="lvt-add-bet-kill"
                    rows={3}
                    onChange={(event) =>
                      setBetDraft({ ...betDraft, killCriteria: event.target.value })
                    }
                    required
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Status</span>
                  <select
                    value={betDraft.status}
                    data-testid="lvt-add-bet-status"
                    onChange={(event) =>
                      setBetDraft({
                        ...betDraft,
                        status: event.target.value as BetDraft['status'],
                      })
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <fieldset className="lvt-edit-metrics" data-testid="lvt-add-bet-teams">
                  <legend>Funded teams (optional)</legend>
                  {teams.length === 0 ? (
                    <p className="lvt-add-child-hint">No teams in this workspace yet.</p>
                  ) : (
                    <div className="lvt-add-child-checklist">
                      {teams.map((team) => (
                        <label key={team.id} className="lvt-add-child-check">
                          <input
                            type="checkbox"
                            checked={betDraft.fundedTeamIds.includes(team.id)}
                            onChange={() => toggleTeam(team.id)}
                          />
                          <span>{team.displayName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>

                <fieldset className="lvt-edit-metrics" data-testid="lvt-add-bet-metrics">
                  <legend>Measures this bet moves (optional)</legend>
                  {metricOptions.length === 0 ? (
                    <p className="lvt-add-child-hint">No metrics recorded in this workspace yet.</p>
                  ) : (
                    <>
                      <div className="lvt-add-child-checklist">
                        {metricOptions.map((metric) => (
                          <label key={metric.id} className="lvt-add-child-check">
                            <input
                              type="checkbox"
                              checked={betDraft.metricIds.includes(metric.id)}
                              onChange={() => toggleMetric(metric.id)}
                            />
                            <span>
                              {metric.title}
                              <span className="lvt-add-child-check-meta">
                                {' '}
                                · {metric.outcomeTitle}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                      <label className="goals-mos-field">
                        <span>Primary metric</span>
                        <select
                          value={betDraft.primaryMetricId ?? ''}
                          data-testid="lvt-add-bet-primary-metric"
                          onChange={(event) =>
                            setBetDraft({
                              ...betDraft,
                              primaryMetricId: event.target.value ? event.target.value : null,
                            })
                          }
                        >
                          <option value="">None</option>
                          {metricOptions
                            .filter((metric) => betDraft.metricIds.includes(metric.id))
                            .map((metric) => (
                              <option key={metric.id} value={metric.id}>
                                {metric.title}
                              </option>
                            ))}
                        </select>
                      </label>
                    </>
                  )}
                </fieldset>

                <div className="lvt-add-child-grid">
                  <label className="goals-mos-field">
                    <span>Funding stance</span>
                    <select
                      value={betDraft.fundingStance ?? ''}
                      data-testid="lvt-add-bet-funding"
                      onChange={(event) =>
                        setBetDraft({
                          ...betDraft,
                          fundingStance: event.target.value
                            ? (event.target.value as FundingStance)
                            : null,
                        })
                      }
                    >
                      <option value="">Not set</option>
                      {fundingStanceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="goals-mos-field">
                    <span>Kind</span>
                    <select
                      value={betDraft.kind ?? ''}
                      data-testid="lvt-add-bet-kind"
                      onChange={(event) =>
                        setBetDraft({
                          ...betDraft,
                          kind: event.target.value ? (event.target.value as BetKind) : null,
                        })
                      }
                    >
                      <option value="">Not set</option>
                      {kindOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="goals-mos-field">
                    <span>Review date</span>
                    <input
                      type="date"
                      value={betDraft.reviewDate}
                      data-testid="lvt-add-bet-review-date"
                      onChange={(event) =>
                        setBetDraft({ ...betDraft, reviewDate: event.target.value })
                      }
                    />
                  </label>
                  <label className="goals-mos-field">
                    <span>Horizon</span>
                    <input
                      type="text"
                      value={betDraft.horizon}
                      placeholder="Q3 review"
                      data-testid="lvt-add-bet-horizon"
                      onChange={(event) =>
                        setBetDraft({ ...betDraft, horizon: event.target.value })
                      }
                    />
                  </label>
                </div>
              </>
            ) : null}

            {kind === 'initiative' ? (
              <>
                <label className="goals-mos-field">
                  <span>Initiative title</span>
                  <input
                    type="text"
                    value={initiativeDraft.title}
                    data-testid="lvt-add-initiative-title"
                    onChange={(event) =>
                      setInitiativeDraft({ ...initiativeDraft, title: event.target.value })
                    }
                    required
                    autoFocus
                  />
                </label>
                <label className="goals-mos-field">
                  <span>Success signal</span>
                  <textarea
                    value={initiativeDraft.successSignal}
                    data-testid="lvt-add-initiative-success"
                    rows={3}
                    onChange={(event) =>
                      setInitiativeDraft({
                        ...initiativeDraft,
                        successSignal: event.target.value,
                      })
                    }
                    required
                  />
                </label>
                <label className="goals-mos-field">
                  <span>External tracker URL (optional)</span>
                  <input
                    type="url"
                    value={initiativeDraft.externalUrl}
                    data-testid="lvt-add-initiative-url"
                    onChange={(event) =>
                      setInitiativeDraft({
                        ...initiativeDraft,
                        externalUrl: event.target.value,
                      })
                    }
                  />
                </label>
              </>
            ) : null}

            {error ? (
              <p className="goals-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="lvt-edit-actions">
              <button
                type="button"
                className="btn-secondary"
                data-testid={`lvt-add-${kind}-cancel`}
                onClick={requestClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" data-testid={`lvt-add-${kind}-submit`}>
                {labels.submit}
              </button>
            </div>
          </form>
        </DetailModalShell>
      ) : null}
    </div>
  );
}
