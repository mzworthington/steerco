import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { stashDecisionNoteMeasured } from '../application/decisionNoteSeed';
import {
  applyEvidenceMetricEdit,
  presentEvidence,
  type EvidenceCard,
} from '../application/presentEvidence';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

type MetricDraft = {
  current: string;
  target: string;
};

function draftFromCard(card: EvidenceCard): MetricDraft {
  return {
    current: card.current === null ? '' : String(card.current),
    target: card.target === null ? '' : String(card.target),
  };
}

export function EvidencePage() {
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

  const model = useMemo(() => (session ? presentEvidence(session.spec) : null), [session]);

  useEffect(() => {
    if (model) {
      document.title = `Evidence · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  const startEdit = (card: EvidenceCard) => {
    setEditing({
      outcomeId: card.outcomeId,
      metricId: card.metricId,
      draft: draftFromCard(card),
    });
    setError(null);
    setSavedFlash(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    const applied = applyEvidenceMetricEdit(
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

  const useInDecisionNote = (lines: string[]) => {
    stashDecisionNoteMeasured(lines);
    setLocation('/workspace/decisions');
  };

  return (
    <section className="evidence-page" data-testid="evidence-page">
      <header className="evidence-header">
        <p className="eyebrow">Evidence · adapt</p>
        <h1 className="evidence-title">What the numbers say</h1>
        <p className="evidence-framing">{model.framingLine}</p>
        <p className="evidence-banner" data-testid="evidence-sample-banner">
          {model.sampleBanner}
        </p>
      </header>

      {model.cards.length === 0 ? (
        <p className="evidence-empty">No measures of success yet - add them on Outcomes.</p>
      ) : (
        <ul className="evidence-grid">
          {model.cards.map((card) => {
            const isEditing =
              editing?.outcomeId === card.outcomeId && editing.metricId === card.metricId;
            return (
              <li key={card.metricId} className="evidence-card">
                <p className="evidence-card-source">{card.sourceLabel}</p>
                <p className="evidence-card-learning">{card.learning}</p>
                <p className="evidence-card-value" aria-label={card.textAlternative}>
                  {card.displayValue}
                </p>
                <p className="evidence-card-title">{card.title}</p>
                <p className="evidence-card-outcome">{card.outcomeTitle}</p>
                {card.evidenceNote ? (
                  <p className="evidence-card-note">{card.evidenceNote}</p>
                ) : null}

                {isEditing ? (
                  <div className="evidence-card-edit">
                    <label className="evidence-card-field">
                      <span>Current</span>
                      <input
                        value={editing.draft.current}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            draft: { ...editing.draft, current: event.target.value },
                          })
                        }
                      />
                    </label>
                    <label className="evidence-card-field">
                      <span>Target</span>
                      <input
                        value={editing.draft.target}
                        onChange={(event) =>
                          setEditing({
                            ...editing,
                            draft: { ...editing.draft, target: event.target.value },
                          })
                        }
                      />
                    </label>
                    <div className="evidence-card-edit-actions">
                      <button
                        type="button"
                        className="btn-tertiary"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </button>
                      <button type="button" className="btn-primary" onClick={saveEdit}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="evidence-card-actions">
                    <button type="button" className="btn-tertiary" onClick={() => startEdit(card)}>
                      Override values
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => useInDecisionNote([card.measuredLine])}
                    >
                      Use in decision note
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(error || savedFlash) && (
        <div className="evidence-feedback" role="status">
          {error ? <p className="evidence-error">{error}</p> : null}
          {!error && savedFlash ? <p className="evidence-saved">{savedFlash}</p> : null}
        </div>
      )}

      {model.cards.length > 0 ? (
        <footer className="evidence-footer">
          <p className="evidence-footer-note">
            These readings stay on this device. Live connectors land later - until then, treat
            sample figures as illustrative.
          </p>
          <button
            type="button"
            className="btn-primary"
            data-testid="evidence-use-all"
            onClick={() => useInDecisionNote(model.allMeasuredLines)}
          >
            Use in decision note
          </button>
        </footer>
      ) : null}
    </section>
  );
}
