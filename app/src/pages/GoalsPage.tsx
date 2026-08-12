import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  presentGoals,
  type GoalProductCard,
  type GoalSection,
  type GoalsModel,
} from '../application/presentGoals';
import { lvtPath, parseLvtPath } from '../application/lvtRoutes';
import {
  applyAddBet,
  applyAddGoal,
  applyAddInitiative,
  type BetDraft,
  type GoalDraft,
  type InitiativeDraft,
} from '../application/presentLvtChildren';
import { presentValueTree, type ValueTreeGraphNode } from '../application/presentValueTree';
import { LvtAddChildForm } from '../components/lvt/LvtAddChildForm';
import { LvtEditModal } from '../components/lvt/LvtEditModal';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';
import { GoalsValueTree } from '../components/goals/GoalsValueTree';

function productsLinkedToGoal(products: GoalProductCard[], goalId: string): GoalProductCard[] {
  return products.filter((product) => product.outcomeIds.includes(goalId));
}

export function GoalsPage() {
  const { session, setSession } = useWorkspaceSession();
  const [location, setLocation] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentGoals(session.spec) : null), [session]);
  const tree = useMemo(() => (session ? presentValueTree(session.spec, 'TB') : null), [session]);
  const focus = useMemo(() => parseLvtPath(location), [location]);

  const selectedNode = useMemo(() => {
    if (!tree) return null;
    if (focus) {
      const matched = tree.nodes.find((node) => node.id === focus.slug && node.kind === focus.type);
      if (matched) return matched;
    }
    return tree.nodes.find((node) => node.id === 'vision') ?? null;
  }, [tree, focus]);

  useEffect(() => {
    if (model) {
      document.title = `Goals · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  useEffect(() => {
    setEditOpen(false);
  }, [selectedNode?.id]);

  if (!session || !model || !tree || !selectedNode) return null;

  const selectNode = (id: string | null) => {
    if (!id) {
      setLocation(lvtPath());
      return;
    }
    const node = tree.nodes.find((item) => item.id === id);
    if (!node) {
      setLocation(lvtPath());
      return;
    }
    setLocation(lvtPath(node.kind, node.id));
  };

  const openNode = (kind: ValueTreeGraphNode['kind'], id: string) => {
    setLocation(lvtPath(kind, id));
  };

  const commitAdd = (
    applied: { ok: true; value: typeof session.spec; id: string } | { ok: false; error: string },
    kind: ValueTreeGraphNode['kind'],
    flash: string,
  ): { ok: true } | { ok: false; error: string } => {
    if (!applied.ok) return applied;
    setSession({ ...session, spec: applied.value });
    setSavedFlash(flash);
    openNode(kind, applied.id);
    return { ok: true };
  };

  const addGoal = (draft: GoalDraft) =>
    commitAdd(applyAddGoal(session.spec, draft), 'goal', 'Added goal to this workspace session.');

  const addBet = (outcomeId: string, draft: BetDraft) =>
    commitAdd(
      applyAddBet(session.spec, outcomeId, draft),
      'bet',
      'Added bet to this workspace session.',
    );

  const addInitiative = (betId: string, draft: InitiativeDraft) =>
    commitAdd(
      applyAddInitiative(session.spec, betId, draft),
      'initiative',
      'Added initiative to this workspace session.',
    );

  return (
    <section className="goals-page" data-testid="goals-page">
      <header className="goals-header">
        <div className="goals-header-copy">
          <p className="eyebrow">Goals</p>
          <h1 className="goals-title">Are we getting the goal?</h1>
          <p className="goals-framing">{model.framingLine}</p>
        </div>
        <LvtAddChildForm kind="goal" layout="header" onAdd={addGoal} />
      </header>

      <GoalsValueTree
        spec={session.spec}
        selectedId={selectedNode.id}
        onSelectedIdChange={selectNode}
      />

      <div className="goals-selection" aria-live="polite" data-testid="goals-selection">
        <SelectedNodeDetail
          node={selectedNode}
          vision={tree.vision}
          model={model}
          onEdit={() => setEditOpen(true)}
          onOpenNode={openNode}
          onAddGoal={addGoal}
          onAddBet={addBet}
          onAddInitiative={addInitiative}
        />
      </div>

      {savedFlash ? (
        <div className="goals-feedback" role="status">
          <p className="goals-saved">{savedFlash}</p>
        </div>
      ) : null}

      {editOpen ? (
        <LvtEditModal
          kind={selectedNode.kind}
          nodeId={selectedNode.id}
          onClose={() => setEditOpen(false)}
          onSaved={() => setSavedFlash('Saved changes to this workspace session.')}
        />
      ) : null}
    </section>
  );
}

type SelectedNodeDetailProps = {
  node: ValueTreeGraphNode;
  vision: string;
  model: GoalsModel;
  onEdit: () => void;
  onOpenNode: (kind: ValueTreeGraphNode['kind'], id: string) => void;
  onAddGoal: (draft: GoalDraft) => { ok: true } | { ok: false; error: string };
  onAddBet: (outcomeId: string, draft: BetDraft) => { ok: true } | { ok: false; error: string };
  onAddInitiative: (
    betId: string,
    draft: InitiativeDraft,
  ) => { ok: true } | { ok: false; error: string };
};

function SelectedNodeDetail({
  node,
  vision,
  model,
  onEdit,
  onOpenNode,
  onAddGoal,
  onAddBet,
  onAddInitiative,
}: SelectedNodeDetailProps) {
  if (node.kind === 'goal') {
    const outcome = model.outcomes.find((item) => item.id === node.id);
    if (outcome) {
      return (
        <GoalBranchDetail
          outcome={outcome}
          products={productsLinkedToGoal(model.products, outcome.id)}
          onEdit={onEdit}
          onOpenNode={onOpenNode}
          onAddBet={(draft) => onAddBet(outcome.id, draft)}
        />
      );
    }
  }

  if (node.kind === 'vision') {
    return (
      <VisionDetail
        vision={vision}
        node={node}
        outcomes={model.outcomes}
        onEdit={onEdit}
        onOpenNode={onOpenNode}
        onAddGoal={onAddGoal}
      />
    );
  }

  return (
    <TreeNodeDetail
      node={node}
      vision={vision}
      onEdit={onEdit}
      onOpenNode={onOpenNode}
      onAddInitiative={node.kind === 'bet' ? (draft) => onAddInitiative(node.id, draft) : undefined}
    />
  );
}

function EditButton({ onEdit }: { onEdit: () => void }) {
  return (
    <button type="button" className="btn-secondary" data-testid="lvt-edit" onClick={onEdit}>
      Edit
    </button>
  );
}

function VisionDetail({
  vision,
  node,
  outcomes,
  onEdit,
  onOpenNode,
  onAddGoal,
}: {
  vision: string;
  node: ValueTreeGraphNode;
  outcomes: GoalSection[];
  onEdit: () => void;
  onOpenNode: (kind: ValueTreeGraphNode['kind'], id: string) => void;
  onAddGoal: (draft: GoalDraft) => { ok: true } | { ok: false; error: string };
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
        <EditButton onEdit={onEdit} />
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
        <div className="goals-section-header">
          <div>
            <h3 id="goals-vision-branches-heading" className="goals-bets-title">
              Goal branches
            </h3>
            <p className="goals-list-intro-copy">
              Select a goal in the tree to open Measures of Success, funded bets, and product briefs
              linked to that goal.
            </p>
          </div>
          <LvtAddChildForm kind="goal" onAdd={onAddGoal} />
        </div>
        {outcomes.length === 0 ? (
          <p className="goals-mos-claims-empty">
            No goals yet - add the first branch under this vision.
          </p>
        ) : (
          <ul className="goals-vision-goal-list">
            {outcomes.map((outcome) => (
              <li key={outcome.id} className="goals-vision-goal-row">
                <button
                  type="button"
                  className="goals-vision-goal-select"
                  onClick={() => onOpenNode('goal', outcome.id)}
                >
                  <span>
                    <p className="goals-bet-title">{outcome.title}</p>
                    <p className="goals-bet-cue">
                      {outcome.measures.length} measure
                      {outcome.measures.length === 1 ? '' : 's'} · {outcome.bets.length} bet
                      {outcome.bets.length === 1 ? '' : 's'}
                    </p>
                  </span>
                  <span className="text-ink-muted">{outcome.statusLabel}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}

function GoalBranchDetail({
  outcome,
  products,
  onEdit,
  onOpenNode,
  onAddBet,
}: {
  outcome: GoalSection;
  products: GoalProductCard[];
  onEdit: () => void;
  onOpenNode: (kind: ValueTreeGraphNode['kind'], id: string) => void;
  onAddBet: (draft: BetDraft) => { ok: true } | { ok: false; error: string };
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
        <div className="goals-section-header-actions">
          <p className="goals-section-status">{outcome.statusLabel}</p>
          <EditButton onEdit={onEdit} />
        </div>
      </div>

      <ul className="goals-mos-grid">
        {outcome.measures.map((measure) => (
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
                      onClick={() => onOpenNode('bet', bet.id)}
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
          </li>
        ))}
      </ul>

      <section className="goals-bets" aria-labelledby={`outcome-bets-${outcome.id}`}>
        <div className="goals-section-header">
          <h3 id={`outcome-bets-${outcome.id}`} className="goals-bets-title">
            Funded bets
          </h3>
          <LvtAddChildForm kind="bet" onAdd={onAddBet} />
        </div>
        {outcome.bets.length === 0 ? (
          <p className="goals-mos-claims-empty">No bets on this goal yet.</p>
        ) : (
          <ul className="goals-bet-list">
            {outcome.bets.map((bet) => (
              <li key={bet.id}>
                <button
                  type="button"
                  className="goals-bet-row"
                  data-status={bet.statusTone}
                  onClick={() => onOpenNode('bet', bet.id)}
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
        )}
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
                          onClick={() => onOpenNode('bet', bet.id)}
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
  onEdit,
  onOpenNode,
  onAddInitiative,
}: {
  node: ValueTreeGraphNode;
  vision: string;
  onEdit: () => void;
  onOpenNode: (kind: ValueTreeGraphNode['kind'], id: string) => void;
  onAddInitiative?: (draft: InitiativeDraft) => { ok: true } | { ok: false; error: string };
}) {
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
        <EditButton onEdit={onEdit} />
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

      {onAddInitiative ? (
        <section className="goals-bet-initiatives" aria-labelledby="goals-bet-initiatives-heading">
          <div className="goals-section-header">
            <div>
              <h3 id="goals-bet-initiatives-heading" className="goals-bets-title">
                Initiatives
              </h3>
              <p className="goals-list-intro-copy">
                Thin narrative slices toward the Measure of Success - never a dual backlog.
              </p>
            </div>
            <LvtAddChildForm kind="initiative" onAdd={onAddInitiative} />
          </div>
        </section>
      ) : null}

      {node.href && node.hrefLabel ? (
        node.href.startsWith('http') ? (
          <a className="goals-node-link" href={node.href} target="_blank" rel="noreferrer">
            {node.hrefLabel}
          </a>
        ) : node.kind === 'bet' ? null : (
          <button
            type="button"
            className="goals-node-link"
            onClick={() => {
              const match = node.href?.match(
                /\/workspace\/lvt\/(vision|goal|bet|initiative)\/([^/?#]+)/,
              );
              if (match?.[1] && match[2]) {
                onOpenNode(match[1] as ValueTreeGraphNode['kind'], decodeURIComponent(match[2]));
              }
            }}
          >
            {node.hrefLabel}
          </button>
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
