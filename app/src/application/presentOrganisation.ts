import {
  detectSteerSpecMismatches,
  DISCIPLINE_COPY,
  INTERACTION_MODE_COPY,
  MEMBER_DISCIPLINES,
  PLATFORM_SCOPE_COPY,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_TYPE_COPY,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  projectSteerSpecAsOf,
  type InteractionMode,
  type InteractionShapeGeometry,
  type MemberDiscipline,
  type PlatformScope,
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
  platformScope: PlatformScope | null;
  platformScopeLabel: string | null;
  streamIds: string[];
  streamTitles: string[];
  /** Enabling: stream-aligned (or other) teams this team facilitates. */
  facilitatesLabels: string[];
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

export type OrganisationFlowBand = {
  id: string;
  title: string;
  kind: 'stream' | 'ungrouped';
  domainTitle: string | null;
  streamAlignedTeams: OrganisationTeamCard[];
  /** Complicated subsystems in this stream (not nested under a team). */
  complicatedSubsystems: OrganisationTeamCard[];
};

export type OrganisationFlowPlatform = {
  team: OrganisationTeamCard;
  scope: PlatformScope | null;
  scopeLabel: string | null;
  groupingTitle: string | null;
};

export type OrganisationFlowEnabling = {
  team: OrganisationTeamCard;
  facilitatesLabels: string[];
};

export type OrganisationFlowModel = {
  streams: OrganisationFlowBand[];
  platforms: OrganisationFlowPlatform[];
  enabling: OrganisationFlowEnabling[];
  orphanTeams: OrganisationTeamCard[];
};

export type OrganisationLayout = 'zones' | 'flow';

/** Executive view modes on How work is organised. */
export type OrganisationViewMode = 'flow_of_change' | 'as_is' | 'domain';

export type OrganisationDomainOption = {
  id: string;
  title: string;
  streamCount: number;
};

export type OrganisationStreamOption = {
  id: string;
  title: string;
  domainId: string | null;
  domainTitle: string | null;
};

/** Zoomed-out flow-of-change lane — names only, no capacity detail (LVT overlay later). */
export type OrganisationOverviewLane = {
  id: string;
  title: string;
  domainTitle: string | null;
  streamAlignedLabels: string[];
  complicatedSubsystemLabels: string[];
};

export type OrganisationOverview = {
  cue: string;
  lvtPlaceholder: string;
  lanes: OrganisationOverviewLane[];
  platforms: Array<{ id: string; title: string; scopeLabel: string | null }>;
  enabling: Array<{ id: string; title: string; facilitatesLabels: string[] }>;
};

export type OrganisationDomainEdge = OrganisationRelationship & {
  /** True when one endpoint sits outside the focused domain. */
  crossesBoundary: boolean;
};

export type OrganisationDomainFocus = {
  domainId: string;
  domainTitle: string;
  streamBands: OrganisationFlowBand[];
  internalEdges: OrganisationDomainEdge[];
  externalEdges: OrganisationDomainEdge[];
  externalTeams: OrganisationTeamCard[];
  lead: string;
};

export type PresentOrganisationOptions = {
  /** ISO date — project members and relationships as of this day. */
  asOf?: string | null;
  /** `auto` uses flow when streams or platform groupings exist. */
  layout?: OrganisationLayout | 'auto';
  /** Which executive canvas to present. */
  viewMode?: OrganisationViewMode;
  /** Domain id when viewMode is `domain`. */
  domainId?: string | null;
};

export type OrganisationModel = {
  workspaceTitle: string;
  lead: string;
  teachingLine: string;
  interactionTeaching: string;
  pointInTimeLine: string;
  asOf: string | null;
  layout: OrganisationLayout;
  viewMode: OrganisationViewMode;
  empty: boolean;
  zones: OrganisationZone[];
  flow: OrganisationFlowModel | null;
  overview: OrganisationOverview | null;
  domainOptions: OrganisationDomainOption[];
  streamOptions: OrganisationStreamOption[];
  domainFocus: OrganisationDomainFocus | null;
  relationships: OrganisationRelationship[];
  overloadBanner: string | null;
  mismatches: SteerMismatch[];
};

export type AddOrganisationTeamInput = {
  displayName: string;
  role: OrganisationTeamRole;
  /** Prefer an explicit stream for stream-aligned / complicated-subsystem teams. */
  streamId?: string | null;
  /** When set without streamId, the first stream in the domain is used. */
  domainId?: string | null;
};

export type UpdateOrganisationTeamInput = {
  teamId: string;
  displayName: string;
  role: OrganisationTeamRole;
  streamId?: string | null;
  domainId?: string | null;
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

export function presentOrganisation(
  spec: SteerSpec,
  options: PresentOrganisationOptions = {},
): OrganisationModel {
  const asOf = options.asOf?.trim() || null;
  const projected = projectSteerSpecAsOf(spec, asOf);
  const teams = projected.spec.teams.map(normalizeTeam);
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const streams = projected.spec.streams ?? [];
  const domains = projected.spec.domains ?? [];
  const groupings = projected.spec.groupings ?? [];
  const streamTitleById = new Map(streams.map((stream) => [stream.id, stream.title] as const));
  const domainTitleByStreamId = new Map<string, string>();
  for (const domain of domains) {
    for (const streamId of domain.memberStreamIds) {
      domainTitleByStreamId.set(streamId, domain.title);
    }
  }

  const relationshipsRaw = projected.spec.relationships.map(normalizeRelationship);
  const facilitatesByTeamId = new Map<string, string[]>();
  for (const relationship of relationshipsRaw) {
    if (relationship.mode !== 'facilitation') continue;
    const from = teamById.get(relationship.fromTeamId);
    const to = teamById.get(relationship.toTeamId);
    if (!from || !to) continue;
    const list = facilitatesByTeamId.get(from.id) ?? [];
    list.push(to.displayName);
    facilitatesByTeamId.set(from.id, list);
  }

  const mismatches = detectSteerSpecMismatches({
    ...projected,
    spec: {
      ...projected.spec,
      teams,
      relationships: relationshipsRaw,
    },
  });
  const overload = mismatches.find((item) => item.code === 'platform_overload') ?? null;

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
      teams: teams
        .filter((team) => team.role === role)
        .map((team) =>
          presentTeamCard(team, copy, streamTitleById, facilitatesByTeamId.get(team.id) ?? []),
        ),
    };
  });

  const cardsById = new Map(
    zones.flatMap((zone) => zone.teams).map((team) => [team.id, team] as const),
  );

  const layoutPreference = options.layout ?? 'auto';
  const layout: OrganisationLayout =
    layoutPreference === 'auto'
      ? streams.length > 0 || groupings.length > 0
        ? 'flow'
        : 'zones'
      : layoutPreference;

  const flow =
    layout === 'flow'
      ? buildFlowModel({
          streams,
          domains,
          groupings,
          teams,
          cardsById,
          domainTitleByStreamId,
        })
      : null;

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

  const viewMode: OrganisationViewMode = options.viewMode ?? 'as_is';
  const domainOptions: OrganisationDomainOption[] = domains.map((domain) => ({
    id: domain.id,
    title: domain.title,
    streamCount: domain.memberStreamIds.length,
  }));
  const selectedDomainId =
    options.domainId?.trim() || (viewMode === 'domain' ? (domainOptions[0]?.id ?? null) : null);

  const overview = flow ? buildOverview(flow) : null;
  const streamOptions: OrganisationStreamOption[] = streams.map((stream) => ({
    id: stream.id,
    title: stream.title,
    domainId: domains.find((domain) => domain.memberStreamIds.includes(stream.id))?.id ?? null,
    domainTitle: domainTitleByStreamId.get(stream.id) ?? null,
  }));

  const domainFocus =
    viewMode === 'domain' && selectedDomainId && flow
      ? buildDomainFocus({
          domainId: selectedDomainId,
          domains,
          flow,
          relationships,
          cardsById,
        })
      : null;

  const teachingByView: Record<OrganisationViewMode, string> = {
    flow_of_change:
      'Zoomed-out flow of change (left → right). Streams are the spine; platforms and enabling sit as support. Detail and people are hidden — Lean Value Tree overlay comes later.',
    as_is:
      layout === 'flow'
        ? 'As-is team shape for the selected day: streams, capacity, and interaction modes. Stream-aligned teams ideally own one stream; complicated subsystems sit in a stream; enabling facilitates one or many.'
        : 'Four Team Topologies shapes: stream-aligned (horizontal), platform (dotted square), enabling (vertical), and complicated subsystem (octagon). Platforms exist to reduce cognitive load so stream-aligned teams can ship faster.',
    domain:
      domainFocus?.lead ??
      'Zoom into a domain to see its streams and highlight connections that leave the domain.',
  };

  return {
    workspaceTitle: projected.metadata.title ?? humanizeName(projected.metadata.name),
    lead: 'Topology intent for fast flow of value — not an HR reporting chart.',
    teachingLine: teachingByView[viewMode],
    interactionTeaching:
      'Only three interaction modes — and three shapes: X-as-a-Service (triangle), Collaboration (parallelogram), Facilitation (circle). Interaction mode shows how embedded support teams are.',
    pointInTimeLine: asOf
      ? `Point in time: ${asOf}. Relationships and capacity will change as goals change.`
      : 'This map is a point in time — pick a date to project capacity and relationships as of that day.',
    asOf,
    layout,
    viewMode,
    empty: teams.length === 0,
    zones,
    flow,
    overview,
    domainOptions,
    streamOptions,
    domainFocus,
    relationships,
    overloadBanner: overload?.headline ?? null,
    mismatches,
  };
}

function buildOverview(flow: OrganisationFlowModel): OrganisationOverview {
  return {
    cue: 'Flow of change →',
    lvtPlaceholder:
      'Lean Value Tree overlay (outcomes and bets on this flow) will sit here in a later release.',
    lanes: flow.streams.map((band) => ({
      id: band.id,
      title: band.title,
      domainTitle: band.domainTitle,
      streamAlignedLabels: band.streamAlignedTeams.map((team) => team.displayName),
      complicatedSubsystemLabels: band.complicatedSubsystems.map((team) => team.displayName),
    })),
    platforms: flow.platforms.map((item) => ({
      id: item.team.id,
      title: item.groupingTitle ?? item.team.displayName,
      scopeLabel: item.scopeLabel,
    })),
    enabling: flow.enabling.map((item) => ({
      id: item.team.id,
      title: item.team.displayName,
      facilitatesLabels: item.facilitatesLabels,
    })),
  };
}

function buildDomainFocus(input: {
  domainId: string;
  domains: SteerSpec['spec']['domains'];
  flow: OrganisationFlowModel;
  relationships: OrganisationRelationship[];
  cardsById: Map<string, OrganisationTeamCard>;
}): OrganisationDomainFocus | null {
  const domain = input.domains.find((item) => item.id === input.domainId);
  if (!domain) return null;

  const streamIdSet = new Set(domain.memberStreamIds);
  const streamBands = input.flow.streams.filter(
    (band) => band.kind === 'stream' && streamIdSet.has(band.id),
  );
  const inDomainTeamIds = new Set(
    streamBands.flatMap((band) => [
      ...band.streamAlignedTeams.map((team) => team.id),
      ...band.complicatedSubsystems.map((team) => team.id),
    ]),
  );

  const internalEdges: OrganisationDomainEdge[] = [];
  const externalEdges: OrganisationDomainEdge[] = [];
  const externalTeamIds = new Set<string>();

  for (const edge of input.relationships) {
    const fromIn = inDomainTeamIds.has(edge.fromTeamId);
    const toIn = inDomainTeamIds.has(edge.toTeamId);
    if (!fromIn && !toIn) continue;
    if (fromIn && toIn) {
      internalEdges.push({ ...edge, crossesBoundary: false });
      continue;
    }
    externalEdges.push({ ...edge, crossesBoundary: true });
    if (!fromIn) externalTeamIds.add(edge.fromTeamId);
    if (!toIn) externalTeamIds.add(edge.toTeamId);
  }

  const externalTeams = [...externalTeamIds]
    .map((id) => input.cardsById.get(id))
    .filter((team): team is OrganisationTeamCard => Boolean(team));

  return {
    domainId: domain.id,
    domainTitle: domain.title,
    streamBands,
    internalEdges,
    externalEdges,
    externalTeams,
    lead: `Domain “${domain.title}” — streams inside the vertical, with edges that leave the domain called out.`,
  };
}
function buildFlowModel(input: {
  streams: SteerSpec['spec']['streams'];
  domains: SteerSpec['spec']['domains'];
  groupings: SteerSpec['spec']['groupings'];
  teams: SteerSpec['spec']['teams'];
  cardsById: Map<string, OrganisationTeamCard>;
  domainTitleByStreamId: Map<string, string>;
}): OrganisationFlowModel {
  const { streams, groupings, teams, cardsById, domainTitleByStreamId } = input;
  const placed = new Set<string>();
  const flowStreams: OrganisationFlowBand[] = [];

  for (const stream of streams) {
    const streamAlignedTeams = teams
      .filter(
        (team) => team.role === 'stream_aligned' && (team.streamIds ?? []).includes(stream.id),
      )
      .map((team) => cardsById.get(team.id))
      .filter((team): team is OrganisationTeamCard => Boolean(team));
    const complicatedSubsystems = teams
      .filter(
        (team) =>
          team.role === 'complicated_subsystem' && (team.streamIds ?? []).includes(stream.id),
      )
      .map((team) => cardsById.get(team.id))
      .filter((team): team is OrganisationTeamCard => Boolean(team));

    for (const team of streamAlignedTeams) placed.add(team.id);
    for (const team of complicatedSubsystems) placed.add(team.id);

    flowStreams.push({
      id: stream.id,
      title: stream.title,
      kind: 'stream',
      domainTitle: domainTitleByStreamId.get(stream.id) ?? null,
      streamAlignedTeams,
      complicatedSubsystems,
    });
  }

  const ungroupedAligned = teams
    .filter((team) => team.role === 'stream_aligned' && !placed.has(team.id))
    .map((team) => cardsById.get(team.id))
    .filter((team): team is OrganisationTeamCard => Boolean(team));
  const ungroupedCss = teams
    .filter((team) => team.role === 'complicated_subsystem' && !placed.has(team.id))
    .map((team) => cardsById.get(team.id))
    .filter((team): team is OrganisationTeamCard => Boolean(team));

  if (ungroupedAligned.length > 0 || ungroupedCss.length > 0) {
    for (const team of ungroupedAligned) placed.add(team.id);
    for (const team of ungroupedCss) placed.add(team.id);
    flowStreams.push({
      id: 'ungrouped-streams',
      title: 'Unassigned to a stream',
      kind: 'ungrouped',
      domainTitle: null,
      streamAlignedTeams: ungroupedAligned,
      complicatedSubsystems: ungroupedCss,
    });
  }

  const platformGroupingTitle = new Map<string, string>();
  for (const grouping of groupings.filter((item) => item.kind === 'platform')) {
    for (const memberId of grouping.memberTeamIds) {
      platformGroupingTitle.set(memberId, grouping.title);
    }
  }

  const platforms: OrganisationFlowPlatform[] = teams
    .filter((team) => team.role === 'platform')
    .map((team) => cardsById.get(team.id))
    .filter((team): team is OrganisationTeamCard => Boolean(team))
    .map((team) => {
      placed.add(team.id);
      return {
        team,
        scope: team.platformScope,
        scopeLabel: team.platformScopeLabel,
        groupingTitle: platformGroupingTitle.get(team.id) ?? null,
      };
    });

  const enabling: OrganisationFlowEnabling[] = teams
    .filter((team) => team.role === 'enabling')
    .map((team) => cardsById.get(team.id))
    .filter((team): team is OrganisationTeamCard => Boolean(team))
    .map((team) => {
      placed.add(team.id);
      return { team, facilitatesLabels: team.facilitatesLabels };
    });

  const orphanTeams = teams
    .filter((team) => !placed.has(team.id))
    .map((team) => cardsById.get(team.id))
    .filter((team): team is OrganisationTeamCard => Boolean(team));

  return { streams: flowStreams, platforms, enabling, orphanTeams };
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
    platformScope: team.platformScope,
    streamIds: team.streamIds ?? [],
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
  streamTitleById: Map<string, string>,
  facilitatesLabels: string[],
): OrganisationTeamCard {
  const members = team.members ?? [];
  const fteTotal = members.reduce((sum, member) => sum + member.ftePercent, 0) / 100;
  const memberCount = members.length;
  const capacityLabel =
    memberCount === 0
      ? 'No people yet — add or drag someone here'
      : `${memberCount} ${memberCount === 1 ? 'person' : 'people'} · ${formatFte(fteTotal)} FTE`;
  const platformScope = team.platformScope ?? null;
  const streamIds = team.streamIds ?? [];

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
    platformScope,
    platformScopeLabel: platformScope ? PLATFORM_SCOPE_COPY[platformScope].label : null,
    streamIds,
    streamTitles: streamIds.map((id) => streamTitleById.get(id) ?? id),
    facilitatesLabels,
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

function resolveTeamStreamIds(
  spec: SteerSpec,
  role: OrganisationTeamRole,
  input: { streamId?: string | null; domainId?: string | null },
): { ok: true; streamIds: string[] } | { ok: false; error: string } {
  const needsStream = role === 'stream_aligned' || role === 'complicated_subsystem';
  const streamId = input.streamId?.trim() || null;
  const domainId = input.domainId?.trim() || null;
  const streams = spec.spec.streams ?? [];
  const domains = spec.spec.domains ?? [];

  if (streamId) {
    const stream = streams.find((item) => item.id === streamId);
    if (!stream) {
      return { ok: false, error: 'That stream is not in this workspace.' };
    }
    if (domainId) {
      const domain = domains.find((item) => item.id === domainId);
      if (!domain) {
        return { ok: false, error: 'That domain is not in this workspace.' };
      }
      if (!domain.memberStreamIds.includes(streamId)) {
        return { ok: false, error: 'Pick a stream that belongs to the selected domain.' };
      }
    }
    return { ok: true, streamIds: [streamId] };
  }

  if (domainId) {
    const domain = domains.find((item) => item.id === domainId);
    if (!domain) {
      return { ok: false, error: 'That domain is not in this workspace.' };
    }
    const firstStreamId = domain.memberStreamIds[0];
    if (!firstStreamId) {
      return {
        ok: false,
        error: 'That domain has no streams yet — add a stream before placing a team in it.',
      };
    }
    if (needsStream) {
      return { ok: true, streamIds: [firstStreamId] };
    }
    return { ok: true, streamIds: [] };
  }

  if (needsStream && (streams.length > 0 || domains.length > 0)) {
    // Soft guidance lives in mismatches (stream_aligned_without_stream). Modal UX asks for
    // domain/stream; API still allows empty for gradual edits and test fixtures.
    return { ok: true, streamIds: [] };
  }

  return { ok: true, streamIds: [] };
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
): { ok: true; value: SteerSpec; teamId: string } | { ok: false; error: string } {
  const validated = validateAddOrganisationTeam(input);
  if (!validated.ok) return validated;

  const streams = resolveTeamStreamIds(spec, validated.role, input);
  if (!streams.ok) return streams;

  const id = uniqueTeamId(spec, validated.displayName);
  return {
    ok: true,
    teamId: id,
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
            streamIds: streams.streamIds,
          },
        ],
      },
    },
  };
}

export function applyUpdateOrganisationTeam(
  spec: SteerSpec,
  input: UpdateOrganisationTeamInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const displayName = input.displayName.trim();
  if (!displayName) {
    return { ok: false, error: 'Give the team a display name before saving.' };
  }
  const index = spec.spec.teams.findIndex((team) => team.id === input.teamId);
  if (index < 0) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }

  const streams = resolveTeamStreamIds(spec, input.role, input);
  if (!streams.ok) return streams;

  const current = spec.spec.teams[index];
  if (!current) {
    return { ok: false, error: 'That team is not in this workspace.' };
  }

  const nextTeams = [...spec.spec.teams];
  nextTeams[index] = {
    ...current,
    displayName,
    role: input.role,
    streamIds: streams.streamIds,
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

export type RemoveOrganisationRelationshipInput = {
  fromTeamId: string;
  toTeamId: string;
  mode: OrganisationInteractionMode;
};

export function applyRemoveOrganisationRelationship(
  spec: SteerSpec,
  input: RemoveOrganisationRelationshipInput,
): { ok: true; value: SteerSpec } | { ok: false; error: string } {
  const next = spec.spec.relationships.filter(
    (relationship) =>
      !(
        relationship.fromTeamId === input.fromTeamId &&
        relationship.toTeamId === input.toTeamId &&
        relationship.mode === input.mode
      ),
  );
  if (next.length === spec.spec.relationships.length) {
    return { ok: false, error: 'That relationship is not in this workspace.' };
  }
  return {
    ok: true,
    value: {
      ...spec,
      spec: {
        ...spec.spec,
        relationships: next,
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
