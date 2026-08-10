/**
 * Team Topologies vocabulary baked into SteerLens.
 * Source of truth for team types and interaction modes:
 * https://teamtopologies.com/key-concepts
 *
 * Executive UI uses these plain-language labels; SteerSpec stores canonical ids.
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

export type TopologyTypeCopy = {
  /** Canonical Team Topologies name */
  topologyName: string;
  /** Short executive zone title */
  zoneTitle: string;
  /** One-line purpose for empty/populated zones */
  purpose: string;
  /** Teaching cue for new users */
  teaching: string;
};

export type InteractionModeCopy = {
  /** Canonical Team Topologies name */
  modeName: string;
  /** Plain-language verb phrase used in relationship sentences */
  sentenceVerb: string;
  /** Short teaching line */
  teaching: string;
};

export const TOPOLOGY_TYPE_COPY: Record<TeamTopologyType, TopologyTypeCopy> = {
  stream_aligned: {
    topologyName: 'Stream-aligned',
    zoneTitle: 'Stream-aligned teams',
    purpose:
      'Aligned to a flow of work from a segment of the business domain — they own outcomes end-to-end (“you build it, you run it”).',
    teaching:
      'Stream-aligned teams deliver customer value along a value stream. Platforms and specialists exist to accelerate them, not to own their outcomes.',
  },
  platform: {
    topologyName: 'Platform',
    zoneTitle: 'Platform',
    purpose:
      'A grouping of team types that provide a compelling internal product so stream-aligned teams can move faster with less cognitive load.',
    teaching:
      'A good platform is the thinnest viable set of capabilities that removes complexity for stream-aligned teams — not an org chart silo.',
  },
  enabling: {
    topologyName: 'Enabling',
    zoneTitle: 'Enabling teams',
    purpose:
      'Helps a stream-aligned team overcome obstacles and detect missing capabilities — then moves on rather than becoming a permanent delivery owner.',
    teaching:
      'Enabling teams facilitate and coach. Facilitation is temporary and focused; they should not absorb long-term delivery ownership.',
  },
  complicated_subsystem: {
    topologyName: 'Complicated subsystem',
    zoneTitle: 'Complicated subsystem',
    purpose:
      'Where significant mathematics, calculation, or deep technical expertise is needed — a specialist team that reduces load on stream-aligned teams.',
    teaching:
      'Use sparingly. Complicated-subsystem teams exist when the specialty would otherwise overload stream-aligned teams.',
  },
};

export const INTERACTION_MODE_COPY: Record<InteractionMode, InteractionModeCopy> = {
  x_as_a_service: {
    modeName: 'X-as-a-Service',
    sentenceVerb: 'uses as a service',
    teaching:
      'One team provides; another consumes with clear boundaries and minimal coordination cost.',
  },
  collaboration: {
    modeName: 'Collaboration',
    sentenceVerb: 'collaborates with',
    teaching:
      'Working closely together for a defined period to discover new APIs, practices, or technologies — high bandwidth, high cost; time-box it.',
  },
  facilitation: {
    modeName: 'Facilitation',
    sentenceVerb: 'facilitates',
    teaching: 'One team helps and mentors another — temporary, focused enablement.',
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
