import { stringify as stringifyYaml } from 'yaml';
import type { SteerSpec } from './steerSpecSchema';

/** Serialize a validated SteerSpec to YAML with stable top-level key order. */
export function serializeSteerSpec(doc: SteerSpec): string {
  const ordered = {
    apiVersion: doc.apiVersion,
    kind: doc.kind,
    metadata: doc.metadata,
    spec: {
      vision: doc.spec.vision,
      outcomes: doc.spec.outcomes,
      bets: doc.spec.bets,
      teams: doc.spec.teams,
      relationships: doc.spec.relationships,
      decisionNotes: doc.spec.decisionNotes,
      evidence: doc.spec.evidence,
    },
  };

  return stringifyYaml(ordered, { lineWidth: 0 });
}
