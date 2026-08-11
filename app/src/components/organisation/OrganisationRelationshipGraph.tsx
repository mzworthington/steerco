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
  presentOrganisationFlowFocus,
  presentOrganisationFlowGraph,
  type OrganisationFlowGraphEdge,
  type OrganisationFlowGraphMember,
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
  streamTitles: string[];
  platformScopeLabel: string | null;
  facilitatesLabels: string[];
  members: OrganisationFlowGraphMember[];
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
  related: boolean;
  dimmed: boolean;
};

type TeamFlowNode = Node<TeamFlowNodeData, 'orgTeam'>;

type Selection =
  | { kind: 'team'; node: OrganisationFlowGraphNode }
  | { kind: 'edge'; edge: OrganisationFlowGraphEdge }
  | null;

function OrgTeamNodeView({ data }: NodeProps<TeamFlowNode>) {
  const stateClass = data.selected
    ? ' is-selected'
    : data.related
      ? ' is-related'
      : data.dimmed
        ? ' is-dimmed'
        : '';

  return (
    <button
      type="button"
      className={`org-flow-node${stateClass}`}
      data-testid="organisation-flow-node"
      data-dimmed={data.dimmed ? 'true' : 'false'}
      data-related={data.related || data.selected ? 'true' : 'false'}
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
        streamTitles: team.streamTitles,
        platformScopeLabel: team.platformScopeLabel,
        facilitatesLabels: team.facilitatesLabels,
        members: team.members,
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

  const focus = useMemo(
    () =>
      presentOrganisationFlowFocus(
        graph.edges,
        selection
          ? selection.kind === 'team'
            ? { kind: 'team', id: selection.node.id }
            : { kind: 'edge', id: selection.edge.id }
          : null,
      ),
    [graph.edges, selection],
  );

  const activeNodeSet = useMemo(() => new Set(focus.activeNodeIds), [focus.activeNodeIds]);
  const activeEdgeSet = useMemo(() => new Set(focus.activeEdgeIds), [focus.activeEdgeIds]);

  const selectedTeamEdges = useMemo(() => {
    if (selection?.kind !== 'team') return [];
    return graph.edges.filter(
      (edge) => edge.source === selection.node.id || edge.target === selection.node.id,
    );
  }, [graph.edges, selection]);

  const flowNodes: TeamFlowNode[] = useMemo(
    () =>
      graph.nodes.map((node) => {
        const selected = selection?.kind === 'team' && selection.node.id === node.id;
        const related = focus.hasFocus && activeNodeSet.has(node.id);
        return {
          id: node.id,
          type: 'orgTeam',
          position: node.position,
          data: {
            label: node.label,
            domainTitle: node.domainTitle,
            roleLabel: node.roleLabel,
            selected,
            related: related && !selected,
            dimmed: focus.hasFocus && !related,
          },
          className: focus.hasFocus && !related ? 'org-flow-rf-node--dimmed' : undefined,
          draggable: false,
          selectable: true,
          zIndex: selected ? 3 : related ? 2 : 1,
        };
      }),
    [graph.nodes, selection, focus.hasFocus, activeNodeSet],
  );

  const flowEdges: Edge[] = useMemo(
    () =>
      graph.edges.map((edge) => {
        const related = focus.hasFocus && activeEdgeSet.has(edge.id);
        const dimmed = focus.hasFocus && !related;
        const selected = selection?.kind === 'edge' && selection.edge.id === edge.id;
        const baseWidth = edge.mode === 'collaboration' ? 3 : 1.5;
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: related || !focus.hasFocus ? edge.modeLabel : undefined,
          type: 'smoothstep',
          animated: edge.mode === 'facilitation' && (related || !focus.hasFocus),
          style: {
            strokeWidth: related ? baseWidth + 1 : baseWidth,
            strokeDasharray: edge.mode === 'facilitation' ? '6 4' : undefined,
            opacity: dimmed ? 0.18 : 1,
          },
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          selected,
          zIndex: related ? 2 : 0,
          className: dimmed
            ? 'org-flow-edge--dimmed'
            : related
              ? 'org-flow-edge--related'
              : undefined,
        };
      }),
    [graph.edges, focus.hasFocus, activeEdgeSet, selection],
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
      data-focus={focus.hasFocus ? 'true' : 'false'}
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
              <TeamDetailPanel node={selection.node} interactions={selectedTeamEdges} />
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
        <div className="organisation-flow-graph-details">
          <p className="organisation-flow-graph-details-title">
            List alternative ({graph.edgeCount} interactions)
          </p>
          <div
            className="organisation-flow-graph-list organisation-flow-graph-accordion"
            data-testid="organisation-flow-graph-list"
          >
            {graph.listGroups.map((group, index) => (
              <details
                key={group.domainTitle}
                className="organisation-flow-graph-accordion-item"
                name="organisation-flow-domains"
                open={index === 0}
              >
                <summary className="organisation-flow-graph-accordion-summary">
                  {group.domainTitle}
                  <span className="organisation-flow-graph-accordion-count">
                    {group.relationships.length}
                  </span>
                </summary>
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
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TeamDetailPanel({
  node,
  interactions,
}: {
  node: OrganisationFlowGraphNode;
  interactions: OrganisationFlowGraphEdge[];
}) {
  return (
    <div data-testid="organisation-flow-team-detail">
      <p className="organisation-flow-graph-detail-kind">{node.roleLabel}</p>
      <h3 className="organisation-flow-graph-detail-title">{node.label}</h3>
      <p className="organisation-flow-graph-detail-meta">Domain · {node.domainTitle}</p>
      {node.streamTitles.length > 0 ? (
        <p className="organisation-flow-graph-detail-meta">
          Streams · {node.streamTitles.join(', ')}
        </p>
      ) : null}
      {node.platformScopeLabel ? (
        <p className="organisation-flow-graph-detail-meta">
          Platform scope · {node.platformScopeLabel}
        </p>
      ) : null}
      {node.purpose ? <p className="organisation-flow-graph-detail-body">{node.purpose}</p> : null}
      {node.capacityLabel ? (
        <p className="organisation-flow-graph-detail-meta">Capacity · {node.capacityLabel}</p>
      ) : null}

      <div className="organisation-flow-graph-accordion organisation-flow-graph-detail-accordion">
        <details
          className="organisation-flow-graph-accordion-item"
          name={`team-detail-${node.id}`}
          open={false}
        >
          <summary className="organisation-flow-graph-accordion-summary">
            People
            <span className="organisation-flow-graph-accordion-count">{node.members.length}</span>
          </summary>
          {node.members.length === 0 ? (
            <p className="organisation-flow-graph-detail-empty">No people on this team yet.</p>
          ) : (
            <ul
              className="organisation-flow-graph-members"
              data-testid="organisation-flow-team-members"
            >
              {node.members.map((member) => (
                <li key={member.id}>
                  <span className="organisation-flow-graph-member-name">{member.displayName}</span>
                  <span className="organisation-flow-graph-member-meta">
                    {member.title}
                    {member.disciplineLabel ? ` · ${member.disciplineLabel}` : ''}
                    {` · ${member.ftePercent}%`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </details>

        <details className="organisation-flow-graph-accordion-item" name={`team-detail-${node.id}`}>
          <summary className="organisation-flow-graph-accordion-summary">
            Communicates with
            <span className="organisation-flow-graph-accordion-count">{interactions.length}</span>
          </summary>
          {interactions.length === 0 ? (
            <p className="organisation-flow-graph-detail-empty">
              No interaction modes recorded for this team.
            </p>
          ) : (
            <ul className="organisation-flow-graph-interactions">
              {interactions.map((edge) => (
                <li key={edge.id}>
                  <span className="organisation-flow-graph-interaction-mode">{edge.modeLabel}</span>
                  <span className="organisation-flow-graph-interaction-sentence">
                    {edge.sentence}
                  </span>
                  {edge.expectedUntil ? (
                    <span className="organisation-flow-graph-detail-meta">
                      Expected until {edge.expectedUntil}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>

      {node.facilitatesLabels.length > 0 ? (
        <p className="organisation-flow-graph-detail-meta">
          Facilitates · {node.facilitatesLabels.join(', ')}
        </p>
      ) : null}
    </div>
  );
}
