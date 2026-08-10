import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  applyOutcomeMetricEdit,
  presentOutcomes,
  type OutcomesMeasure,
} from '../application/presentOutcomes';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

type MetricDraft = {
  current: string;
  target: string;
};

function draftFromMeasure(measure: OutcomesMeasure): MetricDraft {
  return {
    current: measure.current === null ? '' : String(measure.current),
    target: measure.target === null ? '' : String(measure.target),
  };
}

export function OutcomesPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState<{
    outcomeId: string;
    metricId: string;
    draft: MetricDraft;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentOutcomes(session.spec) : null), [session]);

  useEffect(() => {
    if (model) {
      document.title = `Outcomes · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  const startEdit = (outcomeId: string, measure: OutcomesMeasure) => {
    setEditing({
      outcomeId,
      metricId: measure.id,
      draft: draftFromMeasure(measure),
    });
    setError(null);
    setSavedFlash(null);
  };

  const cancelEdit = () => {
    setEditing(null);
    setError(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    const applied = applyOutcomeMetricEdit(
      session.spec,
      editing.outcomeId,
      editing.metricId,
      editing.draft,
    );
    if (!applied.ok) {
      setError(applied.error);
      return;
    }
    setSession({ ...session, spec: applied.value });
    setEditing(null);
    setError(null);
    setSavedFlash('Saved measure to this workspace session.');
  };

  return (
    <section className="outcomes-page" data-testid="outcomes-page">
      <header className="outcomes-header">
        <p className="eyebrow">Outcomes</p>
        <h1 className="outcomes-title">Are we getting the outcome?</h1>
        <p className="outcomes-framing">{model.framingLine}</p>
      </header>

      <div className="outcomes-list">
        {model.outcomes.map((outcome) => (
          <article
            key={outcome.id}
            className="outcomes-section"
            aria-labelledby={`outcome-${outcome.id}`}
          >
            <div className="outcomes-section-header">
              <div>
                <p className="eyebrow">Primary outcome</p>
                <h2 id={`outcome-${outcome.id}`} className="outcomes-section-title">
                  {outcome.title}
                </h2>
                {outcome.summary ? (
                  <p className="outcomes-section-summary">{outcome.summary}</p>
                ) : null}
              </div>
              <p className="outcomes-section-status">{outcome.statusLabel}</p>
            </div>

            <ul className="outcomes-mos-grid">
              {outcome.measures.map((measure) => {
                const isEditing =
                  editing?.outcomeId === outcome.id && editing.metricId === measure.id;
                return (
                  <li key={measure.id} className="outcomes-mos-card">
                    <p className="outcomes-mos-title">{measure.title}</p>
                    <p className="outcomes-mos-value" aria-label={measure.textAlternative}>
                      {measure.displayValue}
                    </p>
                    <p className="outcomes-mos-interpretation">{measure.interpretation}</p>

                    {isEditing && editing ? (
                      <div className="outcomes-mos-edit">
                        <label className="outcomes-mos-field">
                          <span>Current</span>
                          <input
                            inputMode="decimal"
                            value={editing.draft.current}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                draft: { ...editing.draft, current: event.target.value },
                              })
                            }
                          />
                        </label>
                        <label className="outcomes-mos-field">
                          <span>Target</span>
                          <input
                            inputMode="decimal"
                            value={editing.draft.target}
                            onChange={(event) =>
                              setEditing({
                                ...editing,
                                draft: { ...editing.draft, target: event.target.value },
                              })
                            }
                          />
                        </label>
                        <div className="outcomes-mos-edit-actions">
                          <button type="button" className="btn-secondary" onClick={cancelEdit}>
                            Cancel
                          </button>
                          <button type="button" className="btn-primary" onClick={saveEdit}>
                            Save measure
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="outcomes-mos-edit-trigger"
                        onClick={() => startEdit(outcome.id, measure)}
                      >
                        Edit current / target
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <section className="outcomes-bets" aria-labelledby={`outcome-bets-${outcome.id}`}>
              <h3 id={`outcome-bets-${outcome.id}`} className="outcomes-bets-title">
                Funded bets
              </h3>
              <ul className="outcomes-bet-list">
                {outcome.bets.map((bet) => (
                  <li key={bet.id}>
                    <Link
                      href={`/workspace/bets/${bet.id}`}
                      className="outcomes-bet-row"
                      data-status={bet.statusTone}
                    >
                      <div>
                        <p className="outcomes-bet-title">{bet.title}</p>
                        <p className="outcomes-bet-cue">{bet.progressCue}</p>
                      </div>
                      <span
                        className={
                          bet.statusTone === 'on-track'
                            ? 'status-on-track'
                            : bet.statusTone === 'at-risk'
                              ? 'status-at-risk'
                              : bet.statusTone === 'stop'
                                ? 'status-stop'
                                : 'text-ink-muted'
                        }
                      >
                        {bet.statusLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </article>
        ))}
      </div>

      {(error || savedFlash) && (
        <div className="outcomes-feedback" role="status">
          {error ? <p className="outcomes-error">{error}</p> : null}
          {!error && savedFlash ? <p className="outcomes-saved">{savedFlash}</p> : null}
        </div>
      )}
    </section>
  );
}
