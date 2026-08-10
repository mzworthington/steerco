export {
  parseSteerSpecYaml,
  type ParseSteerSpecResult,
} from './domain/steerSpec/parseSteerSpecYaml';
export { serializeSteerSpec } from './domain/steerSpec/serializeSteerSpec';
export {
  diffSteerSpec,
  steerSpecHasPendingChanges,
  type SteerSpecChangeKind,
  type SteerSpecDiff,
  type SteerSpecDiffSection,
  type SteerSpecEntityChange,
} from './domain/steerSpec/diffSteerSpec';
export {
  INTERACTION_MODES,
  TEAM_ROLES,
  steerSpecSchema,
  type InteractionMode,
  type SteerSpec,
  type TeamMember,
  type TeamRole,
  type TeamTopologyType,
} from './domain/steerSpec/steerSpecSchema';
export {
  INTERACTION_MODE_COPY,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_TYPE_COPY,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type InteractionModeCopy,
  type TopologyTypeCopy,
} from './domain/teamTopologies/vocabulary';
export {
  DEFAULT_PLATFORM_OVERLOAD_THRESHOLD,
  detectSteerSpecMismatches,
  type DetectMismatchesOptions,
  type SteerMismatch,
  type SteerMismatchCode,
} from './domain/steerSpec/detectMismatches';
