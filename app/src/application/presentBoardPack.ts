import type { SteerSpec } from '@steerlens/core';
import { presentDecisionNotes, type DecisionNoteCard } from './presentDecisionNotes';
import { presentEvidence, type EvidenceCard } from './presentEvidence';
import { presentOrganisation, type OrganisationModel } from './presentOrganisation';
import { presentOutcomes, type OutcomesSection } from './presentOutcomes';
import { presentSteeringOverview, type SteeringOverviewModel } from './presentSteeringOverview';

export type BoardPackSectionId =
  'steering' | 'outcomes' | 'organisation' | 'decisionNotes' | 'evidence';

export type BoardPackPillar = 'invest' | 'work' | 'adapt';

export type BoardPackSectionOption = {
  id: BoardPackSectionId;
  label: string;
  pillar: BoardPackPillar;
  pillarLabel: string;
  description: string;
  defaultSelected: boolean;
};

export type BoardPackSelection = Record<BoardPackSectionId, boolean>;

export type BoardPackPreview = {
  coverTitle: string;
  coverDateLabel: string;
  coverBlurb: string;
  filenameBase: string;
  pillars: Array<{
    id: BoardPackPillar;
    label: string;
    question: string;
    sections: BoardPackSectionId[];
  }>;
  steering: SteeringOverviewModel | null;
  outcomes: OutcomesSection[] | null;
  organisation: Pick<
    OrganisationModel,
    'lead' | 'zones' | 'relationships' | 'overloadBanner'
  > | null;
  decisionNotes: DecisionNoteCard[] | null;
  evidence: EvidenceCard[] | null;
};

export type BoardPackModel = {
  workspaceTitle: string;
  packTitle: string;
  coverBlurb: string;
  sections: BoardPackSectionOption[];
  defaultSelection: BoardPackSelection;
};

const SECTION_OPTIONS: BoardPackSectionOption[] = [
  {
    id: 'steering',
    label: 'Steering overview',
    pillar: 'invest',
    pillarLabel: 'Invest',
    description: 'Vision, funded bets, and stop-ready cues',
    defaultSelected: true,
  },
  {
    id: 'outcomes',
    label: 'Outcomes (MoS)',
    pillar: 'invest',
    pillarLabel: 'Invest',
    description: 'Measures of success for the primary outcome',
    defaultSelected: true,
  },
  {
    id: 'organisation',
    label: 'How work is organised',
    pillar: 'work',
    pillarLabel: 'Work',
    description: 'Team topologies and interaction modes',
    defaultSelected: true,
  },
  {
    id: 'decisionNotes',
    label: 'Decision notes',
    pillar: 'adapt',
    pillarLabel: 'Adapt',
    description: 'Start / continue / stop recommendations',
    defaultSelected: true,
  },
  {
    id: 'evidence',
    label: 'Evidence',
    pillar: 'adapt',
    pillarLabel: 'Adapt',
    description: 'What the numbers say (optional)',
    defaultSelected: false,
  },
];

export function defaultBoardPackSelection(): BoardPackSelection {
  return Object.fromEntries(
    SECTION_OPTIONS.map((section) => [section.id, section.defaultSelected]),
  ) as BoardPackSelection;
}

export function presentBoardPack(
  spec: SteerSpec,
  options?: { packTitle?: string },
): BoardPackModel {
  const workspaceTitle = spec.metadata.title ?? humanizeName(spec.metadata.name);
  return {
    workspaceTitle,
    packTitle: options?.packTitle ?? `${workspaceTitle} board pack`,
    coverBlurb:
      'How should we invest? How should work be organised? What should we start, stop, or continue?',
    sections: SECTION_OPTIONS,
    defaultSelection: defaultBoardPackSelection(),
  };
}

export function buildBoardPackPreview(
  spec: SteerSpec,
  selection: BoardPackSelection,
  options?: { packTitle?: string; date?: Date },
): BoardPackPreview {
  const model = presentBoardPack(spec, { packTitle: options?.packTitle });
  const date = options?.date ?? new Date();
  const coverDateLabel = formatPackDate(date);
  const slug = slugify(model.workspaceTitle);
  const dateStamp = formatFilenameDate(date);

  const steering = selection.steering ? presentSteeringOverview(spec) : null;
  const outcomes = selection.outcomes ? presentOutcomes(spec).outcomes : null;
  const organisation = selection.organisation
    ? (() => {
        const org = presentOrganisation(spec);
        return {
          lead: org.lead,
          zones: org.zones,
          relationships: org.relationships,
          overloadBanner: org.overloadBanner,
        };
      })()
    : null;
  const decisionNotes = selection.decisionNotes ? presentDecisionNotes(spec).notes : null;
  const evidence = selection.evidence ? presentEvidence(spec).cards : null;

  const pillarDefs: Array<{
    id: BoardPackPillar;
    label: string;
    question: string;
    sectionIds: BoardPackSectionId[];
  }> = [
    {
      id: 'invest',
      label: 'Invest',
      question: 'How should we invest?',
      sectionIds: ['steering', 'outcomes'],
    },
    {
      id: 'work',
      label: 'Work',
      question: 'How should work be organised?',
      sectionIds: ['organisation'],
    },
    {
      id: 'adapt',
      label: 'Adapt',
      question: 'What should we start, stop, or continue?',
      sectionIds: ['decisionNotes', 'evidence'],
    },
  ];

  const pillars = pillarDefs
    .map((pillar) => ({
      id: pillar.id,
      label: pillar.label,
      question: pillar.question,
      sections: pillar.sectionIds.filter((id) => selection[id]),
    }))
    .filter((pillar) => pillar.sections.length > 0);

  return {
    coverTitle: options?.packTitle?.trim() || model.packTitle,
    coverDateLabel,
    coverBlurb: model.coverBlurb,
    filenameBase: `steerlens-board-pack-${slug}-${dateStamp}`,
    pillars,
    steering,
    outcomes,
    organisation,
    decisionNotes,
    evidence,
  };
}

export function boardPackSectionGroups(sections: BoardPackSectionOption[]): Array<{
  pillar: BoardPackPillar;
  pillarLabel: string;
  sections: BoardPackSectionOption[];
}> {
  const order: BoardPackPillar[] = ['invest', 'work', 'adapt'];
  return order.map((pillar) => ({
    pillar,
    pillarLabel: sections.find((section) => section.pillar === pillar)?.pillarLabel ?? pillar,
    sections: sections.filter((section) => section.pillar === pillar),
  }));
}

function formatPackDate(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(date);
}

function formatFilenameDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'workspace';
}

function humanizeName(name: string): string {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
