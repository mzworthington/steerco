import { z } from 'zod';

const statusOutcomeSchema = z.enum(['on_track', 'at_risk', 'achieved', 'abandoned']);
const statusBetSchema = z.enum([
  'proposed',
  'on_track',
  'at_risk',
  'stop_ready',
  'stopped',
  'done',
]);
const teamRoleSchema = z.enum(['customer_facing', 'shared_platform', 'coaching_support']);
const provenanceSchema = z.enum(['local', 'backstage', 'github', 'entra', 'catalog_file']);
const interactionModeSchema = z.enum(['uses_as_service', 'works_together', 'coaching']);
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

const teamSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    role: teamRoleSchema,
    provenance: provenanceSchema,
    externalRefs: z.array(externalRefSchema).default([]),
  })
  .strict();

const relationshipSchema = z
  .object({
    fromTeamId: z.string().min(1),
    toTeamId: z.string().min(1),
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
