import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { stashDecisionNoteMeasured } from '../application/decisionNoteSeed';
import {
  applyAddEvidence,
  applyEvidenceMetricEdit,
  presentEvidence,
  type EvidenceCard,
} from '../application/presentEvidence';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

type MetricDraft = {
  current: string;
  target: string;
};

type AddDraft = {
  outcomeId: string;
  title: string;
  unit: string;
  current: string;
  target: string;
  interpretation: string;
  note: string;
};

function draftFromCard(card: EvidenceCard): MetricDraft {
  return {
    current: card.current === null ? '' : String(card.current),
    target: card.target === null ? '' : String(card.target),
  };
}

function emptyAddDraft(outcomeId: string): AddDraft {
  return {
    outcomeId,
    title: '',
    unit: '',
    current: '',
    target: '',
    interpretation: '',
    note: '',
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
  const [adding, setAdding] = useState(false);
  const [addDraft, setAddDraft] = useState<AddDraft | null>(null);
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
      document.title = `Evidence · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  if (!session || !model) return null;

  const openAddForm = () => {
    if (model.outcomeOptions.length === 0) {
      setError('Add a goal on Goals before recording evidence.');
      setSavedFlash(null);
      return;
    }
    setAdding(true);
    setAddDraft(emptyAddDraft(model.outcomeOptions[0]?.id ?? ''));
    setEditing(null);
    setError(null);
    setSavedFlash(null);
  };

  const closeAddForm = () => {
    setAdding(false);
    setAddDraft(null);
  };

  const startEdit = (card: EvidenceCard) => {
    setEditing({
      outcomeId: card.outcomeId,
      metricId: card.metricId,
      draft: draftFromCard(card),
    });
    closeAddForm();
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

  const saveAdd = () => {
    if (!addDraft) return;
    const applied = applyAddEvidence(session.spec, addDraft);
    if (!applied.ok) {
      setError(applied.error);
      setSavedFlash(null);
      return;
    }
    setSession({ ...session, spec: applied.value });
    closeAddForm();
    setError(null);
    setSavedFlash('Evidence added to this workspace session.');
  };

  const useInDecisionNote = (lines: string[]) => {
    stashDecisionNoteMeasured(lines);
    setLocation('/workspace/decisions');
  };

  return (
    <section className="evidence-page" data-testid="evidence-page">
      <header className="evidence-header">
        <div className="evidence-header-top">
          <div>
            <p className="eyebrow">Evidence · adapt</p>
            <h1 className="evidence-title">What the numbers say</h1>
          </div>
          <button
            type="button"
            className="btn-primary"
            data-testid="evidence-add-cta"
            onClick={openAddForm}
          >
            Add evidence
          </button>
        </div>
        <p className="evidence-framing">{model.framingLine}</p>
        <p className="evidence-banner" data-testid="evidence-sample-banner">
          {model.sampleBanner}
        </p>
      </header>

      {adding && addDraft ? (
        <form
          className="evidence-add-form"
          data-testid="evidence-add-form"
          onSubmit={(event) => {
            event.preventDefault();
            saveAdd();
          }}
        >
          <h2 className="evidence-add-title">Add a measure</h2>
          <p className="evidence-add-lead">
            Attach a reading to a goal. Source is recorded as manual until live connectors exist.
          </p>
          <label className="evidence-card-field">
            <span>Goal</span>
            <select
              value={addDraft.outcomeId}
              onChange={(event) => setAddDraft({ ...addDraft, outcomeId: event.target.value })}
              required
            >
              {model.outcomeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </select>
          </label>
          <label className="evidence-card-field">
            <span>Title</span>
            <input
              value={addDraft.title}
              onChange={(event) => setAddDraft({ ...addDraft, title: event.target.value })}
              required
              placeholder="Promise hit rate"
            />
          </label>
          <label className="evidence-card-field">
            <span>Unit</span>
            <input
              value={addDraft.unit}
              onChange={(event) => setAddDraft({ ...addDraft, unit: event.target.value })}
              placeholder="percent, days, …"
            />
          </label>
          <div className="evidence-add-row">
            <label className="evidence-card-field">
              <span>Current</span>
              <input
                value={addDraft.current}
                onChange={(event) => setAddDraft({ ...addDraft, current: event.target.value })}
                inputMode="decimal"
              />
            </label>
            <label className="evidence-card-field">
              <span>Target</span>
              <input
                value={addDraft.target}
                onChange={(event) => setAddDraft({ ...addDraft, target: event.target.value })}
                inputMode="decimal"
              />
            </label>
          </div>
          <label className="evidence-card-field">
            <span>What we learned</span>
            <textarea
              value={addDraft.interpretation}
              onChange={(event) => setAddDraft({ ...addDraft, interpretation: event.target.value })}
              rows={2}
              placeholder="Plain-language cue for the decision note"
            />
          </label>
          <label className="evidence-card-field">
            <span>Note</span>
            <input
              value={addDraft.note}
              onChange={(event) => setAddDraft({ ...addDraft, note: event.target.value })}
              placeholder="Where this reading came from"
            />
          </label>
          <div className="evidence-card-edit-actions">
            <button type="button" className="btn-tertiary" onClick={closeAddForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save evidence
            </button>
          </div>
        </form>
      ) : null}

      {model.cards.length === 0 && !adding ? (
        <div className="evidence-empty" data-testid="evidence-empty">
          <p>No measures of success yet.</p>
          <button type="button" className="btn-primary" onClick={openAddForm}>
            Add evidence
          </button>
        </div>
      ) : null}

      {model.cards.length > 0 ? (
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
                <p className="evidence-card-goal">{card.outcomeTitle}</p>
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
      ) : null}

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
