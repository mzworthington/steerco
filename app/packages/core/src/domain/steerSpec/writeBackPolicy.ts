import type { Provenance, SteerSpec } from './steerSpecSchema';

export type WriteBackArtifact = 'group_yaml' | 'steer_overlay' | 'steerspec';

export type WriteBackDecision = {
  allowed: boolean;
  reason: string;
  provenance: Provenance;
  artifact: WriteBackArtifact;
};

const PROVIDER_PROVENANCE = new Set<Provenance>(['backstage', 'github', 'entra']);

/**
 * Evaluate write-back policy (ADR 0005).
 * Provider-synced teams never emit Group YAML; catalog_file may with explicit opt-in.
 */
export function evaluateWriteBackPolicy(input: {
  provenance: Provenance;
  artifact: WriteBackArtifact;
  /** Required for Group YAML when provenance is catalog_file. */
  catalogFileOptIn?: boolean;
}): WriteBackDecision {
  const { provenance, artifact, catalogFileOptIn = false } = input;

  if (artifact === 'steerspec' || artifact === 'steer_overlay') {
    return {
      allowed: true,
      reason:
        artifact === 'steer_overlay'
          ? 'SteerLens-owned overlay kinds (e.g. SteerBet) are always allowed.'
          : 'SteerSpec is the system of record for investment intent.',
      provenance,
      artifact,
    };
  }

  // group_yaml
  if (PROVIDER_PROVENANCE.has(provenance)) {
    return {
      allowed: false,
      reason: `Deny Group YAML write-back for ${provenance}-backed teams - providers remain the directory source of truth.`,
      provenance,
      artifact,
    };
  }

  if (provenance === 'local') {
    return {
      allowed: false,
      reason: 'Local teams are SteerSpec-only; there is no Group catalog file to emit.',
      provenance,
      artifact,
    };
  }

  // catalog_file
  if (!catalogFileOptIn) {
    return {
      allowed: false,
      reason: 'Group YAML round-trip for catalog_file teams requires explicit opt-in.',
      provenance,
      artifact,
    };
  }

  return {
    allowed: true,
    reason: 'catalog_file provenance with opt-in may round-trip Group YAML.',
    provenance,
    artifact,
  };
}

/** Summarise write-back posture across teams for the Technical policy panel. */
export function summariseWriteBackPolicy(doc: SteerSpec): {
  providerBlocked: number;
  catalogFileEligible: number;
  localOnly: number;
  rows: Array<{ teamId: string; displayName: string; decision: WriteBackDecision }>;
} {
  const rows = doc.spec.teams.map((team) => ({
    teamId: team.id,
    displayName: team.displayName,
    decision: evaluateWriteBackPolicy({
      provenance: team.provenance,
      artifact: 'group_yaml',
      catalogFileOptIn: false,
    }),
  }));

  return {
    providerBlocked: rows.filter((row) => PROVIDER_PROVENANCE.has(row.decision.provenance)).length,
    catalogFileEligible: rows.filter((row) => row.decision.provenance === 'catalog_file').length,
    localOnly: rows.filter((row) => row.decision.provenance === 'local').length,
    rows,
  };
}
