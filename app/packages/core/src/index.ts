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
  MEMBER_DISCIPLINES,
  TEAM_ROLES,
  steerSpecSchema,
  type Bet,
  type BetKind,
  type DecisionNote,
  type FundingStance,
  type InteractionMode,
  type MemberDiscipline,
  type Relationship,
  type SteerSpec,
  type TeamMember,
  type TeamRole,
  type TeamTopologyType,
  type TopologyEvent,
  type TopologyEventKind,
} from './domain/steerSpec/steerSpecSchema';
export { DISCIPLINE_COPY, type DisciplineCopy } from './domain/capacity/disciplines';
export {
  INTERACTION_MODE_COPY,
  INTERACTION_SHAPE_GEOMETRIES,
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
