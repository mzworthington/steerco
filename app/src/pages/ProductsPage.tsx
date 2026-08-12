import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { applyProductDraft, presentGoals } from '../application/presentGoals';
import { lvtPath } from '../application/lvtRoutes';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function ProductsPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
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

  const model = useMemo(() => (session ? presentGoals(session.spec) : null), [session]);

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
      document.title = `Product briefs · ${model.workspaceTitle} · SteerCo`;
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

  return (
    <section className="goals-page" data-testid="products-page">
      <header className="goals-header">
        <p className="eyebrow">Product briefs</p>
        <h1 className="goals-title">Product mindset</h1>
        <p className="goals-framing">
          Short product briefs - customer problem and linked goals/bets, not requirements docs.
        </p>
      </header>

      <section className="goals-products" aria-labelledby="products-heading">
        <div className="goals-section-header">
          <div>
            <h2 id="products-heading" className="goals-section-title">
              Briefs in this workspace
            </h2>
            <p className="goals-section-summary">
              Link each brief to at least one goal so it appears under that goal on the Goals page.
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
          <p className="goals-mos-claims-empty">No product briefs yet.</p>
        ) : (
          <ul className="goals-product-list" data-testid="products-list">
            {model.products.map((product) => (
              <li key={product.id} className="goals-product-card">
                <h3 className="goals-product-title">{product.title}</h3>
                <p className="goals-product-problem">{product.problem}</p>
                {product.customers ? (
                  <p className="goals-product-meta">Customers · {product.customers}</p>
                ) : null}
                {product.outcomeTitles.length > 0 ? (
                  <p className="goals-product-meta">Goals · {product.outcomeTitles.join(', ')}</p>
                ) : (
                  <p className="goals-product-meta goals-mos-claims-empty">
                    Not linked to a goal yet - it will not appear on Goals until linked.
                  </p>
                )}
                {product.betLinks.length > 0 ? (
                  <p className="goals-product-meta">
                    Bets ·{' '}
                    {product.betLinks.map((bet, index) => (
                      <span key={bet.id}>
                        {index > 0 ? ', ' : null}
                        <Link href={lvtPath('bet', bet.id)} data-testid="products-bet">
                          {bet.title}
                        </Link>
                      </span>
                    ))}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="goals-mos-edit-trigger"
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
          <div className="goals-product-edit" data-testid="products-edit">
            <label className="goals-mos-field">
              <span>Title</span>
              <input
                value={productDraft.title}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, title: event.target.value })
                }
              />
            </label>
            <label className="goals-mos-field">
              <span>Problem</span>
              <input
                value={productDraft.problem}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, problem: event.target.value })
                }
              />
            </label>
            <label className="goals-mos-field">
              <span>Customers</span>
              <input
                value={productDraft.customers}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, customers: event.target.value })
                }
              />
            </label>
            <label className="goals-mos-field">
              <span>Non-goals</span>
              <input
                value={productDraft.nonGoals}
                onChange={(event) =>
                  setProductDraft({ ...productDraft, nonGoals: event.target.value })
                }
              />
            </label>
            <fieldset className="goals-product-links" data-testid="products-outcomes">
              <legend>Linked goals</legend>
              {model.outcomes.length === 0 ? (
                <p className="goals-mos-claims-empty">No goals in this workspace yet.</p>
              ) : (
                <div className="goals-product-link-list">
                  {model.outcomes.map((outcome) => (
                    <label key={outcome.id} className="goals-product-link">
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
            <fieldset className="goals-product-links" data-testid="products-bets">
              <legend>Linked bets</legend>
              {betLinkOptions.length === 0 ? (
                <p className="goals-mos-claims-empty">No bets in this workspace yet.</p>
              ) : (
                <div className="goals-product-link-list">
                  {betLinkOptions.map((bet) => (
                    <label key={bet.id} className="goals-product-link">
                      <input
                        type="checkbox"
                        checked={productDraft.betIds.includes(bet.id)}
                        onChange={() => toggleProductBet(bet.id)}
                      />
                      <span>
                        {bet.title}
                        <span className="goals-product-link-meta"> · {bet.outcomeTitle}</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <div className="goals-mos-edit-actions goals-product-edit-actions">
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

      {(error || savedFlash) && (
        <div className="goals-feedback" role="status">
          {error ? <p className="goals-error">{error}</p> : null}
          {!error && savedFlash ? <p className="goals-saved">{savedFlash}</p> : null}
        </div>
      )}
    </section>
  );
}
