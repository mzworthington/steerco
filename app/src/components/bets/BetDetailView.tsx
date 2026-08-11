import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { Link, useLocation } from 'wouter';
import type { BetKind, FundingStance } from '@steerco/core';
import {
  applyAddInitiative,
  applyBetDetailDraft,
  betDetailFundingStanceOptions,
  betDetailKindOptions,
  betDetailStatusOptions,
  presentBetDetail,
  validateBetDetailDraft,
  type BetDetailDraft,
  type BetDetailModel,
  type BetDetailStatus,
} from '../../application/presentBetDetail';
import { useWorkspaceSession } from '../../workspace/WorkspaceSession';
import { BetWhoDeliversPanel } from './BetWhoDeliversPanel';

type EditState = {
  betId: string;
  draft: BetDetailDraft;
  baseline: BetDetailDraft;
};

export type BetDetailViewProps = {
  betId: string;
  layout?: 'page' | 'modal';
  /** Modal close; when dirty, confirms before calling. */
  onClose?: () => void;
  /** Expose dirty state to the modal shell (Escape / backdrop). */
  onDirtyChange?: (dirty: boolean) => void;
};

function draftFromModel(model: BetDetailModel): BetDetailDraft {
  return {
    title: model.title,
    successSignal: model.successSignal,
    killCriteria: model.killCriteria,
    status: model.status,
    fundedTeamIds: model.fundedTeams.filter((team) => team.selected).map((team) => team.id),
    metricIds: model.metricOptions.filter((metric) => metric.selected).map((metric) => metric.id),
    primaryMetricId: model.primaryMetricId,
    reviewDate: model.reviewDate,
    horizon: model.horizon,
    fundingStance: model.fundingStance,
    kind: model.kind,
  };
}

function sameIds(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

function draftsEqual(a: BetDetailDraft, b: BetDetailDraft): boolean {
  return (
    a.title === b.title &&
    a.successSignal === b.successSignal &&
    a.killCriteria === b.killCriteria &&
    a.status === b.status &&
    sameIds(a.fundedTeamIds, b.fundedTeamIds) &&
    sameIds(a.metricIds, b.metricIds) &&
    a.primaryMetricId === b.primaryMetricId &&
    a.reviewDate === b.reviewDate &&
    a.horizon === b.horizon &&
    a.fundingStance === b.fundingStance &&
    a.kind === b.kind
  );
}

function confirmLeaveIfDirty(dirty: boolean): boolean {
  if (!dirty) return true;
  return window.confirm('You have unsaved changes. Leave without saving?');
}

export function BetDetailView({
  betId,
  layout = 'page',
  onClose,
  onDirtyChange,
}: BetDetailViewProps) {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [edit, setEdit] = useState<EditState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [initiativeDraft, setInitiativeDraft] = useState({
    title: '',
    successSignal: '',
    externalUrl: '',
  });
  const [initiativeError, setInitiativeError] = useState<string | null>(null);

  useEffect(() => {
    if (layout === 'page' && !session) {
      setLocation('/workspace');
    }
  }, [session, setLocation, layout]);

  const model = useMemo(
    () => (session ? presentBetDetail(session.spec, betId) : null),
    [session, betId],
  );

  const activeEdit =
    model && edit?.betId === model.id
      ? edit
      : model
        ? { betId: model.id, draft: draftFromModel(model), baseline: draftFromModel(model) }
        : null;

  useEffect(() => {
    if (layout !== 'page') return;
    document.title = model ? `${model.title} · SteerCo` : 'Bet · SteerCo';
  }, [model, layout]);

  const dirty = Boolean(activeEdit && !draftsEqual(activeEdit.draft, activeEdit.baseline));

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (layout !== 'page' || !dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, layout]);

  const statusOptions = useMemo(() => betDetailStatusOptions(), []);
  const fundingStanceOptions = useMemo(() => betDetailFundingStanceOptions(), []);
  const kindOptions = useMemo(() => betDetailKindOptions(), []);

  if (!session) return null;

  if (!model || !activeEdit) {
    return (
      <section className="bet-detail" data-testid="bet-detail-missing">
        <h1 className="bet-detail-title">Bet not found</h1>
        <p className="bet-detail-lead">That bet is not in the open workspace.</p>
        {layout === 'page' ? (
          <Link href="/workspace/steering" className="btn-secondary">
            ← Back to steering
          </Link>
        ) : onClose ? (
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        ) : null}
      </section>
    );
  }

  const { draft } = activeEdit;

  const updateDraft = (next: BetDetailDraft) => {
    setEdit({
      betId: model.id,
      draft: next,
      baseline: activeEdit.baseline,
    });
    setSavedFlash(false);
  };

  const requestClose = () => {
    if (!confirmLeaveIfDirty(dirty)) return;
    onClose?.();
  };

  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!confirmLeaveIfDirty(dirty)) {
      event.preventDefault();
    }
  };

  const toggleTeam = (teamId: string) => {
    const selected = new Set(draft.fundedTeamIds);
    if (selected.has(teamId)) selected.delete(teamId);
    else selected.add(teamId);
    updateDraft({ ...draft, fundedTeamIds: [...selected] });
  };

  const toggleMetric = (metricId: string) => {
    const selected = new Set(draft.metricIds);
    if (selected.has(metricId)) selected.delete(metricId);
    else selected.add(metricId);
    const nextMetricIds = [...selected];
    const primaryMetricId = nextMetricIds.includes(draft.primaryMetricId ?? '')
      ? draft.primaryMetricId
      : null;
    updateDraft({ ...draft, metricIds: nextMetricIds, primaryMetricId });
  };

  const deliveryLoadLines = model.fundedTeams
    .filter((team) => draft.fundedTeamIds.includes(team.id))
    .flatMap((team) => team.cues.map((cue) => `${team.displayName}: ${cue.label}`));

  const onSave = () => {
    const validation = validateBetDetailDraft(draft);
    if (!validation.ok) {
      setFormError(validation.errors[0]?.message ?? 'Could not save this bet.');
      setWarning(validation.warnings[0]?.message ?? null);
      return;
    }

    const applied = applyBetDetailDraft(session.spec, model.id, draft);
    if (!applied.ok) {
      setFormError(applied.error);
      return;
    }

    setSession({
      ...session,
      spec: applied.value,
    });
    setEdit({
      betId: model.id,
      draft,
      baseline: draft,
    });
    setFormError(null);
    setWarning(validation.warnings[0]?.message ?? null);
    setSavedFlash(true);
  };

  return (
    <section
      className={layout === 'modal' ? 'bet-detail bet-detail--modal' : 'bet-detail'}
      data-testid="bet-detail"
    >
      {layout === 'page' ? (
        <Link href="/workspace/steering" className="bet-detail-back" onClick={onBack}>
          ← Back to steering
        </Link>
      ) : null}

      <header className="bet-detail-header">
        <div>
          <p className="eyebrow">Bet detail</p>
          <label className="bet-detail-field">
            <span className="sr-only">Bet title</span>
            <input
              className="bet-detail-title-input"
              value={draft.title}
              onChange={(event) => updateDraft({ ...draft, title: event.target.value })}
              aria-invalid={Boolean(formError && !draft.title.trim())}
            />
          </label>
          {model.outcome ? (
            <p className="bet-detail-goal">
              Goal · <span>{model.outcome.title}</span>
            </p>
          ) : null}
          {model.techAtCoreCue ? (
            <p className="bet-detail-tech-core" data-testid="bet-tech-at-core">
              {model.techAtCoreCue}
            </p>
          ) : null}
          {model.techRadarUrl ? (
            <p className="bet-detail-radar">
              Tech radar ·{' '}
              <a href={model.techRadarUrl} target="_blank" rel="noreferrer">
                {model.techRadarUrl}
              </a>
            </p>
          ) : null}
        </div>
        <label className="bet-detail-status-field">
          <span className="sr-only">Status</span>
          <select
            className="bet-detail-status-select"
            value={draft.status}
            onChange={(event) =>
              updateDraft({ ...draft, status: event.target.value as BetDetailStatus })
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="bet-detail-sections">
        <section className="bet-detail-card" aria-labelledby="bet-success-heading">
          <h2 id="bet-success-heading" className="bet-detail-card-title">
            What success looks like
          </h2>
          <label className="bet-detail-field">
            <span className="sr-only">Success signal</span>
            <textarea
              className="bet-detail-textarea"
              rows={3}
              value={draft.successSignal}
              onChange={(event) => updateDraft({ ...draft, successSignal: event.target.value })}
            />
          </label>
        </section>

        <section className="bet-detail-card" aria-labelledby="bet-mos-heading">
          <h2 id="bet-mos-heading" className="bet-detail-card-title">
            This bet should move
          </h2>
          {model.outcome ? (
            <>
              <p className="bet-detail-mos-summary">
                {model.outcome.summary ?? model.outcome.title}
              </p>
              {model.outcome.measures.length > 0 ? (
                <ul className="bet-detail-mos-list">
                  {model.outcome.measures.map((measure) => (
                    <li key={measure.id}>
                      <strong>{measure.title}</strong>
                      <span>{measure.cue}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="bet-detail-mos-empty">This goal has no Measures of Success yet.</p>
              )}
            </>
          ) : (
            <p className="bet-detail-mos-empty">No linked goal in this workspace.</p>
          )}
        </section>

        <section className="bet-detail-card" aria-labelledby="bet-kill-heading">
          <h2 id="bet-kill-heading" className="bet-detail-card-title">
            When we stop
          </h2>
          <label className="bet-detail-field">
            <span className="sr-only">Kill criteria</span>
            <textarea
              className="bet-detail-textarea"
              rows={3}
              value={draft.killCriteria}
              onChange={(event) => updateDraft({ ...draft, killCriteria: event.target.value })}
              aria-invalid={Boolean(formError && !draft.killCriteria.trim())}
            />
          </label>
        </section>

        <section className="bet-detail-card" aria-labelledby="bet-teams-heading">
          <BetWhoDeliversPanel
            spec={session.spec}
            fundedTeamIds={draft.fundedTeamIds}
            teamGroups={model.fundedTeamGroups}
            deliveryLoadLines={deliveryLoadLines}
            onToggleTeam={toggleTeam}
          />
        </section>

        <section className="bet-detail-card" aria-labelledby="bet-metrics-heading">
          <h2 id="bet-metrics-heading" className="bet-detail-card-title">
            Measures this bet moves
          </h2>
          {model.metricOptions.length === 0 ? (
            <p className="bet-detail-mos-empty">No metrics recorded in this workspace yet.</p>
          ) : (
            <>
              <fieldset className="bet-detail-teams">
                <legend className="sr-only">Linked metrics</legend>
                {model.metricOptions.map((metric) => (
                  <label key={metric.id} className="bet-detail-team">
                    <input
                      type="checkbox"
                      checked={draft.metricIds.includes(metric.id)}
                      onChange={() => toggleMetric(metric.id)}
                    />
                    <span>
                      {metric.title}
                      <span className="bet-detail-metric-goal"> · {metric.outcomeTitle}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="bet-detail-inline-field">
                <span>Primary metric</span>
                <select
                  value={draft.primaryMetricId ?? ''}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      primaryMetricId: event.target.value ? event.target.value : null,
                    })
                  }
                >
                  <option value="">None</option>
                  {model.metricOptions
                    .filter((metric) => draft.metricIds.includes(metric.id))
                    .map((metric) => (
                      <option key={metric.id} value={metric.id}>
                        {metric.title}
                      </option>
                    ))}
                </select>
              </label>
            </>
          )}
        </section>

        <section className="bet-detail-card" aria-labelledby="bet-funding-heading">
          <h2 id="bet-funding-heading" className="bet-detail-card-title">
            Funding &amp; review
          </h2>
          <div className="bet-detail-grid">
            <label className="bet-detail-inline-field">
              <span>Funding stance</span>
              <select
                value={draft.fundingStance ?? ''}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
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
            <label className="bet-detail-inline-field">
              <span>Kind</span>
              <select
                value={draft.kind ?? ''}
                onChange={(event) =>
                  updateDraft({
                    ...draft,
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
            <label className="bet-detail-inline-field">
              <span>Review date</span>
              <input
                type="date"
                value={draft.reviewDate}
                onChange={(event) => updateDraft({ ...draft, reviewDate: event.target.value })}
              />
            </label>
            <label className="bet-detail-inline-field">
              <span>Horizon</span>
              <input
                type="text"
                value={draft.horizon}
                placeholder="Q3 review"
                onChange={(event) => updateDraft({ ...draft, horizon: event.target.value })}
              />
            </label>
          </div>
        </section>

        <section
          className="bet-detail-card"
          aria-labelledby="bet-initiatives-heading"
          data-testid="bet-initiatives"
        >
          <h2 id="bet-initiatives-heading" className="bet-detail-card-title">
            Initiatives
          </h2>
          <p className="bet-detail-teams-lead">
            Thin narrative slices toward the Measure of Success - never a dual backlog.
          </p>
          {model.initiatives.length === 0 ? (
            <p className="bet-detail-mos-empty">No initiatives on this bet yet.</p>
          ) : (
            <ul className="bet-detail-initiative-list">
              {model.initiatives.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.successSignal}</span>
                  {item.externalUrl ? (
                    <a href={item.externalUrl} target="_blank" rel="noreferrer">
                      Tracker
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <div className="bet-detail-initiative-form">
            <label className="bet-detail-inline-field">
              <span>New initiative title</span>
              <input
                type="text"
                value={initiativeDraft.title}
                onChange={(event) =>
                  setInitiativeDraft({ ...initiativeDraft, title: event.target.value })
                }
              />
            </label>
            <label className="bet-detail-inline-field">
              <span>Success signal</span>
              <input
                type="text"
                value={initiativeDraft.successSignal}
                onChange={(event) =>
                  setInitiativeDraft({ ...initiativeDraft, successSignal: event.target.value })
                }
              />
            </label>
            <label className="bet-detail-inline-field">
              <span>External tracker URL (optional)</span>
              <input
                type="url"
                value={initiativeDraft.externalUrl}
                onChange={(event) =>
                  setInitiativeDraft({ ...initiativeDraft, externalUrl: event.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const applied = applyAddInitiative(session.spec, model.id, initiativeDraft);
                if (!applied.ok) {
                  setInitiativeError(applied.error);
                  return;
                }
                setSession({ ...session, spec: applied.value });
                setInitiativeDraft({ title: '', successSignal: '', externalUrl: '' });
                setInitiativeError(null);
              }}
            >
              Add initiative
            </button>
            {initiativeError ? <p className="bet-detail-error">{initiativeError}</p> : null}
          </div>
        </section>
      </div>

      {(formError || warning || savedFlash) && (
        <div className="bet-detail-feedback" role="status">
          {formError ? <p className="bet-detail-error">{formError}</p> : null}
          {!formError && warning ? <p className="bet-detail-warning">{warning}</p> : null}
          {!formError && savedFlash ? (
            <p className="bet-detail-saved">Saved to this workspace session.</p>
          ) : null}
        </div>
      )}

      <div className="bet-detail-actions">
        {layout === 'page' ? (
          <Link href="/workspace/steering" className="btn-secondary" onClick={onBack}>
            Back to steering
          </Link>
        ) : (
          <button type="button" className="btn-secondary" onClick={requestClose}>
            Close
          </button>
        )}
        <button type="button" className="btn-primary" onClick={onSave}>
          Save
        </button>
      </div>
    </section>
  );
}

export { confirmLeaveIfDirty };
