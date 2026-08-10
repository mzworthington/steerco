import { z } from 'zod';
import {
  INTERACTION_MODES,
  TEAM_TOPOLOGY_TYPES,
  normalizeInteractionMode,
  normalizeTeamTopologyType,
  type InteractionMode,
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
    systemRefs: z.array(z.string()).default([]),
  })
  .strict();

const externalRefSchema = z
  .object({
    system: z.enum(['backstage', 'github', 'entra', 'other']),
    id: z.string().min(1),
  })
  .strict();

const teamMemberSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    /** Job / craft title — not the Team Topologies team type. */
    title: z.string().min(1),
    /** Allocation to this team as a percentage of one FTE (0–100). */
    ftePercent: z.number().min(0).max(100),
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
    members: z.array(teamMemberSchema).default([]),
  })
  .strict();

const relationshipSchema = z
  .object({
    fromTeamId: z.string().min(1),
    toTeamId: z.string().min(1),
    /** Team Topologies interaction mode. */
    mode: interactionModeSchema,
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
    affectedTeamIds: z.array(z.string()).default([]),
    nextStep: z.string().min(1),
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
    relationships: z.array(relationshipSchema).default([]),
    decisionNotes: z.array(decisionNoteSchema).default([]),
    evidence: z.array(evidenceSchema).default([]),
  })
  .strict();

export const steerSpecSchema = z
  .object({
    apiVersion: z.literal('steerlens.dev/v1alpha1'),
    kind: z.literal('SteerTree'),
    metadata: metadataSchema,
    spec: specSchema,
  })
  .strict();

export type SteerSpec = z.infer<typeof steerSpecSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;
export type TeamRole = TeamTopologyType;
export type { InteractionMode, TeamTopologyType };
export { TEAM_TOPOLOGY_TYPES as TEAM_ROLES, INTERACTION_MODES };
