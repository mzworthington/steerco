/** Static EDGE / DDD / Team Topologies vocabulary bridge for Technical mode (F12). */

export type VocabularyRow = {
  term: string;
  alias: string;
  note: string;
};

export type VocabularyPrinciple = {
  title: string;
  note: string;
};

export type TechnicalVocabularyModel = {
  lead: string;
  lvtBridge: VocabularyRow[];
  beyondLvt: VocabularyRow[];
  domainDrivenDesign: VocabularyRow[];
  teamTopologies: VocabularyRow[];
  principles: VocabularyPrinciple[];
};

export function presentTechnicalVocabulary(): TechnicalVocabularyModel {
  return {
    lead: 'Staff+ bridge between SteerSpec fields and EDGE / Domain-Driven Design (Eric Evans) / Team Topologies vocabulary. Executive chrome stays plain language.',
    lvtBridge: [
      {
        term: 'Goal',
        alias: 'outcomes[]',
        note: 'LVT Goal - measurable change the organisation wants. Schema array remains `outcomes[]` until renamed.',
      },
      {
        term: 'Measure of Success',
        alias: 'MoS / metrics',
        note: 'Goal metrics are the customer-value fitness function - not vanity KPIs.',
      },
      {
        term: 'Initiative',
        alias: 'initiatives[]',
        note: 'Thin narrative slices under a bet. Never a dual execution backlog.',
      },
    ],
    beyondLvt: [
      {
        term: 'Periodic Value Review (PVR)',
        alias: 'Decision notes + review dates',
        note: 'Executives see “value review”; staff+ may say PVR.',
      },
      {
        term: 'Product brief',
        alias: 'products[]',
        note: 'Lightweight product mindset: problem, customers, linked goals/bets.',
      },
      {
        term: 'Tech@Core',
        alias: 'capability bets / techRadarUrl',
        note: 'Capability kind revitalizes core systems; optional external Tech Radar link.',
      },
      {
        term: 'Integrated Backlog',
        alias: 'fundingStance / stack rank (valueRank) / mix cues',
        note: 'Explore / exploit / sustain mix and relative value - SteerCo never owns Jira.',
      },
    ],
    domainDrivenDesign: [
      {
        term: 'Bounded context',
        alias: 'domains[]',
        note: 'Eric Evans / DDD: problem-space fence (concepts + rules). Taxonomic containment - never a managerial parent of streams or teams.',
      },
      {
        term: 'Ubiquitous language',
        alias: 'Titles + glossary',
        note: 'Domain, stream, goal, and bet titles should match how the business talks - not org-chart labels.',
      },
      {
        term: 'Fracture plane',
        alias: 'Peer sub-domain split',
        note: 'When cognitive load rises, split the context into peer sub-domains each with its own stream-aligned team.',
      },
      {
        term: 'Leadership outside the stream',
        alias: 'HR ≠ topology',
        note: 'Directors/VPs align strategy, shape, and evidence; sponsor platforms/enablers; drive Inverse Conway - not a topology type on the canvas.',
      },
    ],
    teamTopologies: [
      {
        term: 'Domain / stream / team',
        alias: 'domains[] / streams[] / teams[]',
        note: 'Coplanar lenses (what / flow / who) on one value slice - not a reporting hierarchy. Ideal: one stream-aligned team owns one stream for one bounded-context slice.',
      },
      {
        term: 'Stream-aligned',
        alias: 'stream_aligned',
        note: 'Customer-facing delivery spine; ideally one stream per team, and one stream-aligned team per stream. Customer of platform / enabling teams.',
      },
      {
        term: 'Platform',
        alias: 'platform + platformScope',
        note: 'Lateral internal product that reduces cognitive load; scope organisation / vertical / team - not a manager above streams.',
      },
      {
        term: 'Enabling',
        alias: 'enabling + facilitation',
        note: 'Time-boxed coaching; should not own delivery.',
      },
      {
        term: 'Complicated subsystem',
        alias: 'complicated_subsystem',
        note: 'Specialty in a stream - not a department column or hierarchy tier.',
      },
      {
        term: 'Team size / complexity',
        alias: 'team_oversized (~15 members)',
        note: 'Soft cognitive-load cue (~8 healthy). Evolve by peer stream-aligned splits, platform grouping, or complicated subsystem - not a domain manager layer.',
      },
      {
        term: 'Interaction modes',
        alias: 'x_as_a_service / collaboration / facilitation',
        note: 'Collaboration and facilitation expect `expectedUntil` time-boxes.',
      },
    ],
    principles: [
      { title: 'Outcome-based strategy', note: 'Fund goals and bets, not activity.' },
      { title: 'Value-based prioritization', note: 'Portfolio stack rank and mix cues over FIFO.' },
      {
        title: 'Lightweight governance',
        note: 'Decision notes and review dates - not stage gates.',
      },
      { title: 'Adaptive learning', note: 'Stop / continue / rescope from evidence.' },
      { title: 'Autonomous teams', note: 'Topology intent supports fast flow of change.' },
      {
        title: 'Decisions close to the work',
        note: 'SteerSpec on the device; no account for Slice 1.',
      },
    ],
  };
}
