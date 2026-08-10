import { useMemo, useState, type CSSProperties, type FormEvent, type Ref } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { MemberDiscipline, TeamShapeGeometry } from '@steerlens/core';
import type {
  OrganisationTeamCard,
  OrganisationTeamMember,
  OrganisationZone,
} from '../../application/presentOrganisation';

export type QuickAddPersonInput = {
  teamId: string;
  displayName: string;
  title: string;
  ftePercent: number;
  discipline: MemberDiscipline;
};

export type AllocatePersonInput = {
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

export type MovePersonInput = {
  memberId: string;
  fromTeamId: string;
  toTeamId: string;
};

type OrganisationCapacityBoardProps = {
  zones: OrganisationZone[];
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  onQuickAdd: (input: QuickAddPersonInput) => void;
  onMovePerson: (input: MovePersonInput) => void;
  onSaveAllocation: (input: AllocatePersonInput) => void;
};

type DragMemberPayload = {
  memberId: string;
  fromTeamId: string;
  member: OrganisationTeamMember;
};

function teamDropId(teamId: string): string {
  return `team:${teamId}`;
}

function parseTeamDropId(id: string | number): string | null {
  const value = String(id);
  return value.startsWith('team:') ? value.slice('team:'.length) : null;
}

export function OrganisationCapacityBoard({
  zones,
  disciplineOptions,
  onQuickAdd,
  onMovePerson,
  onSaveAllocation,
}: OrganisationCapacityBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const [activeDrag, setActiveDrag] = useState<DragMemberPayload | null>(null);
  const [addingTeamId, setAddingTeamId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{ teamId: string; memberId: string } | null>(null);

  const allTeams = useMemo(() => zones.flatMap((zone) => zone.teams), [zones]);
  const selectedMember = useMemo(() => {
    if (!selected) return null;
    const team = allTeams.find((item) => item.id === selected.teamId);
    const member = team?.members.find((item) => item.id === selected.memberId);
    if (!team || !member) return null;
    return { team, member };
  }, [allTeams, selected]);

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
    setSelected({ teamId: toTeamId, memberId: data.memberId });
  };

  return (
    <div className="organisation-capacity" data-testid="organisation-capacity-board">
      <div className="organisation-capacity-intro">
        <p className="organisation-capacity-lead">
          Drag people between Team Topologies shapes to reallocate capacity. Click a person to tune
          FTE, title, and dates — or add someone directly onto a team.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveDrag(null)}
      >
        <div className="organisation-zones organisation-zones-four">
          {zones.map((zone) => (
            <section
              key={zone.role}
              className={
                zone.role === 'platform'
                  ? 'organisation-zone organisation-zone-platform'
                  : 'organisation-zone'
              }
              aria-labelledby={`zone-${zone.role}`}
            >
              <div className="organisation-zone-heading">
                <TeamShapeGlyph shape={zone.shape} />
                <div>
                  <p className="organisation-zone-eyebrow">{zone.topologyName}</p>
                  <h2 id={`zone-${zone.role}`} className="organisation-zone-title">
                    {zone.title}
                  </h2>
                </div>
              </div>
              <p className="organisation-zone-purpose">{zone.purpose}</p>
              <p className="organisation-zone-shape-hint">{zone.shapeTeaching}</p>

              {zone.teams.length === 0 ? (
                <p className="organisation-zone-empty">{zone.teaching}</p>
              ) : (
                <ul className="organisation-team-list">
                  {zone.teams.map((team) => (
                    <li key={team.id}>
                      <TeamShapeDropZone
                        team={team}
                        isAdding={addingTeamId === team.id}
                        disciplineOptions={disciplineOptions}
                        selectedMemberId={selected?.teamId === team.id ? selected.memberId : null}
                        onSelectMember={(memberId) => {
                          setSelected({ teamId: team.id, memberId });
                          setAddingTeamId(null);
                        }}
                        onStartAdd={() => {
                          setAddingTeamId(team.id);
                          setSelected(null);
                        }}
                        onCancelAdd={() => setAddingTeamId(null)}
                        onQuickAdd={(input) => {
                          onQuickAdd(input);
                          setAddingTeamId(null);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeDrag ? <PersonChip member={activeDrag.member} dragging overlay /> : null}
        </DragOverlay>
      </DndContext>

      {selectedMember ? (
        <AllocationEditor
          key={`${selectedMember.team.id}:${selectedMember.member.id}`}
          team={selectedMember.team}
          member={selectedMember.member}
          teams={allTeams}
          disciplineOptions={disciplineOptions}
          onClose={() => setSelected(null)}
          onSave={(input) => {
            onSaveAllocation(input);
            setSelected({ teamId: input.teamId, memberId: input.memberId });
          }}
        />
      ) : null}
    </div>
  );
}

function TeamShapeDropZone({
  team,
  isAdding,
  disciplineOptions,
  selectedMemberId,
  onSelectMember,
  onStartAdd,
  onCancelAdd,
  onQuickAdd,
}: {
  team: OrganisationTeamCard;
  isAdding: boolean;
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  selectedMemberId: string | null;
  onSelectMember: (memberId: string) => void;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onQuickAdd: (input: QuickAddPersonInput) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: teamDropId(team.id) });

  return (
    <div
      ref={setNodeRef}
      className={[
        'organisation-team-shape',
        `organisation-team-shape--${team.shape}`,
        isOver ? 'organisation-team-shape--over' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`organisation-team-${team.id}`}
      title={team.shapeTeaching}
    >
      <div className="organisation-team-shape-header">
        <div>
          <p className="organisation-team-name">{team.displayName}</p>
          <p className="organisation-team-capacity">{team.capacityLabel}</p>
        </div>
        <button type="button" className="organisation-team-add" onClick={onStartAdd}>
          Add person
        </button>
      </div>

      <ul className="organisation-person-list" aria-label={`People on ${team.displayName}`}>
        {team.members.map((member) => (
          <li key={member.id}>
            <DraggablePersonChip
              teamId={team.id}
              member={member}
              selected={selectedMemberId === member.id}
              onSelect={() => onSelectMember(member.id)}
            />
          </li>
        ))}
      </ul>

      {team.members.length === 0 && !isAdding ? (
        <p className="organisation-team-drop-hint">Drop a person here, or add someone new.</p>
      ) : null}

      {isAdding ? (
        <QuickAddForm
          teamId={team.id}
          disciplineOptions={disciplineOptions}
          onCancel={onCancelAdd}
          onSubmit={onQuickAdd}
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
  member: OrganisationTeamMember;
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
  member: OrganisationTeamMember;
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
  onSubmit: (input: QuickAddPersonInput) => void;
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
  team,
  member,
  teams,
  disciplineOptions,
  onClose,
  onSave,
}: {
  team: OrganisationTeamCard;
  member: OrganisationTeamMember;
  teams: OrganisationTeamCard[];
  disciplineOptions: Array<{ value: MemberDiscipline; label: string }>;
  onClose: () => void;
  onSave: (input: AllocatePersonInput) => void;
}) {
  const [displayName, setDisplayName] = useState(member.displayName);
  const [title, setTitle] = useState(member.title);
  const [discipline, setDiscipline] = useState(member.discipline);
  const [ftePercent, setFtePercent] = useState(member.ftePercent);
  const [teamId, setTeamId] = useState(team.id);
  const [effectiveFrom, setEffectiveFrom] = useState(member.effectiveFrom ?? '');
  const [effectiveUntil, setEffectiveUntil] = useState(member.effectiveUntil ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      memberId: member.id,
      fromTeamId: team.id,
      teamId,
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
          <select value={teamId} onChange={(event) => setTeamId(event.target.value)}>
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

function TeamShapeGlyph({ shape }: { shape: TeamShapeGeometry }) {
  return (
    <span
      className={`organisation-shape-glyph organisation-shape-glyph--${shape}`}
      aria-hidden="true"
    />
  );
}
