import {
  detectSteerSpecMismatches,
  DISCIPLINE_COPY,
  INTERACTION_MODE_COPY,
  MEMBER_DISCIPLINES,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_TYPE_COPY,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type InteractionMode,
  type InteractionShapeGeometry,
  type MemberDiscipline,
  type SteerMismatch,
  type SteerSpec,
  type TeamRole,
  type TeamShapeGeometry,
} from '@steerlens/core';

export type OrganisationTeamRole = TeamRole;
export type OrganisationInteractionMode = InteractionMode;

export type OrganisationTeamMember = {
  id: string;
  displayName: string;
  discipline: MemberDiscipline;
  disciplineLabel: string;
  title: string;
  ftePercent: number;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  /** Short initials for capacity chips */
  initials: string;
};

export type OrganisationTeamCard = {
  id: string;
  displayName: string;
  role: OrganisationTeamRole;
  roleLabel: string;
  purpose: string;
  shape: TeamShapeGeometry;
  shapeTeaching: string;
  memberCount: number;
  fteTotal: number;
  capacityLabel: string;
  members: OrganisationTeamMember[];
};

export type OrganisationZone = {
  role: OrganisationTeamRole;
  title: string;
  topologyName: string;
  purpose: string;
  teaching: string;
  shape: TeamShapeGeometry;
  shapeTeaching: string;
  teams: OrganisationTeamCard[];
};

export type OrganisationRelationship = {
  fromTeamId: string;
  toTeamId: string;
  fromLabel: string;
  toLabel: string;
  mode: OrganisationInteractionMode;
  modeLabel: string;
  modeTeaching: string;
  shape: InteractionShapeGeometry;
  shapeTeaching: string;
  sentence: string;
  expectedUntil: string | null;
};

export type OrganisationModel = {
  workspaceTitle: string;
  lead: string;
  teachingLine: string;
  interactionTeaching: string;
  empty: boolean;
  zones: OrganisationZone[];
  relationships: OrganisationRelationship[];
  overloadBanner: string | null;
  mismatches: SteerMismatch[];
};

export type AddOrganisationTeamInput = {
  displayName: string;
  role: OrganisationTeamRole;
};

export type AddOrganisationRelationshipInput = {
  fromTeamId: string;
  toTeamId: string;
  mode: OrganisationInteractionMode;
  /** ISO date time-box, especially for collaboration/facilitation (Slice 1.5). */
  expectedUntil?: string;
};

export type AddOrganisationMemberInput = {
  teamId: string;
  displayName: string;
  title: string;
  ftePercent: number;
  discipline: MemberDiscipline;
  effectiveFrom?: string;
  effectiveUntil?: string;
};

export type UpdateOrganisationMemberInput = AddOrganisationMemberInput & {
  memberId: string;
};

export function presentOrganisation(spec: SteerSpec): OrganisationModel {
  const teams = spec.spec.teams.map(normalizeTeam);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const mismatches = detectSteerSpecMismatches({
    ...spec,
    spec: {
      ...spec.spec,
      teams,
      relationships: spec.spec.relationships.map(normalizeRelationship),
    },
  });
  const overload = mismatches.find((item) => item.code === 'platform_overload') ?? null;
  const relationshipsRaw = spec.spec.relationships.map(normalizeRelationship);

  const zones: OrganisationZone[] = TEAM_TOPOLOGY_TYPES.map((role) => {
    const copy = TOPOLOGY_TYPE_COPY[role];
    return {
      role,
      title: copy.zoneTitle,
      topologyName: copy.topologyName,
      purpose: copy.purpose,
      teaching: copy.teaching,
      shape: copy.shape,
      shapeTeaching: copy.shapeTeaching,
      teams: teams.filter((team) => team.role === role).map((team) => presentTeamCard(team, copy)),
    };
  });

  const relationships: OrganisationRelationship[] = relationshipsRaw.flatMap((relationship) => {
    const from = teamById.get(relationship.fromTeamId);
    const to = teamById.get(relationship.toTeamId);
    if (!from || !to) return [];
    const modeCopy = INTERACTION_MODE_COPY[relationship.mode];
    if (!modeCopy) return [];
    return [
      {
        fromTeamId: from.id,
        toTeamId: to.id,
        fromLabel: from.displayName,
        toLabel: to.displayName,
        mode: relationship.mode,
        modeLabel: modeCopy.modeName,
        modeTeaching: modeCopy.teaching,
        shape: modeCopy.shape,
        shapeTeaching: modeCopy.shapeTeaching,
        sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
        expectedUntil: relationship.expectedUntil ?? null,
      },
    ];
  });

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    lead: 'Topology intent for fast flow of value — not an HR reporting chart.',
    teachingLine:
      'Four Team Topologies shapes: stream-aligned (horizontal), platform (dotted square), enabling (vertical), and complicated subsystem (octagon). Platforms exist to reduce cognitive load so stream-aligned teams can ship faster.',
    interactionTeaching:
      'Only three interaction modes — and three shapes: X-as-a-Service (triangle), Collaboration (parallelogram), Facilitation (circle). Drag people between teams to reshape capacity.',
    empty: teams.length === 0,
    zones,
    relationships,
    overloadBanner: overload?.headline ?? null,
    mismatches,
  };
}

function normalizeTeam(
  team: SteerSpec['spec']['teams'][number],
): SteerSpec['spec']['teams'][number] {
  const role = normalizeTeamTopologyType(team.role);
  return {
    ...team,
    role: (TEAM_TOPOLOGY_TYPES as readonly string[]).includes(role)
      ? (role as TeamRole)
      : 'stream_aligned',
    members: team.members ?? [],
    externalRefs: team.externalRefs ?? [],
  };
}

function normalizeRelationship(
  relationship: SteerSpec['spec']['relationships'][number],
): SteerSpec['spec']['relationships'][number] {
  const mode = normalizeInteractionMode(relationship.mode);
  const known = mode in INTERACTION_MODE_COPY;
  return {
    ...relationship,
    mode: known ? (mode as InteractionMode) : 'x_as_a_service',
  };
}

function presentTeamCard(
  team: SteerSpec['spec']['teams'][number],
  copy: (typeof TOPOLOGY_TYPE_COPY)[TeamRole],
): OrganisationTeamCard {
  const members = team.members ?? [];
  const fteTotal = members.reduce((sum, member) => sum + member.ftePercent, 0) / 100;
  const memberCount = members.length;
  const capacityLabel =
    memberCount === 0
      ? 'No people yet — add or drag someone here'
      : `${memberCount} ${memberCount === 1 ? 'person' : 'people'} · ${formatFte(fteTotal)} FTE`;

  return {
    id: team.id,
    displayName: team.displayName,
    role: team.role,
    roleLabel: copy.topologyName,
    purpose: copy.purpose,
    shape: copy.shape,
    shapeTeaching: copy.shapeTeaching,
    memberCount,
    fteTotal,
    capacityLabel,
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      discipline: member.discipline,
      disciplineLabel: DISCIPLINE_COPY[member.discipline].label,
      title: member.title,
      ftePercent: member.ftePercent,
      effectiveFrom: member.effectiveFrom ?? null,
      effectiveUntil: member.effectiveUntil ?? null,
      initials: initialsFor(member.displayName),
    })),
  };
}

export function organisationMemberDisciplineOptions(): Array<{
  value: MemberDiscipline;
  label: string;
}> {
  return MEMBER_DISCIPLINES.map((value) => ({ value, label: DISCIPLINE_COPY[value].label }));
}

function validateAddOrganisationTeam(
  input: AddOrganisationTeamInput,
): { ok: true; displayName: string; role: OrganisationTeamRole } | { ok: false; error: string } {
  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, error: 'Give the team a display name before adding it.' };
  }
  return { ok: true, displayName, role: input.role };
}

export function applyAddOrganisationTeam(
  spec: SteerSpec,
  input: AddOrganisationTeamInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const validated = validateAddOrganisationTeam(input);
  if (!validated.ok) return validated;

  const id = uniqueTeamId(spec, validated.displayName);
  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        teams: [
          ...spec.spec.teams,
          {
            id,
            displayName: validated.displayName,
            role: validated.role,
            provenance: 'local',
            externalRefs: [],
            members: [],
          },
        ],
      },
    },
  };
}

export function applyAddOrganisationRelationship(
  spec: SteerSpec,
  input: AddOrganisationRelationshipInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  if (!input.fromTeamId || !input.toTeamId) {
    return { ok: false, error: 'Choose both teams for the relationship.' };
  }
  if (input.fromTeamId === input.toTeamId) {
    return { ok: false, error: 'A team cannot relate to itself.' };
  }
  const teamIds = new Set(spec.spec.teams.map((team) => team.id));
  if (!teamIds.has(input.fromTeamId) || !teamIds.has(input.toTeamId)) {
    return { ok: false, error: 'Both teams must already be in this workspace.' };
  }
  const duplicate = spec.spec.relationships.some(
    (relationship) =>
      relationship.fromTeamId === input.fromTeamId &&
      relationship.toTeamId === input.toTeamId &&
      relationship.mode === input.mode,
  );
  if (duplicate) {
    return { ok: false, error: 'That relationship is already recorded.' };
  }

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        relationships: [
          ...spec.spec.relationships,
          {
            fromTeamId: input.fromTeamId,
            toTeamId: input.toTeamId,
            mode: input.mode,
            expectedUntil: input.expectedUntil?.trim() || undefined,
          },
        ],
      },
    },
  };
}

function validateOrganisationMemberFields(
  input: Pick<
    AddOrganisationMemberInput,
    'displayName' | 'title' | 'ftePercent' | 'discipline' | 'effectiveFrom' | 'effectiveUntil'
  >,
):
  | {
      ok: true;
      displayName: string;
      title: string;
      ftePercent: number;
      discipline: MemberDiscipline;
      effectiveFrom: string | undefined;
      effectiveUntil: string | undefined;
    }
  | { ok: false; error: string } {
  const displayName = input.displayName.trim();
  const title = input.title.trim() || DISCIPLINE_COPY[input.discipline].label;
  if (!displayName) {
    return { ok: false, error: 'Give the person a name before saving.' };
  }
  if (!Number.isFinite(input.ftePercent) || input.ftePercent < 0 || input.ftePercent > 100) {
    return { ok: false, error: 'FTE percent must be between 0 and 100.' };
  }
  return {
    ok: true,
    displayName,
    title,
    ftePercent: input.ftePercent,
    discipline: input.discipline,
    effectiveFrom: input.effectiveFrom?.trim() || undefined,
    effectiveUntil: input.effectiveUntil?.trim() || undefined,
  };
}

export function applyAddOrganisationMember(
  spec: SteerSpec,
  input: AddOrganisationMemberInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const validated = validateOrganisationMemberFields(input);
  if (!validated.ok) return validated;

  const teamIndex = spec.spec.teams.findIndex((team) => team.id === input.teamId);
  if (teamIndex < 0) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }
  const team = spec.spec.teams[teamIndex];
  if (!team) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }

  const id = uniqueMemberId(spec, validated.displayName);
  const nextTeams = [...spec.spec.teams];
  nextTeams[teamIndex] = {
    ...team,
    members: [
      ...(team.members ?? []),
      {
        id,
        displayName: validated.displayName,
        title: validated.title,
        discipline: validated.discipline,
        ftePercent: validated.ftePercent,
        effectiveFrom: validated.effectiveFrom,
        effectiveUntil: validated.effectiveUntil,
      },
    ],
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        teams: nextTeams,
      },
    },
  };
}

export function applyUpdateOrganisationMember(
  spec: SteerSpec,
  input: UpdateOrganisationMemberInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const validated = validateOrganisationMemberFields(input);
  if (!validated.ok) return validated;

  const teamIndex = spec.spec.teams.findIndex((team) => team.id === input.teamId);
  if (teamIndex < 0) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }
  const team = spec.spec.teams[teamIndex];
  if (!team) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }
  const members = team.members ?? [];
  const memberIndex = members.findIndex((member) => member.id === input.memberId);
  if (memberIndex < 0) {
    return { ok: false, error: 'That member is not on this team.' };
  }
  const existing = members[memberIndex];
  if (!existing) {
    return { ok: false, error: 'That member is not on this team.' };
  }

  const nextMembers = [...members];
  nextMembers[memberIndex] = {
    ...existing,
    displayName: validated.displayName,
    title: validated.title,
    discipline: validated.discipline,
    ftePercent: validated.ftePercent,
    effectiveFrom: validated.effectiveFrom,
    effectiveUntil: validated.effectiveUntil,
  };
  const nextTeams = [...spec.spec.teams];
  nextTeams[teamIndex] = { ...team, members: nextMembers };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        teams: nextTeams,
      },
    },
  };
}

export type MoveOrganisationMemberInput = {
  memberId: string;
  fromTeamId: string;
  toTeamId: string;
  /** Optional FTE override when dropping onto the destination team. */
  ftePercent?: number;
};

export function applyMoveOrganisationMember(
  spec: SteerSpec,
  input: MoveOrganisationMemberInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  if (!input.fromTeamId || !input.toTeamId) {
    return { ok: false, error: 'Choose both the current and destination teams.' };
  }
  if (input.fromTeamId === input.toTeamId) {
    if (input.ftePercent === undefined) {
      return { ok: true, value: spec };
    }
    const team = spec.spec.teams.find((item) => item.id === input.fromTeamId);
    const member = team?.members?.find((item) => item.id === input.memberId);
    if (!team || !member) {
      return { ok: false, error: 'That person is not on the selected team.' };
    }
    return applyUpdateOrganisationMember(spec, {
      teamId: input.fromTeamId,
      memberId: input.memberId,
      displayName: member.displayName,
      title: member.title,
      discipline: member.discipline,
      ftePercent: input.ftePercent,
      effectiveFrom: member.effectiveFrom,
      effectiveUntil: member.effectiveUntil,
    });
  }

  const fromIndex = spec.spec.teams.findIndex((team) => team.id === input.fromTeamId);
  const toIndex = spec.spec.teams.findIndex((team) => team.id === input.toTeamId);
  if (fromIndex < 0 || toIndex < 0) {
    return { ok: false, error: 'Both teams must already be in this workspace.' };
  }
  const fromTeam = spec.spec.teams[fromIndex];
  const toTeam = spec.spec.teams[toIndex];
  if (!fromTeam || !toTeam) {
    return { ok: false, error: 'Both teams must already be in this workspace.' };
  }

  const fromMembers = [...(fromTeam.members ?? [])];
  const memberIndex = fromMembers.findIndex((member) => member.id === input.memberId);
  if (memberIndex < 0) {
    return { ok: false, error: 'That person is not on the selected team.' };
  }
  const [member] = fromMembers.splice(memberIndex, 1);
  if (!member) {
    return { ok: false, error: 'That person is not on the selected team.' };
  }

  if ((toTeam.members ?? []).some((item) => item.id === member.id)) {
    return { ok: false, error: 'That person is already on the destination team.' };
  }

  const moved = {
    ...member,
    ftePercent: input.ftePercent ?? member.ftePercent,
  };
  const nextTeams = [...spec.spec.teams];
  nextTeams[fromIndex] = { ...fromTeam, members: fromMembers };
  nextTeams[toIndex] = {
    ...toTeam,
    members: [...(toTeam.members ?? []), moved],
  };

  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        teams: nextTeams,
      },
    },
  };
}

function formatFte(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function initialsFor(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function uniqueTeamId(spec: SteerSpec, displayName: string): string {
  const base = `team_${slugify(displayName)}`;
  const existing = new Set(spec.spec.teams.map((team) => team.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function uniqueMemberId(spec: SteerSpec, displayName: string): string {
  const base = `mem_${slugify(displayName)}`;
  const existing = new Set(spec.spec.teams.flatMap((team) => team.members?.map((m) => m.id) ?? []));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'team';
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
