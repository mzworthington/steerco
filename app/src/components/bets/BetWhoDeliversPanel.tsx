import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { memo, useMemo, useState } from 'react';
import type { SteerSpec } from '@steerco/core';
import {
  filterBetDeliveryTeamGroups,
  presentBetDeliveryGraph,
  type BetDeliveryGraphDepth,
  type BetDeliveryGraphNode,
} from '../../application/presentBetDeliveryGraph';
import type { BetDetailTeamGroup } from '../../application/presentBetDetail';
import { GraphStageExpandButton } from '../graphs/GraphStageExpandButton';
import { useGraphStageExpand } from '../graphs/useGraphStageExpand';
import '@xyflow/react/dist/style.css';

type Props = {
  spec: SteerSpec;
  fundedTeamIds: readonly string[];
  teamGroups: BetDetailTeamGroup[];
  deliveryLoadLines: string[];
  onToggleTeam: (teamId: string) => void;
};

type DeliveryNodeData = {
  label: string;
  domainTitle: string;
  roleLabel: string;
  kind: 'funded' | 'related';
  warning: string | null;
};

type DeliveryFlowNode = Node<DeliveryNodeData, 'betDelivery'>;

function BetDeliveryNodeView({ data }: NodeProps<DeliveryFlowNode>) {
  const stateClass = [
    data.kind === 'funded' ? 'is-funded' : 'is-related',
    data.warning ? 'has-warning' : '',
  ]
    .filter(Boolean)
    .map((token) => ` ${token}`)
    .join('');

  return (
    <div
      className={`bet-delivery-node${stateClass}`}
      data-testid="bet-delivery-node"
      data-kind={data.kind}
      data-warning={data.warning ? 'true' : 'false'}
      title={data.warning ?? undefined}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="org-flow-handle"
        aria-hidden="true"
      />
      <span className="bet-delivery-node-domain">{data.domainTitle}</span>
      <span className="bet-delivery-node-label">
        {data.label}
        {data.warning ? (
          <span className="bet-delivery-node-warning" aria-label={data.warning}>
            !
          </span>
        ) : null}
      </span>
      <span className="bet-delivery-node-role">
        {data.kind === 'funded' ? 'Funded' : 'Dependent'} · {data.roleLabel}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="org-flow-handle"
        aria-hidden="true"
      />
    </div>
  );
}

const nodeTypes = {
  betDelivery: memo(BetDeliveryNodeView),
};

function primaryWarning(node: BetDeliveryGraphNode): string | null {
  const overloaded = node.cues.find((cue) => cue.kind === 'overloaded');
  if (overloaded) return overloaded.label;
  const manyDependents = node.cues.find((cue) => cue.kind === 'many_dependents');
  if (manyDependents) return manyDependents.label;
  const manyDeps = node.cues.find((cue) => cue.kind === 'many_dependencies');
  return manyDeps?.label ?? null;
}

export function BetWhoDeliversPanel({
  spec,
  fundedTeamIds,
  teamGroups,
  deliveryLoadLines,
  onToggleTeam,
}: Props) {
  const [query, setQuery] = useState('');
  const [showAllDeps, setShowAllDeps] = useState(false);
  const { expanded, toggleExpanded } = useGraphStageExpand();

  const depth: BetDeliveryGraphDepth = showAllDeps ? 'transitive' : 'direct';
  const filteredGroups = useMemo(
    () => filterBetDeliveryTeamGroups(teamGroups, query),
    [teamGroups, query],
  );
  const graph = useMemo(
    () => presentBetDeliveryGraph(spec, fundedTeamIds, { depth }),
    [spec, fundedTeamIds, depth],
  );

  const flowNodes: DeliveryFlowNode[] = useMemo(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'betDelivery',
        position: node.position,
        data: {
          label: node.label,
          domainTitle: node.domainTitle,
          roleLabel: node.roleLabel,
          kind: node.kind,
          warning: primaryWarning(node),
        },
        draggable: false,
        selectable: false,
        zIndex: node.kind === 'funded' ? 3 : 1,
      })),
    [graph.nodes],
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
        style: {
          stroke: 'var(--color-ink-muted)',
          strokeWidth: edge.mode === 'collaboration' ? 3 : 2,
          strokeDasharray: edge.mode === 'facilitation' ? '6 4' : undefined,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: 'var(--color-ink-muted)',
        },
      })),
    [graph.edges],
  );

  return (
    <div
      className={['bet-who-delivers', expanded ? 'graph-stage--expanded' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="bet-who-delivers"
      data-expanded={expanded ? 'true' : 'false'}
    >
      <div className="bet-who-delivers-header">
        <div>
          <h2 id="bet-teams-heading" className="bet-detail-card-title">
            Who delivers
          </h2>
          <p className="bet-detail-teams-lead">
            Pick funded teams on the left. The graph grows with dependent teams - clear they are
            related, not funded.
          </p>
        </div>
        <GraphStageExpandButton
          expanded={expanded}
          onToggle={toggleExpanded}
          testId="bet-who-delivers-expand"
        />
      </div>

      <div className="bet-who-delivers-split">
        <aside className="bet-who-delivers-picker" aria-label="Funded teams picker">
          <label className="bet-who-delivers-search">
            <span className="sr-only">Search teams</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teams"
              data-testid="bet-who-delivers-search"
            />
          </label>

          <fieldset className="bet-detail-teams" data-testid="bet-who-delivers-list">
            <legend className="sr-only">Funded teams by domain</legend>
            {filteredGroups.length === 0 ? (
              <p className="bet-detail-mos-empty">No teams match that search.</p>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.domainTitle} className="bet-detail-team-group">
                  <h3 className="bet-detail-team-group-title">{group.domainTitle}</h3>
                  <ul className="bet-detail-team-list">
                    {group.teams.map((team) => {
                      const checked = fundedTeamIds.includes(team.id);
                      return (
                        <li key={team.id}>
                          <label className="bet-detail-team">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggleTeam(team.id)}
                              aria-label={`Fund ${team.displayName}`}
                            />
                            <span className="bet-detail-team-body">
                              <span className="bet-detail-team-name">{team.displayName}</span>
                              <span className="bet-detail-team-meta">
                                {team.roleLabel}
                                {team.streamTitles.length > 0
                                  ? ` · ${team.streamTitles.join(', ')}`
                                  : null}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </fieldset>
        </aside>

        <div
          className="bet-who-delivers-graph"
          data-testid="bet-who-delivers-graph"
          data-depth={depth}
        >
          <div className="bet-who-delivers-graph-toolbar">
            <label className="bet-who-delivers-all-deps">
              <input
                type="checkbox"
                checked={showAllDeps}
                onChange={(event) => setShowAllDeps(event.target.checked)}
                data-testid="bet-who-delivers-all-deps"
              />
              <span>Show all dependencies</span>
            </label>
          </div>

          <p className="bet-who-delivers-graph-lead">{graph.lead}</p>

          <div className="bet-who-delivers-legend" aria-label="Delivery graph legend">
            <span className="bet-who-delivers-legend-funded">
              <span className="bet-who-delivers-legend-swatch" aria-hidden="true" />
              Funded
            </span>
            <span className="bet-who-delivers-legend-related">
              <span className="bet-who-delivers-legend-swatch" aria-hidden="true" />
              Dependent
            </span>
            <span className="bet-who-delivers-legend-warning">
              <span className="bet-who-delivers-legend-swatch" aria-hidden="true" />
              Load risk
            </span>
          </div>

          {graph.empty ? (
            <p className="bet-detail-mos-empty" data-testid="bet-who-delivers-empty">
              Select teams to see how work flows around this bet.
            </p>
          ) : (
            <div className="bet-who-delivers-canvas" data-testid="bet-who-delivers-canvas">
              <ReactFlowProvider key={expanded ? 'bet-delivery-expanded' : 'bet-delivery-inline'}>
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
                  elementsSelectable={false}
                  panOnScroll
                  proOptions={{ hideAttribution: true }}
                >
                  <Background gap={18} size={1} />
                  <Controls showInteractive={false} />
                </ReactFlow>
              </ReactFlowProvider>
            </div>
          )}
        </div>
      </div>

      {deliveryLoadLines.length > 0 ? (
        <p className="bet-detail-delivery-load" data-testid="bet-delivery-load">
          {deliveryLoadLines.join(' · ')}
        </p>
      ) : null}
    </div>
  );
}
