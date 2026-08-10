import {
  detectSteerSpecMismatches,
  INTERACTION_MODE_COPY,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_TYPE_COPY,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type InteractionMode,
  type SteerMismatch,
  type SteerSpec,
  type TeamRole,
} from '@steerlens/core';

export type OrganisationTeamRole = TeamRole;
export type OrganisationInteractionMode = InteractionMode;

export type OrganisationTeamMember = {
  id: string;
  displayName: string;
  title: string;
  ftePercent: number;
};

export type OrganisationTeamCard = {
  id: string;
  displayName: string;
  role: OrganisationTeamRole;
  roleLabel: string;
  purpose: string;
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
  sentence: string;
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
      teams: teams
        .filter((team) => team.role === role)
        .map((team) => presentTeamCard(team, copy.topologyName, copy.purpose)),
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
        sentence: `${from.displayName} ${modeCopy.sentenceVerb} ${to.displayName}`,
      },
    ];
  });

  return {
    workspaceTitle: spec.metadata.title ?? humanizeName(spec.metadata.name),
    lead: 'Topology intent for fast flow of value — not an HR reporting chart.',
    teachingLine:
      'Four team types from Team Topologies: stream-aligned, platform, enabling, and complicated subsystem. Platforms exist to reduce cognitive load so stream-aligned teams can ship faster.',
    interactionTeaching:
      'Only three interaction modes: X-as-a-Service, Collaboration (time-boxed), and Facilitation. Ambiguous “we should coordinate more” is not a mode.',
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
  roleLabel: string,
  purpose: string,
): OrganisationTeamCard {
  const members = team.members ?? [];
  const fteTotal = members.reduce((sum, member) => sum + member.ftePercent, 0) / 100;
  const memberCount = members.length;
  const capacityLabel =
    memberCount === 0
      ? 'No members recorded yet'
      : `${memberCount} ${memberCount === 1 ? 'member' : 'members'} · ${formatFte(fteTotal)} FTE`;

  return {
    id: team.id,
    displayName: team.displayName,
    role: team.role,
    roleLabel,
    purpose,
    memberCount,
    fteTotal,
    capacityLabel,
    members: members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      title: member.title,
      ftePercent: member.ftePercent,
    })),
  };
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
          },
        ],
      },
    },
  };
}

function formatFte(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function uniqueTeamId(spec: SteerSpec, displayName: string): string {
  const base = `team_${slugify(displayName)}`;
  const existing = new Set(spec.spec.teams.map((team) => team.id));
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
