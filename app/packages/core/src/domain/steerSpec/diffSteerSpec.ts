import type { SteerSpec } from './steerSpecSchema';
import { serializeSteerSpec } from './serializeSteerSpec';

export type SteerSpecDiffSection =
  | 'vision'
  | 'metadata'
  | 'outcomes'
  | 'bets'
  | 'teams'
  | 'relationships'
  | 'decisionNotes'
  | 'evidence';

export type SteerSpecChangeKind = 'added' | 'modified' | 'deleted';

export type SteerSpecEntityChange = {
  kind: SteerSpecChangeKind;
  section: SteerSpecDiffSection;
  id: string;
  label: string;
  detail?: string;
};

export type SteerSpecDiff = {
  hasChanges: boolean;
  changes: SteerSpecEntityChange[];
  counts: { added: number; modified: number; deleted: number };
};

/** True when serialized working copy differs from baseline (stable YAML order). */
export function steerSpecHasPendingChanges(baseline: SteerSpec, working: SteerSpec): boolean {
  return serializeSteerSpec(baseline) !== serializeSteerSpec(working);
}

/**
 * Structural diff of working SteerSpec relative to baseline (ArchLens-style entity buckets).
 */
export function diffSteerSpec(baseline: SteerSpec, working: SteerSpec): SteerSpecDiff {
  const changes: SteerSpecEntityChange[] = [];

  if (baseline.spec.vision !== working.spec.vision) {
    changes.push({
      kind: 'modified',
      section: 'vision',
      id: 'vision',
      label: 'Vision',
      detail: truncate(working.spec.vision),
    });
  }

  if (stableJson(baseline.metadata) !== stableJson(working.metadata)) {
    changes.push({
      kind: 'modified',
      section: 'metadata',
      id: 'metadata',
      label: working.metadata.title ?? working.metadata.name,
      detail: 'Workspace metadata changed',
    });
  }

  diffById(
    changes,
    'outcomes',
    baseline.spec.outcomes,
    working.spec.outcomes,
    (item) => item.id,
    (item) => item.title,
  );
  diffById(
    changes,
    'bets',
    baseline.spec.bets,
    working.spec.bets,
    (item) => item.id,
    (item) => item.title,
  );
  diffById(
    changes,
    'teams',
    baseline.spec.teams,
    working.spec.teams,
    (item) => item.id,
    (item) => item.displayName,
  );
  diffById(
    changes,
    'decisionNotes',
    baseline.spec.decisionNotes,
    working.spec.decisionNotes,
    (item) => item.id,
    (item) => item.title,
  );
  diffById(
    changes,
    'evidence',
    baseline.spec.evidence,
    working.spec.evidence,
    (item) => item.id,
    (item) => item.note?.trim() || item.id,
  );

  const baselineRels = new Map(
    baseline.spec.relationships.map((rel) => [relationshipKey(rel), rel] as const),
  );
  const workingRels = new Map(
    working.spec.relationships.map((rel) => [relationshipKey(rel), rel] as const),
  );

  for (const [key, rel] of workingRels) {
    const original = baselineRels.get(key);
    if (!original) {
      changes.push({
        kind: 'added',
        section: 'relationships',
        id: key,
        label: relationshipLabel(rel, working),
        detail: rel.mode,
      });
      continue;
    }
    if (stableJson(original) !== stableJson(rel)) {
      changes.push({
        kind: 'modified',
        section: 'relationships',
        id: key,
        label: relationshipLabel(rel, working),
        detail: `${original.mode} → ${rel.mode}`,
      });
    }
  }
  for (const [key, rel] of baselineRels) {
    if (!workingRels.has(key)) {
      changes.push({
        kind: 'deleted',
        section: 'relationships',
        id: key,
        label: relationshipLabel(rel, baseline),
        detail: rel.mode,
      });
    }
  }

  const counts = { added: 0, modified: 0, deleted: 0 };
  for (const change of changes) {
    counts[change.kind] += 1;
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    counts,
  };
}

function diffById<T>(
  changes: SteerSpecEntityChange[],
  section: SteerSpecDiffSection,
  baselineItems: T[],
  workingItems: T[],
  idOf: (item: T) => string,
  labelOf: (item: T) => string,
): void {
  const baselineMap = new Map(baselineItems.map((item) => [idOf(item), item] as const));
  const workingMap = new Map(workingItems.map((item) => [idOf(item), item] as const));

  for (const [id, item] of workingMap) {
    const original = baselineMap.get(id);
    if (!original) {
      changes.push({
        kind: 'added',
        section,
        id,
        label: labelOf(item),
      });
      continue;
    }
    if (stableJson(original) !== stableJson(item)) {
      changes.push({
        kind: 'modified',
        section,
        id,
        label: labelOf(item),
      });
    }
  }

  for (const [id, item] of baselineMap) {
    if (!workingMap.has(id)) {
      changes.push({
        kind: 'deleted',
        section,
        id,
        label: labelOf(item),
      });
    }
  }
}

function relationshipKey(rel: { fromTeamId: string; toTeamId: string; mode: string }): string {
  return `${rel.fromTeamId}::${rel.toTeamId}`;
}

function relationshipLabel(rel: { fromTeamId: string; toTeamId: string }, doc: SteerSpec): string {
  const from =
    doc.spec.teams.find((team) => team.id === rel.fromTeamId)?.displayName ?? rel.fromTeamId;
  const to = doc.spec.teams.find((team) => team.id === rel.toTeamId)?.displayName ?? rel.toTeamId;
  return `${from} → ${to}`;
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function truncate(value: string, max = 96): string {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max - 1)}…`;
}
