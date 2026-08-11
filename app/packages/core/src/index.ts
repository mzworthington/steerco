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
  GROUPING_KINDS,
  MEMBER_DISCIPLINES,
  PLATFORM_SCOPES,
  TEAM_ROLES,
  steerSpecSchema,
  type Bet,
  type BetKind,
  type DecisionNote,
  type Domain,
  type FundingStance,
  type Grouping,
  type GroupingKind,
  type InteractionMode,
  type MemberDiscipline,
  type PlatformScope,
  type Relationship,
  type SteerSpec,
  type Stream,
  type Team,
  type TeamMember,
  type TeamRole,
  type TeamTopologyType,
  type TopologyEvent,
  type TopologyEventKind,
} from './domain/steerSpec/steerSpecSchema';
export { DISCIPLINE_COPY, type DisciplineCopy } from './domain/capacity/disciplines';
export {
  GROUPING_KIND_COPY,
  INTERACTION_MODE_COPY,
  INTERACTION_SHAPE_GEOMETRIES,
  PLATFORM_SCOPE_COPY,
  TEAM_SHAPE_GEOMETRIES,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_TYPE_COPY,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type InteractionModeCopy,
  type InteractionShapeGeometry,
  type TeamShapeGeometry,
  type TopologyTypeCopy,
} from './domain/teamTopologies/vocabulary';
export {
  DEFAULT_PLATFORM_OVERLOAD_THRESHOLD,
  detectSteerSpecMismatches,
  type DetectMismatchesOptions,
  type SteerMismatch,
  type SteerMismatchCode,
} from './domain/steerSpec/detectMismatches';
export {
  isEffectiveOnDate,
  projectSteerSpecAsOf,
  type EffectiveWindow,
} from './domain/steerSpec/projectSteerSpecAsOf';
