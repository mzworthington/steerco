import { z } from 'zod';
import { MEMBER_DISCIPLINES, type MemberDiscipline } from '../capacity/disciplines';
import {
  GROUPING_KINDS,
  INTERACTION_MODES,
  PLATFORM_SCOPES,
  TEAM_TOPOLOGY_TYPES,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type GroupingKind,
  type InteractionMode,
  type PlatformScope,
  type TeamTopologyType,
} from '../teamTopologies/vocabulary';

const statusOutcomeSchema = z.enum(['on_track', 'at_risk', 'achieved', 'abandoned']);
const statusBetSchema = z.enum([
  'proposed',
  'on_track',
  'at_risk',
  'stop_ready',
  'stopped',
  'done',
]);

const teamRoleSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeTeamTopologyType(value) : value),
  z.enum(TEAM_TOPOLOGY_TYPES),
);

const interactionModeSchema = z.preprocess(
  (value) => (typeof value === 'string' ? normalizeInteractionMode(value) : value),
  z.enum(INTERACTION_MODES),
);

const provenanceSchema = z.enum(['local', 'backstage', 'github', 'entra', 'catalog_file']);
const recommendationSchema = z.enum(['start', 'continue', 'stop', 'rescope']);
const fundingStanceSchema = z.enum(['explore', 'exploit', 'sustain']);
const betKindSchema = z.enum(['opportunity', 'capability']);
const topologyEventKindSchema = z.enum([
  'capacity_up',
  'capacity_down',
  'relationship_added',
  'relationship_ended',
  'relationship_mode_changed',
  'other',
]);
const platformScopeSchema = z.enum(PLATFORM_SCOPES);
const groupingKindSchema = z.enum(GROUPING_KINDS);

const metricSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    unit: z.string().optional(),
    current: z.number().nullable().optional(),
    baseline: z.number().nullable().optional(),
    target: z.number().nullable().optional(),
    interpretation: z.string().optional(),
  })
  .strict();

const outcomeSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().optional(),
    status: statusOutcomeSchema,
    metrics: z.array(metricSchema).default([]),
  })
  .strict();

const betSchema = z
  .object({
    id: z.string().min(1),
    outcomeId: z.string().min(1),
    title: z.string().min(1),
    successSignal: z.string().min(1),
    killCriteria: z.string().min(1),
    status: statusBetSchema,
    fundedTeamIds: z.array(z.string()).default([]),
    /** Measure-of-Success links - metric ids this bet is judged against. */
    metricIds: z.array(z.string()).default([]),
    primaryMetricId: z.string().nullable().optional(),
    /** ISO date (YYYY-MM-DD preferred) for the next funding review. */
    reviewDate: z.string().optional(),
    /** Free text review horizon, e.g. "Q3 review". */
    horizon: z.string().optional(),
    fundingStance: fundingStanceSchema.optional(),
    kind: betKindSchema.optional(),
    /** Dense portfolio stack rank (1 = highest priority). Optional; UI reorders via stack moves. */
    valueRank: z.number().int().positive().optional(),
  })
  .strict();

const externalRefSchema = z
  .object({
    system: z.enum(['backstage', 'github', 'entra', 'other']),
    id: z.string().min(1),
  })
  .strict();

const memberDisciplineSchema = z.enum(MEMBER_DISCIPLINES);

const teamMemberSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    /** Coarse discipline for mix / capacity advice - not the Team Topologies team type. */
    discipline: memberDisciplineSchema,
    /** Free-text job title for board packs and diffs. */
    title: z.string().min(1),
    /** Allocation to this team as a percentage of one FTE (0–100). */
    ftePercent: z.number().min(0).max(100),
    /** ISO date capacity window - when this allocation starts/ends. */
    effectiveFrom: z.string().optional(),
    effectiveUntil: z.string().optional(),
  })
  .strict();

const streamSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
  })
  .strict();

const domainSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    /**
     * Related streams for this bounded-context / vertical label.
     * Domains are coplanar lenses (the "what"), not managerial parents of streams or teams.
     */
    memberStreamIds: z.array(z.string()).default([]),
  })
  .strict();

const teamSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    /** Team Topologies fundamental topology type. */
    role: teamRoleSchema,
    provenance: provenanceSchema,
    externalRefs: z.array(externalRefSchema).default([]),
    /**
     * Capacity / mix signal - also feeds team-size cognitive-load proxies.
     * Not an HR directory; empty means size mismatches are skipped.
     */
    members: z.array(teamMemberSchema).default([]),
    /** Who this platform accelerates - meaningful when role is platform. */
    platformScope: platformScopeSchema.optional(),
    /**
     * Streams this team belongs to (the "flow" lens).
     * Ideal for stream-aligned: exactly one stream owned by exactly one stream-aligned team.
     * Multiple streams on one team, or multiple stream-aligned teams on one stream, are soft mismatches.
     * Complicated subsystem: one or more streams (lateral specialty, not nested under a team).
     */
    streamIds: z.array(z.string()).default([]),
  })
  .strict();

const groupingSchema = z
  .object({
    id: z.string().min(1),
    kind: groupingKindSchema,
    title: z.string().min(1),
    memberTeamIds: z.array(z.string()).default([]),
    /** Audience for platform groupings (also allowed on leaf platform teams). */
    platformScope: platformScopeSchema.optional(),
  })
  .strict();

const relationshipSchema = z
  .object({
    fromTeamId: z.string().min(1),
    toTeamId: z.string().min(1),
    /** Team Topologies interaction mode. */
    mode: interactionModeSchema,
    /** ISO date - time-box for collaboration/facilitation; expected to end. */
    expectedUntil: z.string().optional(),
    effectiveFrom: z.string().optional(),
    effectiveUntil: z.string().optional(),
  })
  .strict();

const decisionNoteSchema = z
  .object({
    id: z.string().min(1),
    betId: z.string().nullable().optional(),
    recommendation: recommendationSchema,
    title: z.string().min(1),
    why: z.string().min(1),
    measured: z.array(z.string()).default([]),
    /** Structured Measure-of-Success refs - metric ids this decision cites. */
    measuredMetricIds: z.array(z.string()).default([]),
    affectedTeamIds: z.array(z.string()).default([]),
    nextStep: z.string().min(1),
  })
  .strict();

const topologyEventSchema = z
  .object({
    id: z.string().min(1),
    /** ISO date the event occurred. */
    at: z.string().min(1),
    kind: topologyEventKindSchema,
    summary: z.string().min(1),
    teamIds: z.array(z.string()).default([]),
    /** `fromTeamId::toTeamId` - links back to the relationship this event describes. */
    relationshipKey: z.string().optional(),
  })
  .strict();

/** Thin narrative slice under a bet - not an execution backlog item. */
const initiativeSchema = z
  .object({
    id: z.string().min(1),
    betId: z.string().min(1),
    title: z.string().min(1),
    successSignal: z.string().min(1),
    /** Optional external tracker URL - SteerCo never owns the backlog. */
    externalUrl: z.string().optional(),
  })
  .strict();

/** Lightweight product brief - product mindset, not requirements docs. */
const productSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    problem: z.string().min(1),
    customers: z.string().optional(),
    nonGoals: z.string().optional(),
    outcomeIds: z.array(z.string()).default([]),
    betIds: z.array(z.string()).default([]),
  })
  .strict();

const evidenceSchema = z
  .object({
    id: z.string().min(1),
    metricId: z.string().nullable().optional(),
    source: z.enum(['sample', 'manual', 'github', 'other']),
    note: z.string().optional(),
  })
  .strict();

const metadataSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-z0-9][a-z0-9-]*$/),
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .strict();

const specSchema = z
  .object({
    vision: z.string().min(1),
    outcomes: z.array(outcomeSchema),
    bets: z.array(betSchema),
    teams: z.array(teamSchema),
    /** Flow-of-change slices (the "flow" lens). Stream-aligned teams ideally own exactly one. */
    streams: z.array(streamSchema).default([]),
    /**
     * Optional related-context labels (the "what" lens / bounded context).
     * Not a reporting hierarchy over streams or teams - see ADR 0008.
     */
    domains: z.array(domainSchema).default([]),
    /** Platform groupings only (lateral support; streams/domains stay first-class lenses). */
    groupings: z.array(groupingSchema).default([]),
    relationships: z.array(relationshipSchema).default([]),
    decisionNotes: z.array(decisionNoteSchema).default([]),
    evidence: z.array(evidenceSchema).default([]),
    topologyEvents: z.array(topologyEventSchema).default([]),
    /** Thin slices under bets - narrative toward MoS, never a dual backlog. */
    initiatives: z.array(initiativeSchema).default([]),
    /** Lightweight product briefs linked to outcomes/bets. */
    products: z.array(productSchema).default([]),
    /** Optional external Tech Radar URL (no radar UI in SteerCo). */
    techRadarUrl: z.string().optional(),
  })
  .strict();

export const steerSpecSchema = z
  .object({
    apiVersion: z.literal('steerco.dev/v1alpha1'),
    kind: z.literal('SteerTree'),
    metadata: metadataSchema,
    spec: specSchema,
  })
  .strict();

export type SteerSpec = z.infer<typeof steerSpecSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Stream = z.infer<typeof streamSchema>;
export type Domain = z.infer<typeof domainSchema>;
export type Grouping = z.infer<typeof groupingSchema>;
export type Bet = z.infer<typeof betSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type DecisionNote = z.infer<typeof decisionNoteSchema>;
export type TopologyEvent = z.infer<typeof topologyEventSchema>;
export type TopologyEventKind = TopologyEvent['kind'];
export type Initiative = z.infer<typeof initiativeSchema>;
export type Product = z.infer<typeof productSchema>;
export type Provenance = Team['provenance'];
export type FundingStance = NonNullable<Bet['fundingStance']>;
export type BetKind = NonNullable<Bet['kind']>;
export type TeamRole = TeamTopologyType;
export type { GroupingKind, InteractionMode, MemberDiscipline, PlatformScope, TeamTopologyType };
export {
  GROUPING_KINDS,
  MEMBER_DISCIPLINES,
  PLATFORM_SCOPES,
  TEAM_TOPOLOGY_TYPES as TEAM_ROLES,
  INTERACTION_MODES,
};
