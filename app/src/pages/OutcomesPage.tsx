import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  applyOutcomeMetricEdit,
  applyProductDraft,
  presentOutcomes,
  type OutcomesMeasure,
} from '../application/presentOutcomes';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';
import { OutcomesValueTree } from '../components/outcomes/OutcomesValueTree';

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
  const [productDraft, setProductDraft] = useState<{
    id?: string;
    title: string;
    problem: string;
    customers: string;
    nonGoals: string;
    outcomeIds: string[];
    betIds: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentOutcomes(session.spec) : null), [session]);

  const betLinkOptions = useMemo(() => {
    if (!model) return [];
    return model.outcomes.flatMap((outcome) =>
      outcome.bets.map((bet) => ({
        id: bet.id,
        title: bet.title,
        outcomeTitle: outcome.title,
      })),
    );
  }, [model]);

  useEffect(() => {
    if (model) {
      document.title = `Outcomes · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  const toggleProductOutcome = (outcomeId: string) => {
    if (!productDraft) return;
    const selected = productDraft.outcomeIds.includes(outcomeId)
      ? productDraft.outcomeIds.filter((id) => id !== outcomeId)
      : [...productDraft.outcomeIds, outcomeId];
    setProductDraft({ ...productDraft, outcomeIds: selected });
  };

  const toggleProductBet = (betId: string) => {
    if (!productDraft) return;
    const selected = productDraft.betIds.includes(betId)
      ? productDraft.betIds.filter((id) => id !== betId)
      : [...productDraft.betIds, betId];
    setProductDraft({ ...productDraft, betIds: selected });
  };

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

      <OutcomesValueTree spec={session.spec} />

      <section className="outcomes-products" aria-labelledby="outcomes-products-heading">
        <div className="outcomes-section-header">
          <div>
            <p className="eyebrow">Product briefs</p>
            <h2 id="outcomes-products-heading" className="outcomes-section-title">
              Product mindset
            </h2>
            <p className="outcomes-section-summary">
              Short product briefs - customer problem and linked outcomes/bets, not requirements
              docs.
            </p>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setProductDraft({
                title: '',
                problem: '',
                customers: '',
                nonGoals: '',
                outcomeIds: model.outcomes[0] ? [model.outcomes[0].id] : [],
                betIds: [],
              });
              setError(null);
              setSavedFlash(null);
            }}
          >
            Add product
          </button>
        </div>
        {model.products.length === 0 ? (
          <p className="outcomes-mos-claims-empty">No product briefs yet.</p>
        ) : (
          <ul className="outcomes-product-list" data-testid="outcomes-products">
            {model.products.map((product) => (
              <li key={product.id} className="outcomes-product-card">
                <h3 className="outcomes-product-title">{product.title}</h3>
                <p className="outcomes-product-problem">{product.problem}</p>
                {product.customers ? (
                  <p className="outcomes-product-meta">Customers · {product.customers}</p>
                ) : null}
                {product.outcomeTitles.length > 0 ? (
                  <p className="outcomes-product-meta">
                    Outcomes · {product.outcomeTitles.join(', ')}
                  </p>
                ) : null}
                {product.betLinks.length > 0 ? (
                  <p className="outcomes-product-meta">
                    Bets ·{' '}
                    {product.betLinks.map((bet, index) => (
                      <span key={bet.id}>
                        {index > 0 ? ', ' : null}
                        <Link href={`/workspace/bets/${bet.id}`}>{bet.title}</Link>
                      </span>
                    ))}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="outcomes-mos-edit-trigger"
                  onClick={() => {
                    setProductDraft({
                      id: product.id,
                      title: product.title,
                      problem: product.problem,
                      customers: product.customers ?? '',
                      nonGoals: product.nonGoals ?? '',
                      outcomeIds: [...product.outcomeIds],
                      betIds: [...product.betIds],
                    });
                    setError(null);
                    setSavedFlash(null);
                  }}
                >
                  Edit brief
                </button>
              </li>
            ))}
          </ul>
        )}
        {productDraft ? (
          <div className="outcomes-product-edit" data-testid="outcomes-product-edit">
            <label className="outcomes-mos-field">
              <span>Title</span>
              <input
                value={productDraft.title}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, title: event.target.value })
                }
              />
            </label>
            <label className="outcomes-mos-field">
              <span>Problem</span>
              <input
                value={productDraft.problem}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, problem: event.target.value })
                }
              />
            </label>
            <label className="outcomes-mos-field">
              <span>Customers</span>
              <input
                value={productDraft.customers}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, customers: event.target.value })
                }
              />
            </label>
            <label className="outcomes-mos-field">
              <span>Non-goals</span>
              <input
                value={productDraft.nonGoals}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, nonGoals: event.target.value })
                }
              />
            </label>
            <fieldset className="outcomes-product-links" data-testid="outcomes-product-outcomes">
              <legend>Linked outcomes</legend>
              {model.outcomes.length === 0 ? (
                <p className="outcomes-mos-claims-empty">No outcomes in this workspace yet.</p>
              ) : (
                <div className="outcomes-product-link-list">
                  {model.outcomes.map((outcome) => (
                    <label key={outcome.id} className="outcomes-product-link">
                      <input
                        type="checkbox"
                        checked={productDraft.outcomeIds.includes(outcome.id)}
                        onChange={() => toggleProductOutcome(outcome.id)}
                      />
                      <span>{outcome.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <fieldset className="outcomes-product-links" data-testid="outcomes-product-bets">
              <legend>Linked bets</legend>
              {betLinkOptions.length === 0 ? (
                <p className="outcomes-mos-claims-empty">No bets in this workspace yet.</p>
              ) : (
                <div className="outcomes-product-link-list">
                  {betLinkOptions.map((bet) => (
                    <label key={bet.id} className="outcomes-product-link">
                      <input
                        type="checkbox"
                        checked={productDraft.betIds.includes(bet.id)}
                        onChange={() => toggleProductBet(bet.id)}
                      />
                      <span>
                        {bet.title}
                        <span className="outcomes-product-link-meta"> · {bet.outcomeTitle}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <div className="outcomes-mos-edit-actions outcomes-product-edit-actions">
              <button type="button" className="btn-secondary" onClick={() => setProductDraft(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const applied = applyProductDraft(session.spec, {
                    id: productDraft.id,
                    title: productDraft.title,
                    problem: productDraft.problem,
                    customers: productDraft.customers,
                    nonGoals: productDraft.nonGoals,
                    outcomeIds: productDraft.outcomeIds,
                    betIds: productDraft.betIds,
                  });
                  if (!applied.ok) {
                    setError(applied.error);
                    return;
                  }
                  setSession({ ...session, spec: applied.value });
                  setProductDraft(null);
                  setError(null);
                  setSavedFlash('Saved product brief to this workspace session.');
                }}
              >
                Save brief
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <div className="outcomes-list">
        <div className="outcomes-list-intro">
          <p className="eyebrow">Detail by branch</p>
          <p className="outcomes-list-intro-copy">
            Each block is one outcome branch of the tree: Measures of Success, then the bets funded
            to move them.
          </p>
        </div>
        {model.outcomes.map((outcome) => (
          <article
            key={outcome.id}
            className="outcomes-section"
            aria-labelledby={`outcome-${outcome.id}`}
          >
            <div className="outcomes-section-header">
              <div>
                <p className="eyebrow">
                  Vision → Outcome
                  {outcome.bets.length > 0
                    ? ` → ${outcome.bets.length} bet${outcome.bets.length === 1 ? '' : 's'}`
                    : ''}
                </p>
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
                    {measure.claimedByBets.length > 0 ? (
                      <p className="outcomes-mos-claims">
                        Claimed by{' '}
                        {measure.claimedByBets.map((bet, index) => (
                          <span key={bet.id}>
                            {index > 0 ? ', ' : null}
                            <Link href={`/workspace/bets/${bet.id}`}>{bet.title}</Link>
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p className="outcomes-mos-claims outcomes-mos-claims-empty">
                        No bet claims this measure yet.
                      </p>
                    )}

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
