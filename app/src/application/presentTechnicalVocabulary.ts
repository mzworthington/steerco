/** Static EDGE / Team Topologies vocabulary bridge for Technical mode (F12). */

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
  teamTopologies: VocabularyRow[];
  principles: VocabularyPrinciple[];
};

export function presentTechnicalVocabulary(): TechnicalVocabularyModel {
  return {
    lead: 'Staff+ bridge between SteerSpec fields and EDGE / Team Topologies vocabulary. Executive chrome stays plain language.',
    lvtBridge: [
      {
        term: 'Goal',
        alias: 'Outcome',
        note: 'SteerSpec `outcomes[]` - measurable change the organisation wants.',
      },
      {
        term: 'Measure of Success',
        alias: 'MoS / metrics',
        note: 'Outcome metrics are the customer-value fitness function - not vanity KPIs.',
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
        note: 'Lightweight product mindset: problem, customers, linked outcomes/bets.',
      },
      {
        term: 'Tech@Core',
        alias: 'capability bets + systemRefs / techRadarUrl',
        note: 'Capability kind revitalizes core systems; ArchLens refs and radar links stay optional.',
      },
      {
        term: 'Integrated Backlog',
        alias: 'fundingStance / stack rank (valueRank) / mix cues',
        note: 'Explore / exploit / sustain mix and relative value - SteerCo never owns Jira.',
      },
    ],
    teamTopologies: [
      {
        term: 'Stream-aligned',
        alias: 'stream_aligned',
        note: 'Customer-facing delivery spine; ideally one stream per team.',
      },
      {
        term: 'Platform',
        alias: 'platform + platformScope',
        note: 'Reduces cognitive load; scope organisation / vertical / team.',
      },
      {
        term: 'Enabling',
        alias: 'enabling + facilitation',
        note: 'Time-boxed coaching; should not own delivery.',
      },
      {
        term: 'Complicated subsystem',
        alias: 'complicated_subsystem',
        note: 'Nested in a stream - not a department column.',
      },
      {
        term: 'Interaction modes',
        alias: 'x_as_a_service / collaboration / facilitation',
        note: 'Collaboration and facilitation expect `expectedUntil` time-boxes.',
      },
    ],
    principles: [
      { title: 'Outcome-based strategy', note: 'Fund outcomes and bets, not activity.' },
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
