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
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  memo,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type Ref,
} from 'react';
import { INTERACTION_MODE_COPY, type MemberDiscipline } from '@steerco/core';
import type { OrganisationRelationship } from '../../application/presentOrganisation';
import {
  presentOrganisationFlowFocus,
  presentOrganisationFlowGraph,
  type OrganisationFlowGraphEdge,
  type OrganisationFlowGraphMember,
  type OrganisationFlowGraphNode,
  type OrganisationFlowOrientation,
  type OrganisationFlowRelationView,
} from '../../application/presentOrganisationFlowGraph';
import { GraphStageExpandButton } from '../graphs/GraphStageExpandButton';
import { useGraphStageExpand } from '../graphs/useGraphStageExpand';
import '@xyflow/react/dist/style.css';

export type OrganisationGraphQuickAddInput = {
  teamId: string;
  displayName: string;
  title: string;
  ftePercent: number;
  discipline: MemberDiscipline;
};

export type OrganisationGraphAllocateInput = {
  fromTeamId: string;
  teamId: string;
  memberId: string;
  displayName: string;
  title: string;
  ftePercent: number;
  discipline: MemberDiscipline;
  effectiveFrom?: string;
  effectiveUntil?: string;
};

export type OrganisationGraphMoveInput = {
  memberId: string;
  fromTeamId: string;
  toTeamId: string;
};

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
  members: Array<
    OrganisationFlowGraphMember & {
      discipline: MemberDiscipline;
      effectiveFrom: string | null;
      effectiveUntil: string | null;
    }
  >;
};

type Props = {
  relationships: OrganisationRelationship[];
  teams: TeamMeta[];
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  rangeFrom: string;
  rangeTo: string;
  onRangeFromChange: (value: string) => void;
  onRangeToChange: (value: string) => void;
  onEditTeam: (teamId: string) => void;
  onQuickAdd: (input: OrganisationGraphQuickAddInput) => void;
  onMovePerson: (input: OrganisationGraphMoveInput) => void;
  onSaveAllocation: (input: OrganisationGraphAllocateInput) => void;
};

type TeamFlowNodeData = {
  label: string;
  domainTitle: string;
  roleLabel: string;
  selected: boolean;
  related: boolean;
  dimmed: boolean;
  inFocusDomain: boolean;
  isExternal: boolean;
  dropTarget: boolean;
  orientation: OrganisationFlowOrientation;
};

type TeamFlowNode = Node<TeamFlowNodeData, 'orgTeam'>;

type Selection =
  | { kind: 'team'; node: OrganisationFlowGraphNode }
  | { kind: 'edge'; edge: OrganisationFlowGraphEdge }
  | null;

type DragMemberPayload = {
  memberId: string;
  fromTeamId: string;
  member: OrganisationFlowGraphMember;
};

function teamDropId(teamId: string): string {
  return `team:${teamId}`;
}

function parseTeamDropId(id: string | number): string | null {
  const value = String(id);
  return value.startsWith('team:') ? value.slice('team:'.length) : null;
}

function OrgTeamNodeView({ data, id }: NodeProps<TeamFlowNode>) {
  const { setNodeRef, isOver } = useDroppable({ id: teamDropId(id) });
  const stateClass = [
    data.selected ? 'is-selected' : '',
    data.related ? 'is-related' : '',
    data.dimmed ? 'is-dimmed' : '',
    data.inFocusDomain ? 'is-focus-domain' : '',
    data.isExternal ? 'is-external' : '',
    isOver || data.dropTarget ? 'is-drop-target' : '',
  ]
    .filter(Boolean)
    .map((token) => ` ${token}`)
    .join('');

  const sourcePosition = Position.Right;
  const targetPosition = Position.Left;

  return (
    <div
      ref={setNodeRef}
      className={`org-flow-node${stateClass}`}
      data-testid="organisation-flow-node"
      data-team-id={id}
      data-dimmed={data.dimmed ? 'true' : 'false'}
      data-related={data.related || data.selected ? 'true' : 'false'}
      data-external={data.isExternal ? 'true' : 'false'}
      data-focus-domain={data.inFocusDomain ? 'true' : 'false'}
    >
      <Handle
        type="target"
        position={targetPosition}
        className="org-flow-handle"
        aria-hidden="true"
      />
      <span className="org-flow-node-domain">{data.domainTitle}</span>
      <span className="org-flow-node-label">{data.label}</span>
      <span className="org-flow-node-role">{data.roleLabel}</span>
      <Handle
        type="source"
        position={sourcePosition}
        className="org-flow-handle"
        aria-hidden="true"
      />
    </div>
  );
}

const nodeTypes = {
  orgTeam: memo(OrgTeamNodeView),
};

function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export { todayIsoDate as organisationTodayIsoDate };

export function OrganisationRelationshipGraph({
  relationships,
  teams,
  disciplineOptions,
  rangeFrom,
  rangeTo,
  onRangeFromChange,
  onRangeToChange,
  onEditTeam,
  onQuickAdd,
  onMovePerson,
  onSaveAllocation,
}: Props) {
  const [domainFilters, setDomainFilters] = useState<string[]>([]);
  const orientation = 'LR' as const;
  const [relationView, setRelationView] = useState<OrganisationFlowRelationView>('depends_on');
  const [selection, setSelection] = useState<Selection>(null);
  const [activeDrag, setActiveDrag] = useState<DragMemberPayload | null>(null);
  const [addingPerson, setAddingPerson] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const { expanded, toggleExpanded } = useGraphStageExpand();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
        members: team.members.map((member) => ({
          id: member.id,
          displayName: member.displayName,
          title: member.title,
          disciplineLabel: member.disciplineLabel,
          ftePercent: member.ftePercent,
          initials: member.initials,
        })),
      })),
    [teams],
  );

  const teamById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams]);

  const graph = useMemo(
    () =>
      presentOrganisationFlowGraph(relationships, meta, {
        domainTitles: domainFilters,
        orientation,
        rangeFrom,
        rangeTo,
      }),
    [relationships, meta, domainFilters, orientation, rangeFrom, rangeTo],
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

  const selectedTeamId = selection?.kind === 'team' ? selection.node.id : null;

  useEffect(() => {
    setAddingPerson(false);
    setEditingMemberId(null);
  }, [selectedTeamId]);

  const focus = useMemo(
    () =>
      presentOrganisationFlowFocus(
        graph.edges,
        selection
          ? selection.kind === 'team'
            ? { kind: 'team', id: selection.node.id }
            : { kind: 'edge', id: selection.edge.id }
          : null,
        relationView,
      ),
    [graph.edges, selection, relationView],
  );

  const activeNodeSet = useMemo(() => new Set(focus.activeNodeIds), [focus.activeNodeIds]);
  const activeEdgeSet = useMemo(() => new Set(focus.activeEdgeIds), [focus.activeEdgeIds]);
  const domainFocusActive = graph.focusDomainTitles.length > 0;

  const selectedTeamCard =
    selection?.kind === 'team' ? (teamById.get(selection.node.id) ?? null) : null;
  const editingMember =
    selectedTeamCard && editingMemberId
      ? (selectedTeamCard.members.find((member) => member.id === editingMemberId) ?? null)
      : null;

  const flowNodes: TeamFlowNode[] = useMemo(
    () =>
      graph.nodes.map((node) => {
        const selected = selection?.kind === 'team' && selection.node.id === node.id;
        const related = focus.hasFocus && activeNodeSet.has(node.id);
        const dimmed = focus.hasFocus && !related;
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
            dimmed,
            inFocusDomain: node.inFocusDomain && !dimmed,
            isExternal: node.isExternal && !dimmed,
            dropTarget: false,
            orientation,
          },
          className:
            [
              dimmed ? 'org-flow-rf-node--dimmed' : '',
              node.isExternal && !dimmed ? 'org-flow-rf-node--external' : '',
              node.inFocusDomain && !dimmed ? 'org-flow-rf-node--focus-domain' : '',
            ]
              .filter(Boolean)
              .join(' ') || undefined,
          draggable: false,
          selectable: true,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          zIndex: selected ? 4 : related ? 3 : node.isExternal ? 2 : 1,
        };
      }),
    [graph.nodes, selection, focus.hasFocus, activeNodeSet, orientation],
  );

  const flowEdges: Edge[] = useMemo(() => {
    // Keep the canvas calm: only draw the selected team's (or edge's) neighbourhood.
    if (!focus.hasFocus) return [];

    return graph.edges
      .filter((edge) => activeEdgeSet.has(edge.id))
      .map((edge) => {
        const selected = selection?.kind === 'edge' && selection.edge.id === edge.id;
        const crossDomain = edge.crossesBoundary;
        const baseWidth = edge.mode === 'collaboration' ? 3 : 2;
        const stroke = 'var(--color-ocean)';
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.modeLabel,
          type: 'smoothstep',
          animated: edge.mode === 'facilitation',
          style: {
            stroke,
            strokeWidth: crossDomain ? baseWidth + 1.5 : baseWidth + 1,
            strokeDasharray: edge.mode === 'facilitation' ? '6 4' : undefined,
            opacity: 1,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 18,
            height: 18,
            color: stroke,
          },
          selected,
          zIndex: 2,
          className: crossDomain ? 'org-flow-edge--cross-domain' : 'org-flow-edge--related',
        };
      });
  }, [graph.edges, focus.hasFocus, activeEdgeSet, selection]);

  const toggleDomain = (title: string) => {
    setDomainFilters((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
    setSelection(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as DragMemberPayload | undefined;
    if (data) setActiveDrag(data);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const data = event.active.data.current as DragMemberPayload | undefined;
    const toTeamId = event.over ? parseTeamDropId(event.over.id) : null;
    if (!data || !toTeamId || toTeamId === data.fromTeamId) return;
    onMovePerson({
      memberId: data.memberId,
      fromTeamId: data.fromTeamId,
      toTeamId,
    });
    const nextNode = graph.nodes.find((node) => node.id === toTeamId);
    if (nextNode) setSelection({ kind: 'team', node: nextNode });
  };

  if (teams.length === 0) {
    return <p className="organisation-zone-empty">No teams yet.</p>;
  }

  return (
    <div
      className={['organisation-flow-graph', expanded ? 'graph-stage--expanded' : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="organisation-flow-graph"
      data-expanded={expanded ? 'true' : 'false'}
      data-focus={focus.hasFocus ? 'true' : 'false'}
      data-domain-focus={domainFocusActive ? 'true' : 'false'}
      data-relation-view={relationView}
    >
      <div className="organisation-flow-graph-toolbar">
        <div
          className="organisation-domain-multipicker"
          role="group"
          aria-label="Domain focus"
          data-testid="organisation-flow-graph-domain"
        >
          <span className="organisation-domain-multipicker-label">Domains</span>
          <div className="organisation-domain-multipicker-options">
            {graph.domainOptions.map((option) => {
              const checked = domainFilters.includes(option.title);
              return (
                <label
                  key={option.title}
                  className={
                    checked
                      ? 'organisation-domain-multipicker-option is-checked'
                      : 'organisation-domain-multipicker-option'
                  }
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDomain(option.title)}
                    data-testid={`organisation-domain-option-${option.title}`}
                  />
                  <span>{option.title}</span>
                </label>
              );
            })}
          </div>
          {domainFilters.length > 0 ? (
            <button
              type="button"
              className="btn-tertiary organisation-domain-multipicker-clear"
              onClick={() => {
                setDomainFilters([]);
                setSelection(null);
              }}
            >
              Clear
            </button>
          ) : null}
        </div>
        <div
          className="organisation-flow-graph-relation-view"
          role="radiogroup"
          aria-label="Relationship direction"
          data-testid="organisation-flow-graph-relation-view"
        >
          <span className="organisation-flow-graph-relation-view-label">Relationships</span>
          <div className="organisation-flow-graph-relation-view-options">
            <label
              className={
                relationView === 'depends_on'
                  ? 'organisation-flow-graph-relation-view-option is-checked'
                  : 'organisation-flow-graph-relation-view-option'
              }
            >
              <input
                type="radio"
                name="organisation-flow-relation-view"
                value="depends_on"
                checked={relationView === 'depends_on'}
                onChange={() => setRelationView('depends_on')}
                data-testid="organisation-flow-relation-depends-on"
              />
              <span>Depends on</span>
            </label>
            <label
              className={
                relationView === 'depended_on_by'
                  ? 'organisation-flow-graph-relation-view-option is-checked'
                  : 'organisation-flow-graph-relation-view-option'
              }
            >
              <input
                type="radio"
                name="organisation-flow-relation-view"
                value="depended_on_by"
                checked={relationView === 'depended_on_by'}
                onChange={() => setRelationView('depended_on_by')}
                data-testid="organisation-flow-relation-depended-on-by"
              />
              <span>Depended on by</span>
            </label>
          </div>
        </div>
        <div
          className="organisation-flow-graph-range"
          role="group"
          aria-label="Dependency date range"
          data-testid="organisation-flow-graph-range"
        >
          <label className="organisation-field organisation-flow-graph-range-field">
            <span>From</span>
            <input
              type="date"
              value={rangeFrom}
              onChange={(event) => {
                onRangeFromChange(event.target.value);
                setSelection(null);
              }}
              data-testid="organisation-flow-range-from"
            />
          </label>
          <label className="organisation-field organisation-flow-graph-range-field">
            <span>To</span>
            <input
              type="date"
              value={rangeTo}
              onChange={(event) => {
                onRangeToChange(event.target.value);
                setSelection(null);
              }}
              data-testid="organisation-flow-range-to"
            />
          </label>
          {rangeFrom !== todayIsoDate() || rangeTo !== todayIsoDate() ? (
            <button
              type="button"
              className="btn-tertiary"
              onClick={() => {
                const today = todayIsoDate();
                onRangeFromChange(today);
                onRangeToChange(today);
                setSelection(null);
              }}
              data-testid="organisation-flow-range-clear"
            >
              Reset to today
            </button>
          ) : null}
        </div>
        <div className="organisation-flow-graph-toolbar-actions">
          <GraphStageExpandButton
            expanded={expanded}
            onToggle={toggleExpanded}
            testId="organisation-flow-expand"
            variant="primary"
          />
        </div>
      </div>

      {expanded ? null : (
        <div
          className="organisation-flow-graph-legend"
          aria-label="Interaction mode legend"
          data-testid="organisation-flow-graph-legend"
        >
          <p className="organisation-flow-graph-legend-intro">
            Select a team to reveal its relationships. Toggle <strong>Depends on</strong> (outbound)
            or <strong>Depended on by</strong> (inbound). Lines stay hidden until then so the map
            stays readable. Date range defaults to today - widen it to include planned or past
            interactions.
          </p>
          <ul className="organisation-flow-graph-legend-list">
            <li>
              <span className="organisation-flow-graph-legend-item">
                <span
                  className="organisation-mode-glyph organisation-mode-glyph--triangle"
                  aria-hidden="true"
                />
                <span className="organisation-flow-graph-legend-copy">
                  <strong>X-as-a-Service</strong>
                  <span className="organisation-flow-graph-legend-stroke"> · solid line</span>
                  <span className="organisation-flow-graph-legend-teaching">
                    {INTERACTION_MODE_COPY.x_as_a_service.teaching}
                  </span>
                </span>
              </span>
            </li>
            <li>
              <span className="organisation-flow-graph-legend-item">
                <span
                  className="organisation-mode-glyph organisation-mode-glyph--parallelogram"
                  aria-hidden="true"
                />
                <span className="organisation-flow-graph-legend-copy">
                  <strong>Collaboration</strong>
                  <span className="organisation-flow-graph-legend-stroke"> · thick line</span>
                  <span className="organisation-flow-graph-legend-teaching">
                    {INTERACTION_MODE_COPY.collaboration.teaching}
                  </span>
                </span>
              </span>
            </li>
            <li>
              <span className="organisation-flow-graph-legend-item">
                <span
                  className="organisation-mode-glyph organisation-mode-glyph--circle"
                  aria-hidden="true"
                />
                <span className="organisation-flow-graph-legend-copy">
                  <strong>Facilitation</strong>
                  <span className="organisation-flow-graph-legend-stroke">
                    {' '}
                    · dotted / animated
                  </span>
                  <span className="organisation-flow-graph-legend-teaching">
                    {INTERACTION_MODE_COPY.facilitation.teaching}
                  </span>
                </span>
              </span>
            </li>
          </ul>
          {domainFocusActive ? (
            <p className="organisation-flow-graph-legend-cross">
              Ocean-highlighted edges cross into other domains.
            </p>
          ) : null}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        {graph.empty ? (
          <p className="organisation-zone-empty">No teams in this domain focus.</p>
        ) : (
          <div
            className={
              expanded
                ? 'organisation-flow-graph-workspace organisation-flow-graph-workspace--split'
                : 'organisation-flow-graph-workspace organisation-flow-graph-workspace--stack'
            }
            data-layout={expanded ? 'split' : 'stack'}
          >
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
                </ReactFlow>
              </ReactFlowProvider>
            </div>

            <aside
              className="organisation-flow-graph-detail"
              data-testid="organisation-flow-graph-detail"
              aria-live="polite"
            >
              {selection?.kind === 'team' && selectedTeamCard ? (
                <TeamSidePanel
                  team={selectedTeamCard}
                  graphNode={selection.node}
                  addingPerson={addingPerson}
                  editingMember={editingMember}
                  disciplineOptions={disciplineOptions}
                  teams={teams}
                  onEditTeam={() => onEditTeam(selectedTeamCard.id)}
                  onStartAdd={() => {
                    setAddingPerson(true);
                    setEditingMemberId(null);
                  }}
                  onCancelAdd={() => setAddingPerson(false)}
                  onQuickAdd={(input) => {
                    onQuickAdd(input);
                    setAddingPerson(false);
                  }}
                  onSelectMember={(memberId) => {
                    setEditingMemberId(memberId);
                    setAddingPerson(false);
                  }}
                  onCloseMember={() => setEditingMemberId(null)}
                  onSaveAllocation={(input) => {
                    onSaveAllocation(input);
                    setEditingMemberId(input.memberId);
                    if (input.teamId !== selectedTeamCard.id) {
                      const nextNode = graph.nodes.find((node) => node.id === input.teamId);
                      if (nextNode) setSelection({ kind: 'team', node: nextNode });
                    }
                  }}
                  onClose={() => setSelection(null)}
                />
              ) : selection?.kind === 'edge' ? (
                <div>
                  <p className="organisation-flow-graph-detail-kind">Interaction</p>
                  <h3 className="organisation-flow-graph-detail-title">
                    {selection.edge.modeLabel}
                  </h3>
                  <p className="organisation-flow-graph-detail-body">{selection.edge.sentence}</p>
                  <p className="organisation-flow-graph-detail-meta">
                    {selection.edge.modeTeaching}
                  </p>
                  {selection.edge.expectedUntil ? (
                    <p className="organisation-flow-graph-detail-meta">
                      Expected until {selection.edge.expectedUntil}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div>
                  <p className="organisation-flow-graph-detail-empty">
                    Select a team to see people and capacity. Drag a person onto another node to
                    move them between teams.
                  </p>
                  <ul
                    className="organisation-flow-team-picker"
                    data-testid="organisation-flow-team-picker"
                  >
                    {graph.nodes
                      .filter((node) => !node.isExternal)
                      .map((node) => (
                        <li key={node.id}>
                          <button
                            type="button"
                            className="organisation-flow-team-picker-btn"
                            data-testid={`organisation-flow-select-${node.id}`}
                            onClick={() => setSelection({ kind: 'team', node })}
                          >
                            <span className="organisation-flow-team-picker-name">{node.label}</span>
                            <span className="organisation-flow-team-picker-meta">
                              {node.roleLabel}
                              {node.domainTitle ? ` · ${node.domainTitle}` : ''}
                            </span>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </aside>
          </div>
        )}

        <DragOverlay dropAnimation={null}>
          {activeDrag ? <PersonChip member={activeDrag.member} dragging overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function TeamSidePanel({
  team,
  graphNode,
  addingPerson,
  editingMember,
  disciplineOptions,
  teams,
  onEditTeam,
  onStartAdd,
  onCancelAdd,
  onQuickAdd,
  onSelectMember,
  onCloseMember,
  onSaveAllocation,
  onClose,
}: {
  team: TeamMeta;
  graphNode: OrganisationFlowGraphNode;
  addingPerson: boolean;
  editingMember: TeamMeta['members'][number] | null;
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  teams: TeamMeta[];
  onEditTeam: () => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onQuickAdd: (input: OrganisationGraphQuickAddInput) => void;
  onSelectMember: (memberId: string) => void;
  onCloseMember: () => void;
  onSaveAllocation: (input: OrganisationGraphAllocateInput) => void;
  onClose: () => void;
}) {
  return (
    <div data-testid={`organisation-team-${team.id}`}>
      <div className="organisation-flow-graph-detail-header">
        <div>
          <p className="organisation-flow-graph-detail-kind">{graphNode.roleLabel}</p>
          <h3 className="organisation-flow-graph-detail-title">{team.displayName}</h3>
        </div>
        <button type="button" className="btn-tertiary" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="organisation-flow-graph-detail-meta">{team.capacityLabel}</p>
      {team.domainTitle ? (
        <p className="organisation-flow-graph-detail-meta">Domain · {team.domainTitle}</p>
      ) : null}
      {team.streamTitles.length > 0 ? (
        <p className="organisation-flow-graph-detail-meta">
          Stream{team.streamTitles.length > 1 ? 's' : ''} · {team.streamTitles.join(', ')}
        </p>
      ) : null}
      {team.platformScopeLabel ? (
        <p className="organisation-flow-graph-detail-meta">
          Platform scope · {team.platformScopeLabel}
        </p>
      ) : null}
      {team.facilitatesLabels.length > 0 ? (
        <p className="organisation-flow-graph-detail-meta">
          Facilitates · {team.facilitatesLabels.join(', ')}
        </p>
      ) : null}
      {team.purpose ? <p className="organisation-flow-graph-detail-body">{team.purpose}</p> : null}

      <div className="organisation-team-header-actions organisation-flow-graph-detail-actions">
        <button
          type="button"
          className="organisation-team-add"
          onClick={onEditTeam}
          data-testid={`organisation-edit-team-${team.id}`}
        >
          Edit team
        </button>
        <button type="button" className="organisation-team-add" onClick={onStartAdd}>
          Add person
        </button>
      </div>

      <section className="organisation-flow-graph-detail-section">
        <h4 className="organisation-flow-graph-detail-section-title flex items-center justify-between gap-3">
          People
          <span className="organisation-flow-graph-accordion-count">{team.members.length}</span>
        </h4>
        {team.members.length === 0 ? (
          <p className="organisation-flow-graph-detail-empty">
            No people yet. Add someone, or drop a person from another team onto this node.
          </p>
        ) : (
          <ul className="organisation-person-list" aria-label={`People on ${team.displayName}`}>
            {team.members.map((member) => (
              <li key={member.id}>
                <DraggablePersonChip
                  teamId={team.id}
                  member={member}
                  selected={editingMember?.id === member.id}
                  onSelect={() => onSelectMember(member.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
      {addingPerson ? (
        <QuickAddForm
          teamId={team.id}
          disciplineOptions={disciplineOptions}
          onCancel={onCancelAdd}
          onSubmit={onQuickAdd}
        />
      ) : null}

      {editingMember ? (
        <AllocationEditor
          key={`${team.id}:${editingMember.id}`}
          teamId={team.id}
          member={editingMember}
          teams={teams}
          disciplineOptions={disciplineOptions}
          onClose={onCloseMember}
          onSave={onSaveAllocation}
        />
      ) : null}
    </div>
  );
}

function DraggablePersonChip({
  teamId,
  member,
  selected,
  onSelect,
}: {
  teamId: string;
  member: OrganisationFlowGraphMember;
  selected: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `member:${teamId}:${member.id}`,
    data: {
      memberId: member.id,
      fromTeamId: teamId,
      member,
    } satisfies DragMemberPayload,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <PersonChip
      ref={setNodeRef}
      member={member}
      selected={selected}
      dragging={isDragging}
      style={style}
      onClick={onSelect}
      dragHandleProps={{ ...listeners, ...attributes }}
    />
  );
}

type PersonChipProps = {
  member: OrganisationFlowGraphMember;
  selected?: boolean;
  dragging?: boolean;
  overlay?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  dragHandleProps?: Record<string, unknown>;
  ref?: Ref<HTMLDivElement>;
};

function PersonChip({
  member,
  selected = false,
  dragging = false,
  overlay = false,
  style,
  onClick,
  dragHandleProps,
  ref,
}: PersonChipProps) {
  return (
    <div
      ref={ref}
      className={[
        'organisation-person-chip',
        selected ? 'organisation-person-chip--selected' : '',
        dragging ? 'organisation-person-chip--dragging' : '',
        overlay ? 'organisation-person-chip--overlay' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      data-testid={`organisation-person-${member.id}`}
    >
      <button
        type="button"
        className="organisation-person-chip-main"
        onClick={onClick}
        aria-pressed={selected}
      >
        <span className="organisation-person-avatar" aria-hidden="true">
          {member.initials}
        </span>
        <span className="organisation-person-copy">
          <span className="organisation-person-name">{member.displayName}</span>
          <span className="organisation-person-meta">
            {member.disciplineLabel} · {member.ftePercent}%
          </span>
        </span>
      </button>
      {dragHandleProps ? (
        <button
          type="button"
          className="organisation-person-drag"
          aria-label={`Drag ${member.displayName}`}
          {...dragHandleProps}
        >
          ⋮⋮
        </button>
      ) : null}
    </div>
  );
}

function QuickAddForm({
  teamId,
  disciplineOptions,
  onCancel,
  onSubmit,
}: {
  teamId: string;
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  onCancel: () => void;
  onSubmit: (input: OrganisationGraphQuickAddInput) => void;
}) {
  const [displayName, setDisplayName] = useState('');
  const [discipline, setDiscipline] = useState<MemberDiscipline>('engineering');
  const [ftePercent, setFtePercent] = useState(100);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit({
      teamId,
      displayName,
      title: '',
      discipline,
      ftePercent,
    });
  };

  return (
    <form className="organisation-quick-add" onSubmit={submit} data-testid="organisation-quick-add">
      <label className="organisation-field">
        <span>Name</span>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Nina Torres"
          autoFocus
        />
      </label>
      <div className="organisation-quick-add-row">
        <label className="organisation-field">
          <span>Discipline</span>
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value as MemberDiscipline)}
          >
            {disciplineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="organisation-field">
          <span>FTE %</span>
          <input
            type="number"
            min={0}
            max={100}
            value={ftePercent}
            onChange={(event) => setFtePercent(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="organisation-form-actions">
        <button type="submit" className="btn-primary">
          Add to team
        </button>
        <button type="button" className="btn-tertiary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AllocationEditor({
  teamId,
  member,
  teams,
  disciplineOptions,
  onClose,
  onSave,
}: {
  teamId: string;
  member: TeamMeta['members'][number];
  teams: TeamMeta[];
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  onClose: () => void;
  onSave: (input: OrganisationGraphAllocateInput) => void;
}) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [title, setTitle] = useState(member.title);
  const [discipline, setDiscipline] = useState(member.discipline);
  const [ftePercent, setFtePercent] = useState(member.ftePercent);
  const [nextTeamId, setNextTeamId] = useState(teamId);
  const [effectiveFrom, setEffectiveFrom] = useState(member.effectiveFrom ?? '');
  const [effectiveUntil, setEffectiveUntil] = useState(member.effectiveUntil ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      memberId: member.id,
      fromTeamId: teamId,
      teamId: nextTeamId,
      displayName,
      title,
      discipline,
      ftePercent,
      effectiveFrom: effectiveFrom || undefined,
      effectiveUntil: effectiveUntil || undefined,
    });
  };

  return (
    <form
      className="organisation-allocation-editor"
      onSubmit={submit}
      data-testid="organisation-allocation-editor"
      aria-label={`Allocate ${member.displayName}`}
    >
      <div className="organisation-allocation-editor-header">
        <div>
          <p className="eyebrow">Capacity seat</p>
          <h3 className="organisation-section-title">{member.displayName}</h3>
        </div>
        <button type="button" className="btn-tertiary" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="organisation-allocation-grid">
        <label className="organisation-field">
          <span>Name</span>
          <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </label>
        <label className="organisation-field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="organisation-field">
          <span>Team</span>
          <select value={nextTeamId} onChange={(event) => setNextTeamId(event.target.value)}>
            {teams.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="organisation-field">
          <span>Discipline</span>
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value as MemberDiscipline)}
          >
            {disciplineOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="organisation-field organisation-field-span">
          <span>Allocation · {ftePercent}% FTE</span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={ftePercent}
            onChange={(event) => setFtePercent(Number(event.target.value))}
          />
        </label>
        <label className="organisation-field">
          <span>Effective from</span>
          <input
            type="date"
            value={effectiveFrom}
            onChange={(event) => setEffectiveFrom(event.target.value)}
          />
        </label>
        <label className="organisation-field">
          <span>Effective until</span>
          <input
            type="date"
            value={effectiveUntil}
            onChange={(event) => setEffectiveUntil(event.target.value)}
          />
        </label>
      </div>

      <div className="organisation-form-actions">
        <button type="submit" className="btn-primary">
          Save allocation
        </button>
      </div>
    </form>
  );
}
