/**
 * Team Topologies vocabulary baked into SteerLens.
 * Source of truth for team types, interaction modes, and modeling shapes:
 * https://teamtopologies.com/key-concepts
 * https://github.com/TeamTopologies/Team-Shape-Templates
 *
 * Executive UI uses these plain-language labels; SteerSpec stores canonical ids.
 * Shape geometry (not colour alone) must stay distinct for colour-vision accessibility.
 */

export const TEAM_TOPOLOGY_TYPES = [
  'stream_aligned',
  'platform',
  'enabling',
  'complicated_subsystem',
] as const;

export type TeamTopologyType = (typeof TEAM_TOPOLOGY_TYPES)[number];

export const INTERACTION_MODES = ['x_as_a_service', 'collaboration', 'facilitation'] as const;

export type InteractionMode = (typeof INTERACTION_MODES)[number];

/** Official Team Topologies team modeling shape geometries. */
export const TEAM_SHAPE_GEOMETRIES = [
  'rounded_horizontal',
  'square_dotted',
  'rounded_vertical',
  'octagon',
] as const;

export type TeamShapeGeometry = (typeof TEAM_SHAPE_GEOMETRIES)[number];

/** Official Team Topologies interaction modeling shape geometries. */
export const INTERACTION_SHAPE_GEOMETRIES = ['triangle', 'parallelogram', 'circle'] as const;

export type InteractionShapeGeometry = (typeof INTERACTION_SHAPE_GEOMETRIES)[number];

export type TopologyTypeCopy = {
  /** Canonical Team Topologies name */
  topologyName: string;
  /** Short executive zone title */
  zoneTitle: string;
  /** One-line purpose for empty/populated zones */
  purpose: string;
  /** Teaching cue for new users */
  teaching: string;
  /** Modeling-shape geometry from the Team Topologies shapes library */
  shape: TeamShapeGeometry;
  /** Short cue for why this geometry is used */
  shapeTeaching: string;
};

export type InteractionModeCopy = {
  /** Canonical Team Topologies name */
  modeName: string;
  /** Plain-language verb phrase used in relationship sentences */
  sentenceVerb: string;
  /** Short teaching line */
  teaching: string;
  /** Modeling-shape geometry from the Team Topologies shapes library */
  shape: InteractionShapeGeometry;
  /** Short cue for why this geometry is used */
  shapeTeaching: string;
};

export const TOPOLOGY_TYPE_COPY: Record<TeamTopologyType, TopologyTypeCopy> = {
  stream_aligned: {
    topologyName: 'Stream-aligned',
    zoneTitle: 'Stream-aligned teams',
    purpose:
      'Aligned to a flow of work from a segment of the business domain — they own outcomes end-to-end (“you build it, you run it”).',
    teaching:
      'Stream-aligned teams deliver customer value along a value stream. Platforms and specialists exist to accelerate them, not to own their outcomes.',
    shape: 'rounded_horizontal',
    shapeTeaching: 'Horizontal rounded rectangle — end-to-end flow of change toward the customer.',
  },
  platform: {
    topologyName: 'Platform',
    zoneTitle: 'Platform',
    purpose:
      'A grouping of team types that provide a compelling internal product so stream-aligned teams can move faster with less cognitive load.',
    teaching:
      'A good platform is the thinnest viable set of capabilities that removes complexity for stream-aligned teams — not an org chart silo. Scope may be organisation-wide, one vertical, or a single team.',
    shape: 'square_dotted',
    shapeTeaching:
      'Square corners with a dotted border — platform as a grouping boundary, not a single silo box.',
  },
  enabling: {
    topologyName: 'Enabling',
    zoneTitle: 'Enabling teams',
    purpose:
      'Helps stream-aligned teams overcome obstacles and detect missing capabilities — then moves on rather than becoming a permanent delivery owner.',
    teaching:
      'Enabling teams facilitate and coach across one or many streams. Facilitation is temporary and focused; they should not absorb long-term delivery ownership.',
    shape: 'rounded_vertical',
    shapeTeaching: 'Vertical rounded rectangle — temporary uplift beside stream-aligned teams.',
  },
  complicated_subsystem: {
    topologyName: 'Complicated subsystem',
    zoneTitle: 'Complicated subsystem',
    purpose:
      'Where significant mathematics, calculation, or deep technical expertise is needed — a specialist team that reduces load on stream-aligned teams.',
    teaching:
      'Use sparingly. Place in a stream (not inside another team). Interaction mode shows how embedded they are with stream-aligned teams.',
    shape: 'octagon',
    shapeTeaching: 'Octagon — rare specialty that would otherwise overload stream-aligned teams.',
  },
};

export const INTERACTION_MODE_COPY: Record<InteractionMode, InteractionModeCopy> = {
  x_as_a_service: {
    modeName: 'X-as-a-Service',
    sentenceVerb: 'uses as a service',
    teaching:
      'One team provides; another consumes with clear boundaries and minimal coordination cost.',
    shape: 'triangle',
    shapeTeaching: 'Triangle — the point faces the consumer of the service.',
  },
  collaboration: {
    modeName: 'Collaboration',
    sentenceVerb: 'collaborates with',
    teaching:
      'Working closely together for a defined period to discover new APIs, practices, or technologies — high bandwidth, high cost; time-box it.',
    shape: 'parallelogram',
    shapeTeaching: 'Parallelogram — high-bandwidth discovery; keep it time-boxed.',
  },
  facilitation: {
    modeName: 'Facilitation',
    sentenceVerb: 'facilitates',
    teaching: 'One team helps and mentors another — temporary, focused enablement.',
    shape: 'circle',
    shapeTeaching: 'Circle — temporary coaching and capability uplift.',
  },
};

/** Legacy SteerSpec aliases → canonical Team Topologies ids. */
const LEGACY_TEAM_ROLE_ALIASES: Record<string, TeamTopologyType> = {
  customer_facing: 'stream_aligned',
  shared_platform: 'platform',
  coaching_support: 'enabling',
};

const LEGACY_INTERACTION_MODE_ALIASES: Record<string, InteractionMode> = {
  uses_as_service: 'x_as_a_service',
  works_together: 'collaboration',
  coaching: 'facilitation',
};

export function normalizeTeamTopologyType(value: string): TeamTopologyType | string {
  return LEGACY_TEAM_ROLE_ALIASES[value] ?? value;
}

export function normalizeInteractionMode(value: string): InteractionMode | string {
  return LEGACY_INTERACTION_MODE_ALIASES[value] ?? value;
}

/** Who a platform accelerates — org-wide, one vertical/domain, or one stream team. */
export const PLATFORM_SCOPES = ['organisation', 'vertical', 'team'] as const;

export type PlatformScope = (typeof PLATFORM_SCOPES)[number];

export const PLATFORM_SCOPE_COPY: Record<PlatformScope, { label: string; teaching: string }> = {
  organisation: {
    label: 'Organisation',
    teaching: 'Internal product for many streams across the organisation.',
  },
  vertical: {
    label: 'Vertical',
    teaching: 'Bound to one domain / vertical (a group of related streams).',
  },
  team: {
    label: 'Single team',
    teaching: 'Dedicated to accelerating one stream-aligned team.',
  },
};

/**
 * Platform groupings only.
 * Streams are first-class (`spec.streams`); domains group streams (`spec.domains`).
 * Legacy `value_stream` groupings migrate to streams at parse time.
 */
export const GROUPING_KINDS = ['platform'] as const;

export type GroupingKind = (typeof GROUPING_KINDS)[number];

export const GROUPING_KIND_COPY: Record<GroupingKind, { label: string; teaching: string }> = {
  platform: {
    label: 'Platform grouping',
    teaching: 'Teams that share a platform purpose — a compelling internal product.',
  },
};
