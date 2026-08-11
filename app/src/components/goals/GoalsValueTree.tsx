import {
  Background,
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import type { SteerSpec } from '@steerco/core';
import { presentValueTree, type ValueTreeNodeKind } from '../../application/presentValueTree';
import '@xyflow/react/dist/style.css';

type Props = {
  spec: SteerSpec;
  dense?: boolean;
  /** Controlled selection; omit for internal state (Technical tree). */
  selectedId?: string | null;
  onSelectedIdChange?: (id: string | null) => void;
};

type ValueTreeFlowNodeData = {
  kind: ValueTreeNodeKind;
  label: string;
  summary: string | null;
  selected: boolean;
  onSelect: () => void;
};

type ValueTreeFlowNode = Node<ValueTreeFlowNodeData, 'valueTree'>;

const KIND_LABEL: Record<ValueTreeNodeKind, string> = {
  vision: 'Vision',
  goal: 'Goal',
  bet: 'Bet',
  initiative: 'Initiative',
};

function ValueTreeNodeView({ data }: NodeProps<ValueTreeFlowNode>) {
  return (
    <button
      type="button"
      className={`value-tree-node value-tree-node--${data.kind}${data.selected ? 'is-selected' : ''}`}
      data-testid={`value-tree-node-${data.kind}`}
      onClick={(event) => {
        event.stopPropagation();
        data.onSelect();
      }}
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

export function GoalsValueTree({
  spec,
  dense = false,
  selectedId: selectedIdProp,
  onSelectedIdChange,
}: Props) {
  const controlled = selectedIdProp !== undefined;
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>('vision');
  const selectedId = controlled ? selectedIdProp : internalSelectedId;
  const setSelectedId = useCallback(
    (id: string | null) => {
      if (!controlled) setInternalSelectedId(id);
      onSelectedIdChange?.(id);
    },
    [controlled, onSelectedIdChange],
  );

  const tree = useMemo(() => presentValueTree(spec, 'TB'), [spec]);

  useEffect(() => {
    const nextId = (current: string | null) => {
      if (current === null) return null;
      if (tree.nodes.some((node) => node.id === current)) return current;
      return 'vision';
    };
    if (controlled) {
      const resolved = nextId(selectedIdProp ?? null);
      if (resolved !== selectedIdProp) onSelectedIdChange?.(resolved);
      return;
    }
    setInternalSelectedId((current) => nextId(current));
  }, [tree.nodes, controlled, selectedIdProp, onSelectedIdChange]);

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
          onSelect: () => setSelectedId(node.id),
        },
        draggable: false,
        selectable: true,
      })),
    [tree.nodes, tree.vision, selectedId, setSelectedId],
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
      className={dense ? 'value-tree value-tree--dense' : 'value-tree'}
      aria-labelledby="value-tree-heading"
      data-testid="goals-value-tree"
    >
      <div className="value-tree-header">
        <div>
          <p className="eyebrow">Lean Value Tree</p>
          <h2 id="value-tree-heading" className="value-tree-title">
            How investment nests
          </h2>
          <p className="value-tree-lead">{tree.lead}</p>
        </div>
      </div>

      <div className="value-tree-workspace">
        <div className="value-tree-canvas" data-testid="value-tree-canvas">
          <ReactFlowProvider>
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
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </section>
  );
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
