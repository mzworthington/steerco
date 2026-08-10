import {
  diffSteerSpec,
  type SteerSpec,
  type SteerSpecDiff,
  type SteerSpecDiffSection,
  type SteerSpecEntityChange,
} from '@steerlens/core';

const SECTION_LABELS: Record<SteerSpecDiffSection, string> = {
  vision: 'Vision',
  metadata: 'Workspace',
  outcomes: 'Outcomes',
  bets: 'Bets',
  teams: 'Teams',
  relationships: 'Relationships',
  decisionNotes: 'Decision notes',
  evidence: 'Evidence',
};

const KIND_LABELS = {
  added: 'Added',
  modified: 'Modified',
  deleted: 'Deleted',
} as const;

export type WorkspaceDiffSectionModel = {
  section: SteerSpecDiffSection;
  title: string;
  changes: Array<SteerSpecEntityChange & { kindLabel: 'Added' | 'Modified' | 'Deleted' }>;
};

export type WorkspaceDiffModel = {
  workspaceTitle: string;
  hasChanges: boolean;
  summary: string;
  sections: WorkspaceDiffSectionModel[];
  counts: SteerSpecDiff['counts'];
  acceptHint: string;
};

export function presentWorkspaceDiff(
  baseline: SteerSpec,
  working: SteerSpec,
  options?: { sourceLabel?: string },
): WorkspaceDiffModel {
  const diff = diffSteerSpec(baseline, working);
  const workspaceTitle = working.metadata.title ?? humanizeName(working.metadata.name);
  const sections = groupSections(diff.changes);

  return {
    workspaceTitle,
    hasChanges: diff.hasChanges,
    summary: buildSummary(diff),
    sections,
    counts: diff.counts,
    acceptHint:
      options?.sourceLabel === 'sample'
        ? 'Accept keeps this draft as the session baseline. Writing steertree.yaml to disk lands with Save (F09).'
        : 'Accept keeps this draft as the session baseline. Folder write-back lands with Save (F09).',
  };
}

function groupSections(changes: SteerSpecEntityChange[]): WorkspaceDiffSectionModel[] {
  const order: SteerSpecDiffSection[] = [
    'vision',
    'metadata',
    'outcomes',
    'bets',
    'teams',
    'relationships',
    'decisionNotes',
    'evidence',
  ];
  const sections: WorkspaceDiffSectionModel[] = [];
  for (const section of order) {
    const items = changes.filter((change) => change.section === section);
    if (items.length === 0) continue;
    sections.push({
      section,
      title: SECTION_LABELS[section],
      changes: items.map((change) => ({
        ...change,
        kindLabel: KIND_LABELS[change.kind],
      })),
    });
  }
  return sections;
}

function buildSummary(diff: SteerSpecDiff): string {
  if (!diff.hasChanges) {
    return 'Workspace matches the last accepted baseline.';
  }
  const parts: string[] = [];
  if (diff.counts.added > 0) parts.push(`${diff.counts.added} added`);
  if (diff.counts.modified > 0) parts.push(`${diff.counts.modified} modified`);
  if (diff.counts.deleted > 0) parts.push(`${diff.counts.deleted} deleted`);
  return parts.join(' · ');
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
