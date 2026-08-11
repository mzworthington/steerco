import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  applyGoalMetricEdit,
  presentGoals,
  type GoalMeasure,
  type GoalProductCard,
  type GoalSection,
  type GoalsModel,
} from '../application/presentGoals';
import { presentValueTree, type ValueTreeGraphNode } from '../application/presentValueTree';
import { BetDetailModal } from '../components/bets/BetDetailModal';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';
import { GoalsValueTree } from '../components/goals/GoalsValueTree';

type MetricDraft = {
  current: string;
  target: string;
};

function draftFromMeasure(measure: GoalMeasure): MetricDraft {
  return {
    current: measure.current === null ? '' : String(measure.current),
    target: measure.target === null ? '' : String(measure.target),
  };
}

function productsLinkedToGoal(products: GoalProductCard[], goalId: string): GoalProductCard[] {
  return products.filter((product) => product.outcomeIds.includes(goalId));
}

function betIdFromHref(href: string): string | null {
  const match = href.match(/^\/workspace\/bets\/([^/?#]+)/);
  return match?.[1] ?? null;
}

export function GoalsPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [selectedId, setSelectedId] = useState<string | null>('vision');
  const [openBetId, setOpenBetId] = useState<string | null>(null);
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

  const model = useMemo(() => (session ? presentGoals(session.spec) : null), [session]);
  const tree = useMemo(() => (session ? presentValueTree(session.spec, 'TB') : null), [session]);
  const selectedNode = useMemo(() => {
    if (!tree) return null;
    return tree.nodes.find((node) => node.id === selectedId) ?? null;
  }, [tree, selectedId]);

  useEffect(() => {
    if (model) {
      document.title = `Goals · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  if (!session || !model || !tree) return null;

  const startEdit = (outcomeId: string, measure: GoalMeasure) => {
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
    const applied = applyGoalMetricEdit(
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
    <section className="goals-page" data-testid="goals-page">
      <header className="goals-header">
        <p className="eyebrow">Goals</p>
        <h1 className="goals-title">Are we getting the goal?</h1>
        <p className="goals-framing">{model.framingLine}</p>
      </header>

      <GoalsValueTree
        spec={session.spec}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
      />

      <div className="goals-selection" aria-live="polite" data-testid="goals-selection">
        {selectedNode ? (
          <SelectedNodeDetail
            node={selectedNode}
            vision={tree.vision}
            model={model}
            editing={editing}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onDraftChange={(draft) => {
              if (!editing) return;
              setEditing({ ...editing, draft });
            }}
            onOpenBet={setOpenBetId}
          />
        ) : (
          <p className="goals-selection-empty" data-testid="goals-selection-empty">
            Select a node in the Lean Value Tree for Measures of Success, bets, and linked product
            briefs.
          </p>
        )}
      </div>

      {(error || savedFlash) && (
        <div className="goals-feedback" role="status">
          {error ? <p className="goals-error">{error}</p> : null}
          {!error && savedFlash ? <p className="goals-saved">{savedFlash}</p> : null}
        </div>
      )}

      {openBetId ? <BetDetailModal betId={openBetId} onClose={() => setOpenBetId(null)} /> : null}
    </section>
  );
}

type SelectedNodeDetailProps = {
  node: ValueTreeGraphNode;
  vision: string;
  model: GoalsModel;
  editing: { outcomeId: string; metricId: string; draft: MetricDraft } | null;
  onStartEdit: (outcomeId: string, measure: GoalMeasure) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: MetricDraft) => void;
  onOpenBet: (betId: string) => void;
};

function SelectedNodeDetail({
  node,
  vision,
  model,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
  onOpenBet,
}: SelectedNodeDetailProps) {
  if (node.kind === 'goal') {
    const outcome = model.outcomes.find((item) => item.id === node.id);
    if (outcome) {
      return (
        <GoalBranchDetail
          outcome={outcome}
          products={productsLinkedToGoal(model.products, outcome.id)}
          editing={editing}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSaveEdit={onSaveEdit}
          onDraftChange={onDraftChange}
          onOpenBet={onOpenBet}
        />
      );
    }
  }

  if (node.kind === 'vision') {
    return <VisionDetail vision={vision} node={node} outcomes={model.outcomes} />;
  }

  return <TreeNodeDetail node={node} vision={vision} onOpenBet={onOpenBet} />;
}

function VisionDetail({
  vision,
  node,
  outcomes,
}: {
  vision: string;
  node: ValueTreeGraphNode;
  outcomes: GoalSection[];
}) {
  return (
    <article className="goals-section" data-testid="goals-vision-detail">
      <div className="goals-section-header">
        <div>
          <p className="eyebrow">Vision</p>
          <h2 className="goals-section-title">Investment vision</h2>
          <p className="goals-section-summary">{vision}</p>
          {node.meta ? <p className="goals-node-meta">{node.meta}</p> : null}
        </div>
      </div>

      {node.facts.length > 0 ? (
        <dl className="goals-node-facts" data-testid="goals-vision-facts">
          {node.facts.map((fact) => (
            <div key={fact.label} className="goals-node-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <section className="goals-vision-branches" aria-labelledby="goals-vision-branches-heading">
        <h3 id="goals-vision-branches-heading" className="goals-bets-title">
          Goal branches
        </h3>
        <p className="goals-list-intro-copy">
          Select a goal in the tree to open Measures of Success, funded bets, and product briefs
          linked to that goal.
        </p>
        <ul className="goals-vision-goal-list">
          {outcomes.map((outcome) => (
            <li key={outcome.id} className="goals-vision-goal-row">
              <div>
                <p className="goals-bet-title">{outcome.title}</p>
                <p className="goals-bet-cue">
                  {outcome.measures.length} measure
                  {outcome.measures.length === 1 ? '' : 's'} · {outcome.bets.length} bet
                  {outcome.bets.length === 1 ? '' : 's'}
                </p>
              </div>
              <span className="text-ink-muted">{outcome.statusLabel}</span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function GoalBranchDetail({
  outcome,
  products,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDraftChange,
  onOpenBet,
}: {
  outcome: GoalSection;
  products: GoalProductCard[];
  editing: { outcomeId: string; metricId: string; draft: MetricDraft } | null;
  onStartEdit: (outcomeId: string, measure: GoalMeasure) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDraftChange: (draft: MetricDraft) => void;
  onOpenBet: (betId: string) => void;
}) {
  return (
    <article
      className="goals-section"
      aria-labelledby={`outcome-${outcome.id}`}
      data-testid="goals-goal-detail"
    >
      <div className="goals-section-header">
        <div>
          <p className="eyebrow">
            Vision → Goal
            {outcome.bets.length > 0
              ? ` → ${outcome.bets.length} bet${outcome.bets.length === 1 ? '' : 's'}`
              : ''}
          </p>
          <h2 id={`outcome-${outcome.id}`} className="goals-section-title">
            {outcome.title}
          </h2>
          {outcome.summary ? <p className="goals-section-summary">{outcome.summary}</p> : null}
        </div>
        <p className="goals-section-status">{outcome.statusLabel}</p>
      </div>

      <ul className="goals-mos-grid">
        {outcome.measures.map((measure) => {
          const isEditing = editing?.outcomeId === outcome.id && editing.metricId === measure.id;
          return (
            <li key={measure.id} className="goals-mos-card">
              <p className="goals-mos-title">{measure.title}</p>
              <p className="goals-mos-value" aria-label={measure.textAlternative}>
                {measure.displayValue}
              </p>
              <p className="goals-mos-interpretation">{measure.interpretation}</p>
              {measure.claimedByBets.length > 0 ? (
                <p className="goals-mos-claims">
                  Claimed by{' '}
                  {measure.claimedByBets.map((bet, index) => (
                    <span key={bet.id}>
                      {index > 0 ? ', ' : null}
                      <button
                        type="button"
                        className="goals-node-link"
                        onClick={() => onOpenBet(bet.id)}
                      >
                        {bet.title}
                      </button>
                    </span>
                  ))}
                </p>
              ) : (
                <p className="goals-mos-claims goals-mos-claims-empty">
                  No bet claims this measure yet.
                </p>
              )}

              {isEditing && editing ? (
                <div className="goals-mos-edit">
                  <label className="goals-mos-field">
                    <span>Current</span>
                    <input
                      inputMode="decimal"
                      value={editing.draft.current}
                      onChange={(event) =>
                        onDraftChange({ ...editing.draft, current: event.target.value })
                      }
                    />
                  </label>
                  <label className="goals-mos-field">
                    <span>Target</span>
                    <input
                      inputMode="decimal"
                      value={editing.draft.target}
                      onChange={(event) =>
                        onDraftChange({ ...editing.draft, target: event.target.value })
                      }
                    />
                  </label>
                  <div className="goals-mos-edit-actions">
                    <button type="button" className="btn-secondary" onClick={onCancelEdit}>
                      Cancel
                    </button>
                    <button type="button" className="btn-primary" onClick={onSaveEdit}>
                      Save measure
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="goals-mos-edit-trigger"
                  onClick={() => onStartEdit(outcome.id, measure)}
                >
                  Edit current / target
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <section className="goals-bets" aria-labelledby={`outcome-bets-${outcome.id}`}>
        <h3 id={`outcome-bets-${outcome.id}`} className="goals-bets-title">
          Funded bets
        </h3>
        <ul className="goals-bet-list">
          {outcome.bets.map((bet) => (
            <li key={bet.id}>
              <button
                type="button"
                className="goals-bet-row"
                data-status={bet.statusTone}
                onClick={() => onOpenBet(bet.id)}
              >
                <div>
                  <p className="goals-bet-title">{bet.title}</p>
                  <p className="goals-bet-cue">{bet.progressCue}</p>
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
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section
        className="goals-linked-products"
        aria-labelledby={`outcome-products-${outcome.id}`}
        data-testid="goals-linked-products"
      >
        <div className="goals-section-header">
          <div>
            <h3 id={`outcome-products-${outcome.id}`} className="goals-bets-title">
              Product briefs linked to this goal
            </h3>
            <p className="goals-list-intro-copy">
              Only briefs that list this goal. Manage all briefs on the Product briefs page.
            </p>
          </div>
          <Link href="/workspace/products" className="btn-secondary">
            Manage briefs
          </Link>
        </div>
        {products.length === 0 ? (
          <p className="goals-mos-claims-empty">No product briefs linked to this goal yet.</p>
        ) : (
          <ul className="goals-product-list">
            {products.map((product) => (
              <li key={product.id} className="goals-product-card">
                <h4 className="goals-product-title">{product.title}</h4>
                <p className="goals-product-problem">{product.problem}</p>
                {product.customers ? (
                  <p className="goals-product-meta">Customers · {product.customers}</p>
                ) : null}
                {product.betLinks.length > 0 ? (
                  <p className="goals-product-meta">
                    Bets ·{' '}
                    {product.betLinks.map((bet, index) => (
                      <span key={bet.id}>
                        {index > 0 ? ', ' : null}
                        <button
                          type="button"
                          className="goals-node-link"
                          data-testid="goals-product-bet"
                          onClick={() => onOpenBet(bet.id)}
                        >
                          {bet.title}
                        </button>
                      </span>
                    ))}
                  </p>
                ) : null}
                <Link href="/workspace/products" className="goals-mos-edit-trigger">
                  Edit on Product briefs
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function TreeNodeDetail({
  node,
  vision,
  onOpenBet,
}: {
  node: ValueTreeGraphNode;
  vision: string;
  onOpenBet: (betId: string) => void;
}) {
  const betHrefId = node.href ? betIdFromHref(node.href) : null;

  return (
    <article className="goals-section" data-testid={`goals-${node.kind}-detail`}>
      <div className="goals-section-header">
        <div>
          <p className="eyebrow">{kindLabel(node.kind)}</p>
          <h2 className="goals-section-title">
            {node.kind === 'vision' ? 'Investment vision' : node.label}
          </h2>
          <p className="goals-section-summary">{node.kind === 'vision' ? vision : node.summary}</p>
          {node.statusLabel ? (
            <p className="goals-node-status" data-testid="goals-node-status">
              {node.statusLabel}
            </p>
          ) : null}
          {node.meta ? (
            <p className="goals-node-meta" data-testid="goals-node-meta">
              {node.meta}
            </p>
          ) : null}
        </div>
      </div>

      {node.measures.length > 0 ? (
        <section className="goals-node-measures" data-testid="goals-node-measures">
          <h3 className="goals-bets-title">Measures of success</h3>
          <ul className="goals-mos-grid">
            {node.measures.map((measure) => (
              <li key={measure.id} className="goals-mos-card">
                <p className="goals-mos-title">{measure.title}</p>
                <p className="goals-mos-value">{measure.displayValue}</p>
                {measure.targetLabel ? (
                  <p className="goals-mos-interpretation">{measure.targetLabel}</p>
                ) : null}
                <p className="goals-mos-interpretation">{measure.interpretation}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {node.facts.length > 0 ? (
        <dl className="goals-node-facts" data-testid="goals-node-facts">
          {node.facts.map((fact) => (
            <div key={fact.label} className="goals-node-fact">
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {node.href && node.hrefLabel ? (
        node.href.startsWith('http') ? (
          <a className="goals-node-link" href={node.href} target="_blank" rel="noreferrer">
            {node.hrefLabel}
          </a>
        ) : betHrefId ? (
          <button
            type="button"
            className="goals-node-link"
            onClick={() => onOpenBet(betHrefId)}
            data-testid="goals-open-bet"
          >
            {node.hrefLabel}
          </button>
        ) : (
          <Link href={node.href} className="goals-node-link">
            {node.hrefLabel}
          </Link>
        )
      ) : null}
    </article>
  );
}

function kindLabel(kind: ValueTreeGraphNode['kind']): string {
  switch (kind) {
    case 'vision':
      return 'Vision';
    case 'goal':
      return 'Goal';
    case 'bet':
      return 'Bet';
    case 'initiative':
      return 'Initiative';
  }
}
