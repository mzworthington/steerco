/**
 * Coarse member disciplines for capacity / mix advice.
 * Not Team Topologies team types, and not an HR job family catalog.
 */

export const MEMBER_DISCIPLINES = [
  'engineering',
  'design',
  'product',
  'quality',
  'leadership',
  'other',
] as const;

export type MemberDiscipline = (typeof MEMBER_DISCIPLINES)[number];

export type DisciplineCopy = {
  /** Short executive label */
  label: string;
  /** One-line teaching cue */
  teaching: string;
};

export const DISCIPLINE_COPY: Record<MemberDiscipline, DisciplineCopy> = {
  engineering: {
    label: 'Engineering',
    teaching: 'Build, run, and evolve the software or platform.',
  },
  design: {
    label: 'Design',
    teaching: 'Shape experience, interaction, and service design.',
  },
  product: {
    label: 'Product',
    teaching: 'Own discovery, prioritisation, and outcome framing.',
  },
  quality: {
    label: 'Quality',
    teaching: 'Testing, assurance, and reliability of the change.',
  },
  leadership: {
    label: 'Leadership',
    teaching: 'People and delivery leadership for the team’s purpose.',
  },
  other: {
    label: 'Other',
    teaching: 'A contribution that does not fit the steering disciplines above.',
  },
};
