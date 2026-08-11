import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import type { SteerSpec } from '@steerlens/core';
import {
  presentValueTree,
  type ValueTreeGraphNode,
  type ValueTreeNodeKind,
  type ValueTreeOrientation,
} from '../../application/presentValueTree';
import { GraphStageExpandButton } from '../graphs/GraphStageExpandButton';
import { useGraphStageExpand } from '../graphs/useGraphStageExpand';
import '@xyflow/react/dist/style.css';

type Props = {
  spec: SteerSpec;
  dense?: boolean;
};

type ValueTreeFlowNodeData = {
  kind: ValueTreeNodeKind;
  label: string;
  summary: string | null;
  selected: boolean;
};

type ValueTreeFlowNode = Node<ValueTreeFlowNodeData, 'valueTree'>;

const KIND_LABEL: Record<ValueTreeNodeKind, string> = {
  vision: 'Vision',
  outcome: 'Outcome',
  bet: 'Bet',
  initiative: 'Initiative',
};

function ValueTreeNodeView({ data }: NodeProps<ValueTreeFlowNode>) {
  return (
    <button
      type="button"
      className={`value-tree-node value-tree-node--${data.kind}${data.selected ? 'is-selected' : ''}`}
      data-testid={`value-tree-node-${data.kind}`}
    >
      <span className="value-tree-node-kind">{KIND_LABEL[data.kind]}</span>
      <span className="value-tree-node-label">{data.label}</span>
      {data.summary && data.kind !== 'vision' ? (
        <span className="value-tree-node-summary">{data.summary}</span>
      ) : null}
    </button>
  );
}

const nodeTypes = {
  valueTree: memo(ValueTreeNodeView),
};

export function OutcomesValueTree({ spec, dense = false }: Props) {
  const [orientation, setOrientation] = useState<ValueTreeOrientation>('TB');
  const [selectedId, setSelectedId] = useState<string | null>('vision');
  const { expanded, toggleExpanded } = useGraphStageExpand();
  const tree = useMemo(() => presentValueTree(spec, orientation), [spec, orientation]);

  useEffect(() => {
    setSelectedId((current) => {
      if (current && tree.nodes.some((node) => node.id === current)) return current;
      return 'vision';
    });
  }, [tree.nodes]);

  const selected = tree.nodes.find((node) => node.id === selectedId) ?? null;

  const flowNodes: ValueTreeFlowNode[] = useMemo(
    () =>
      tree.nodes.map((node) => ({
        id: node.id,
        type: 'valueTree',
        position: node.position,
        data: {
          kind: node.kind,
          label: node.kind === 'vision' ? truncate(tree.vision, 64) : node.label,
          summary: node.summary,
          selected: node.id === selectedId,
        },
        draggable: false,
        selectable: true,
      })),
    [tree.nodes, tree.vision, selectedId],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      tree.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      })),
    [tree.edges],
  );

  return (
    <section
      className={[
        dense ? 'value-tree value-tree--dense' : 'value-tree',
        expanded ? 'graph-stage--expanded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-labelledby="value-tree-heading"
      data-testid="outcomes-value-tree"
      data-expanded={expanded ? 'true' : 'false'}
    >
      <div className="value-tree-header">
        <div>
          <p className="eyebrow">Lean Value Tree</p>
          <h2 id="value-tree-heading" className="value-tree-title">
            How investment nests
          </h2>
          <p className="value-tree-lead">{tree.lead}</p>
        </div>
        <div className="value-tree-header-actions">
          <div
            className="value-tree-orient"
            role="group"
            aria-label="Tree orientation"
            data-testid="value-tree-orient"
          >
            <button
              type="button"
              className={
                orientation === 'TB' ? 'value-tree-orient-btn is-active' : 'value-tree-orient-btn'
              }
              aria-pressed={orientation === 'TB'}
              onClick={() => setOrientation('TB')}
              data-testid="value-tree-orient-tb"
            >
              Top down
            </button>
            <button
              type="button"
              className={
                orientation === 'LR' ? 'value-tree-orient-btn is-active' : 'value-tree-orient-btn'
              }
              aria-pressed={orientation === 'LR'}
              onClick={() => setOrientation('LR')}
              data-testid="value-tree-orient-lr"
            >
              Left to right
            </button>
          </div>
          <GraphStageExpandButton
            expanded={expanded}
            onToggle={toggleExpanded}
            testId="value-tree-expand"
          />
        </div>
      </div>

      {expanded ? null : (
        <p className="value-tree-vision" data-testid="value-tree-vision">
          <span className="value-tree-vision-label">Vision</span>
          {tree.vision}
        </p>
      )}

      <div className="value-tree-workspace">
        <div className="value-tree-canvas" data-testid="value-tree-canvas">
          <ReactFlowProvider key={expanded ? 'value-tree-expanded' : 'value-tree-inline'}>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.35}
              maxZoom={1.4}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              panOnScroll
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(null)}
            >
              <Background gap={18} size={1} />
              <Controls showInteractive={false} />
              <MiniMap pannable zoomable />
            </ReactFlow>
          </ReactFlowProvider>
        </div>

        <aside className="value-tree-detail" aria-live="polite" data-testid="value-tree-detail">
          {selected ? (
            <ValueTreeDetail node={selected} vision={tree.vision} />
          ) : (
            <p className="value-tree-detail-empty">Select a node to see more detail.</p>
          )}
        </aside>
      </div>

      {expanded ? null : (
        <div className="value-tree-outline">
          <p className="value-tree-outline-title">
            Outline ({tree.outcomeCount} outcomes · {tree.betCount} bets
            {tree.initiativeCount > 0 ? ` · ${tree.initiativeCount} initiatives` : ''})
          </p>
          <div className="value-tree-outline-accordion" data-testid="value-tree-outline">
            {tree.outline.map((outcome, index) => (
              <details
                key={outcome.id}
                className="value-tree-outline-item"
                name="value-tree-outline"
                open={index === 0}
              >
                <summary
                  className="value-tree-outline-summary"
                  onClick={() => setSelectedId(outcome.id)}
                >
                  {outcome.title}
                  <span className="organisation-flow-graph-accordion-count">
                    {outcome.bets.length}
                  </span>
                </summary>
                {outcome.bets.length > 0 ? (
                  <ul className="value-tree-outline-bets">
                    {outcome.bets.map((bet) => (
                      <li key={bet.id}>
                        <details
                          className="value-tree-outline-bet-item"
                          name={`value-tree-${outcome.id}`}
                        >
                          <summary
                            className="value-tree-outline-bet-summary"
                            onClick={() => setSelectedId(bet.id)}
                          >
                            {bet.title}
                            {bet.initiatives.length > 0 ? (
                              <span className="organisation-flow-graph-accordion-count">
                                {bet.initiatives.length}
                              </span>
                            ) : null}
                          </summary>
                          {bet.initiatives.length > 0 ? (
                            <ul className="value-tree-outline-initiatives">
                              {bet.initiatives.map((initiative) => (
                                <li key={initiative.id}>
                                  <button
                                    type="button"
                                    className="value-tree-outline-initiative"
                                    onClick={() => setSelectedId(initiative.id)}
                                  >
                                    {initiative.title}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </details>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="value-tree-outline-empty">No bets under this outcome yet.</p>
                )}
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ValueTreeDetail({ node, vision }: { node: ValueTreeGraphNode; vision: string }) {
  return (
    <div>
      <p className="value-tree-detail-kind">{KIND_LABEL[node.kind]}</p>
      <h3 className="value-tree-detail-title">
        {node.kind === 'vision' ? 'Investment vision' : node.label}
      </h3>
      <p className="value-tree-detail-body">{node.kind === 'vision' ? vision : node.summary}</p>
      {node.href && node.hrefLabel ? (
        node.href.startsWith('http') ? (
          <a className="value-tree-detail-link" href={node.href} target="_blank" rel="noreferrer">
            {node.hrefLabel}
          </a>
        ) : (
          <Link href={node.href} className="value-tree-detail-link">
            {node.hrefLabel}
          </Link>
        )
      ) : null}
    </div>
  );
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
