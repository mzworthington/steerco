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
import type { OrganisationRelationship } from '../../application/presentOrganisation';
import {
  presentOrganisationFlowGraph,
  type OrganisationFlowGraphEdge,
  type OrganisationFlowGraphNode,
  type OrganisationFlowOrientation,
} from '../../application/presentOrganisationFlowGraph';
import { GraphStageExpandButton } from '../graphs/GraphStageExpandButton';
import { useGraphStageExpand } from '../graphs/useGraphStageExpand';
import '@xyflow/react/dist/style.css';

type TeamMeta = {
  id: string;
  displayName: string;
  domainTitle: string | null;
  roleLabel: string;
  purpose: string;
  capacityLabel: string;
};

type Props = {
  relationships: OrganisationRelationship[];
  teams: TeamMeta[];
};

type TeamFlowNodeData = {
  label: string;
  domainTitle: string;
  roleLabel: string;
  selected: boolean;
};

type TeamFlowNode = Node<TeamFlowNodeData, 'orgTeam'>;

type Selection =
  | { kind: 'team'; node: OrganisationFlowGraphNode }
  | { kind: 'edge'; edge: OrganisationFlowGraphEdge }
  | null;

function OrgTeamNodeView({ data }: NodeProps<TeamFlowNode>) {
  return (
    <button
      type="button"
      className={`org-flow-node${data.selected ? 'is-selected' : ''}`}
      data-testid="organisation-flow-node"
    >
      <span className="org-flow-node-domain">{data.domainTitle}</span>
      <span className="org-flow-node-label">{data.label}</span>
      <span className="org-flow-node-role">{data.roleLabel}</span>
    </button>
  );
}

const nodeTypes = {
  orgTeam: memo(OrgTeamNodeView),
};

export function OrganisationRelationshipGraph({ relationships, teams }: Props) {
  const [domainFilter, setDomainFilter] = useState('');
  const [orientation, setOrientation] = useState<OrganisationFlowOrientation>('LR');
  const [selection, setSelection] = useState<Selection>(null);
  const { expanded, toggleExpanded } = useGraphStageExpand();

  const meta = useMemo(
    () =>
      teams.map((team) => ({
        id: team.id,
        displayName: team.displayName,
        domainTitle: team.domainTitle ?? 'Ungrouped',
        roleLabel: team.roleLabel,
        purpose: team.purpose,
        capacityLabel: team.capacityLabel,
      })),
    [teams],
  );

  const graph = useMemo(
    () =>
      presentOrganisationFlowGraph(relationships, meta, {
        domainTitle: domainFilter || null,
        orientation,
      }),
    [relationships, meta, domainFilter, orientation],
  );

  useEffect(() => {
    setSelection((current) => {
      if (!current) return null;
      if (current.kind === 'team') {
        const node = graph.nodes.find((item) => item.id === current.node.id);
        return node ? { kind: 'team', node } : null;
      }
      const edge = graph.edges.find((item) => item.id === current.edge.id);
      return edge ? { kind: 'edge', edge } : null;
    });
  }, [graph.nodes, graph.edges]);

  const flowNodes: TeamFlowNode[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'orgTeam',
        position: node.position,
        data: {
          label: node.label,
          domainTitle: node.domainTitle,
          roleLabel: node.roleLabel,
          selected: selection?.kind === 'team' && selection.node.id === node.id,
        },
        draggable: false,
        selectable: true,
      })),
    [graph.nodes, selection],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.modeLabel,
        type: 'smoothstep',
        animated: edge.mode === 'facilitation',
        style:
          edge.mode === 'collaboration'
            ? { strokeWidth: 3 }
            : edge.mode === 'facilitation'
              ? { strokeDasharray: '6 4' }
              : { strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        selected: selection?.kind === 'edge' && selection.edge.id === edge.id,
      })),
    [graph.edges, selection],
  );

  if (relationships.length === 0) {
    return <p className="organisation-zone-empty">No relationships yet.</p>;
  }

  return (
    <div
      className={['organisation-flow-graph', expanded ? 'graph-stage--expanded' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="organisation-flow-graph"
      data-expanded={expanded ? 'true' : 'false'}
    >
      <div className="organisation-flow-graph-toolbar">
        <label className="organisation-field organisation-flow-graph-filter">
          <span>Domain focus</span>
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            data-testid="organisation-flow-graph-domain"
          >
            <option value="">All domains</option>
            {graph.domainOptions.map((option) => (
              <option key={option.title} value={option.title}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <div className="organisation-flow-graph-toolbar-actions">
          <div
            className="value-tree-orient"
            role="group"
            aria-label="Graph orientation"
            data-testid="organisation-flow-graph-orient"
          >
            <button
              type="button"
              className={
                orientation === 'TB' ? 'value-tree-orient-btn is-active' : 'value-tree-orient-btn'
              }
              aria-pressed={orientation === 'TB'}
              onClick={() => setOrientation('TB')}
              data-testid="organisation-flow-orient-tb"
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
              data-testid="organisation-flow-orient-lr"
            >
              Left to right
            </button>
          </div>
          <GraphStageExpandButton
            expanded={expanded}
            onToggle={toggleExpanded}
            testId="organisation-flow-expand"
          />
        </div>
        {expanded ? null : <p className="organisation-flow-graph-lead">{graph.lead}</p>}
      </div>

      {expanded ? null : (
        <div className="organisation-flow-graph-legend" aria-label="Interaction mode legend">
          <span>
            <span
              className="organisation-mode-glyph organisation-mode-glyph--triangle"
              aria-hidden="true"
            />{' '}
            X-as-a-Service (solid)
          </span>
          <span>
            <span
              className="organisation-mode-glyph organisation-mode-glyph--parallelogram"
              aria-hidden="true"
            />{' '}
            Collaboration (thick)
          </span>
          <span>
            <span
              className="organisation-mode-glyph organisation-mode-glyph--circle"
              aria-hidden="true"
            />{' '}
            Facilitation (dotted / animated)
          </span>
        </div>
      )}

      {graph.empty ? (
        <p className="organisation-zone-empty">No interactions in this domain focus.</p>
      ) : (
        <div className="organisation-flow-graph-workspace">
          <div
            className="organisation-flow-graph-canvas"
            data-testid="organisation-flow-graph-canvas"
          >
            <ReactFlowProvider key={expanded ? 'org-flow-expanded' : 'org-flow-inline'}>
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.3}
                maxZoom={1.4}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                panOnScroll
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_, node) => {
                  const match = graph.nodes.find((item) => item.id === node.id);
                  if (match) setSelection({ kind: 'team', node: match });
                }}
                onEdgeClick={(_, edge) => {
                  const match = graph.edges.find((item) => item.id === edge.id);
                  if (match) setSelection({ kind: 'edge', edge: match });
                }}
                onPaneClick={() => setSelection(null)}
              >
                <Background gap={18} size={1} />
                <Controls showInteractive={false} />
                <MiniMap pannable zoomable />
              </ReactFlow>
            </ReactFlowProvider>
          </div>

          <aside
            className="organisation-flow-graph-detail"
            aria-live="polite"
            data-testid="organisation-flow-graph-detail"
          >
            {selection?.kind === 'team' ? (
              <div>
                <p className="organisation-flow-graph-detail-kind">{selection.node.roleLabel}</p>
                <h3 className="organisation-flow-graph-detail-title">{selection.node.label}</h3>
                <p className="organisation-flow-graph-detail-meta">
                  Domain · {selection.node.domainTitle}
                </p>
                {selection.node.purpose ? (
                  <p className="organisation-flow-graph-detail-body">{selection.node.purpose}</p>
                ) : null}
                {selection.node.capacityLabel ? (
                  <p className="organisation-flow-graph-detail-meta">
                    Capacity · {selection.node.capacityLabel}
                  </p>
                ) : null}
              </div>
            ) : selection?.kind === 'edge' ? (
              <div>
                <p className="organisation-flow-graph-detail-kind">{selection.edge.modeLabel}</p>
                <h3 className="organisation-flow-graph-detail-title">Interaction</h3>
                <p className="organisation-flow-graph-detail-body">{selection.edge.sentence}</p>
                <p className="organisation-flow-graph-detail-meta">{selection.edge.modeTeaching}</p>
                {selection.edge.expectedUntil ? (
                  <p className="organisation-flow-graph-detail-meta">
                    Expected until {selection.edge.expectedUntil}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="organisation-flow-graph-detail-empty">
                Select a team or interaction edge for detail.
              </p>
            )}
          </aside>
        </div>
      )}

      {expanded ? null : (
        <details className="organisation-flow-graph-details">
          <summary>List alternative ({graph.edgeCount} interactions)</summary>
          <div className="organisation-flow-graph-list" data-testid="organisation-flow-graph-list">
            {graph.listGroups.map((group) => (
              <section key={group.domainTitle} className="organisation-flow-graph-list-group">
                <h3 className="organisation-flow-graph-list-title">{group.domainTitle}</h3>
                <ul className="organisation-relationship-list">
                  {group.relationships.map((relationship) => {
                    const edgeId = `${relationship.fromTeamId}-${relationship.mode}-${relationship.toTeamId}`;
                    return (
                      <li key={edgeId}>
                        <button
                          type="button"
                          className="organisation-relationship-select"
                          onClick={() => {
                            const edge = graph.edges.find((item) => item.id === edgeId);
                            if (edge) setSelection({ kind: 'edge', edge });
                          }}
                        >
                          <span className="organisation-relationship-row">
                            <span
                              className={`organisation-mode-glyph organisation-mode-glyph--${relationship.shape}`}
                              aria-hidden="true"
                            />
                            <span>
                              {relationship.sentence}
                              {relationship.expectedUntil ? (
                                <span className="organisation-relationship-expected">
                                  {' '}
                                  · expected until {relationship.expectedUntil}
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="organisation-relationship-mode">
                            {relationship.modeLabel}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
