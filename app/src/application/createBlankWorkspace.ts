import { steerSpecSchema, type SteerSpec } from '@steerco/core';

export const BLANK_WORKSPACE_LABEL = 'New workspace';

/**
 * Minimal valid SteerSpec for a fresh local file - empty outcomes/bets/teams.
 */
export function createBlankSteerSpec(options?: { name?: string; title?: string }): SteerSpec {
  const name = options?.name?.trim() || 'new-workspace';
  const title = options?.title?.trim() || BLANK_WORKSPACE_LABEL;
  const parsed = steerSpecSchema.safeParse({
    apiVersion: 'steerco.dev/v1alpha1',
    kind: 'SteerTree',
    metadata: {
      name:
        name
          .replace(/[^a-z0-9-]+/gi, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase() || 'new-workspace',
      title,
    },
    spec: {
      vision: 'Describe the change you want to see',
      outcomes: [],
      bets: [],
      teams: [],
      relationships: [],
      decisionNotes: [],
      evidence: [],
      topologyEvents: [],
      initiatives: [],
      products: [],
    },
  });
  if (!parsed.success) {
    throw new Error('Blank SteerSpec template failed validation.');
  }
  return parsed.data;
}
