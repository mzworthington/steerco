import type { SteerSpec } from '@steerco/core';
import { presentBetStatus } from './presentSteeringOverview';

export type ValueTreeOrientation = 'TB' | 'LR';

export type ValueTreeNodeKind = 'vision' | 'goal' | 'bet' | 'initiative';

export type ValueTreeFact = {
  label: string;
  value: string;
};

export type ValueTreeMeasureCue = {
  id: string;
  title: string;
  displayValue: string;
  interpretation: string;
  targetLabel: string | null;
};

export type ValueTreeGraphNode = {
  id: string;
  kind: ValueTreeNodeKind;
  label: string;
  /** Short supporting line for the node and detail panel. */
  summary: string | null;
  /** Rollup line for the detail panel (counts under this node). */
  meta: string | null;
  /** Status word when the node has an explicit status. */
  statusLabel: string | null;
  /** Facts not visible as graph nodes (kill criteria, review, teams, …). */
  facts: ValueTreeFact[];
  /** Measures of success (not drawn on the graph). */
  measures: ValueTreeMeasureCue[];
  href: string | null;
  hrefLabel: string | null;
  /** Depth from vision (0 = vision). */
  depth: number;
  position: { x: number; y: number };
};

export type ValueTreeGraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type ValueTreeModel = {
  vision: string;
  orientation: ValueTreeOrientation;
  lead: string;
  nodes: ValueTreeGraphNode[];
  edges: ValueTreeGraphEdge[];
};

const NODE_WIDTH = 200;
const NODE_HEIGHT = 72;
const GAP_X = 48;
const GAP_Y = 56;

type LayoutChild = {
  id: string;
  kind: ValueTreeNodeKind;
  label: string;
  summary: string | null;
  meta: string | null;
  statusLabel: string | null;
  facts: ValueTreeFact[];
  measures: ValueTreeMeasureCue[];
  href: string | null;
  hrefLabel: string | null;
  children: LayoutChild[];
};

/**
 * Present the Lean Value Tree spine as positioned nodes/edges (TB or LR).
 * Vision → outcomes → bets → optional initiatives.
 */
export function presentValueTree(
  spec: SteerSpec,
  orientation: ValueTreeOrientation = 'TB',
): ValueTreeModel {
  const teamNameById = new Map(spec.spec.teams.map((team) => [team.id, team.displayName]));
  const metricById = new Map(
    spec.spec.outcomes.flatMap((outcome) =>
      outcome.metrics.map((metric) => [metric.id, { ...metric, outcomeId: outcome.id }] as const),
    ),
  );

  const initiativesByBet = new Map<
    string,
    Array<{ id: string; title: string; successSignal: string; externalUrl?: string }>
  >();
  for (const initiative of spec.spec.initiatives ?? []) {
    const list = initiativesByBet.get(initiative.betId) ?? [];
    list.push({
      id: initiative.id,
      title: initiative.title,
      successSignal: initiative.successSignal,
      externalUrl: initiative.externalUrl,
    });
    initiativesByBet.set(initiative.betId, list);
  }

  const goalCount = spec.spec.outcomes.length;
  const betCount = spec.spec.bets.length;
  const initiativeCount = (spec.spec.initiatives ?? []).length;
  const measureCount = spec.spec.outcomes.reduce((sum, outcome) => sum + outcome.metrics.length, 0);

  const root: LayoutChild = {
    id: 'vision',
    kind: 'vision',
    label: 'Vision',
    summary: truncate(spec.spec.vision, 120),
    meta: formatCounts([
      { count: goalCount, singular: 'goal', plural: 'goals' },
      { count: betCount, singular: 'bet', plural: 'bets' },
      { count: initiativeCount, singular: 'initiative', plural: 'initiatives' },
      { count: measureCount, singular: 'measure', plural: 'measures' },
    ]),
    statusLabel: null,
    facts: visionFacts(spec),
    measures: [],
    href: null,
    hrefLabel: null,
    children: spec.spec.outcomes.map((outcome) => {
      const outcomeBets = spec.spec.bets.filter((bet) => bet.outcomeId === outcome.id);
      const outcomeMeasureCount = outcome.metrics.length;
      return {
        id: outcome.id,
        kind: 'goal' as const,
        label: outcome.title,
        summary:
          outcome.summary?.trim() ||
          `${outcomeMeasureCount} measure${outcomeMeasureCount === 1 ? '' : 's'} · ${outcomeBets.length} bet${outcomeBets.length === 1 ? '' : 's'}`,
        meta: formatCounts([
          { count: outcomeMeasureCount, singular: 'measure', plural: 'measures' },
          { count: outcomeBets.length, singular: 'bet', plural: 'bets' },
        ]),
        statusLabel: presentGoalStatus(outcome.status),
        facts: [],
        measures: outcome.metrics.map((metric) => presentMeasureCue(metric)),
        href: null,
        hrefLabel: null,
        children: outcomeBets.map((bet) => {
          const initiatives = initiativesByBet.get(bet.id) ?? [];
          const linkedMetrics = resolveBetMetrics(bet, metricById);
          return {
            id: bet.id,
            kind: 'bet' as const,
            label: bet.title,
            summary: bet.successSignal,
            meta: formatCounts([
              {
                count: initiatives.length,
                singular: 'initiative',
                plural: 'initiatives',
              },
            ]),
            statusLabel: presentBetStatus(bet.status).label,
            facts: betFacts(bet, teamNameById, linkedMetrics),
            measures: linkedMetrics.map((metric) => presentMeasureCue(metric)),
            href: `/workspace/bets/${bet.id}`,
            hrefLabel: 'Open bet',
            children: initiatives.map((initiative) => ({
              id: initiative.id,
              kind: 'initiative' as const,
              label: initiative.title,
              summary: initiative.successSignal,
              meta: null,
              statusLabel: null,
              facts: [
                {
                  label: 'Parent bet',
                  value: bet.title,
                },
              ],
              measures: [],
              href: initiative.externalUrl?.trim() || null,
              hrefLabel: initiative.externalUrl ? 'External tracker' : null,
              children: [],
            })),
          };
        }),
      };
    }),
  };

  const { nodes, edges } = layoutTree(root, orientation);

  return {
    vision: spec.spec.vision,
    orientation,
    lead: 'Lean Value Tree: vision → goals → bets → initiatives. Select a node for detail below.',
    nodes,
    edges,
  };
}

function layoutTree(
  root: LayoutChild,
  orientation: ValueTreeOrientation,
): { nodes: ValueTreeGraphNode[]; edges: ValueTreeGraphEdge[] } {
  const nodes: ValueTreeGraphNode[] = [];
  const edges: ValueTreeGraphEdge[] = [];

  const measure = (node: LayoutChild): number => {
    if (node.children.length === 0) return 1;
    return node.children.reduce((sum, child) => sum + measure(child), 0);
  };

  const place = (node: LayoutChild, depth: number, offset: number, parentId: string | null) => {
    const span = measure(node);
    const center = offset + span / 2;
    const x =
      orientation === 'TB'
        ? center * (NODE_WIDTH + GAP_X) - NODE_WIDTH / 2
        : depth * (NODE_WIDTH + GAP_X);
    const y =
      orientation === 'TB'
        ? depth * (NODE_HEIGHT + GAP_Y)
        : center * (NODE_HEIGHT + GAP_Y) - NODE_HEIGHT / 2;

    nodes.push({
      id: node.id,
      kind: node.kind,
      label: node.label,
      summary: node.summary,
      meta: node.meta,
      statusLabel: node.statusLabel,
      facts: node.facts,
      measures: node.measures,
      href: node.href,
      hrefLabel: node.hrefLabel,
      depth,
      position: { x, y },
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    let childOffset = offset;
    for (const child of node.children) {
      place(child, depth + 1, childOffset, node.id);
      childOffset += measure(child);
    }
  };

  place(root, 0, 0, null);
  return { nodes, edges };
}

function visionFacts(spec: SteerSpec): ValueTreeFact[] {
  const facts: ValueTreeFact[] = [];
  const goalMix = formatStatusMix(
    spec.spec.outcomes.map((outcome) => presentGoalStatus(outcome.status)),
  );
  if (goalMix) {
    facts.push({ label: 'Goal stance', value: goalMix });
  }
  const betMix = formatStatusMix(spec.spec.bets.map((bet) => presentBetStatus(bet.status).label));
  if (betMix) {
    facts.push({ label: 'Bet stance', value: betMix });
  }
  const stopReady = spec.spec.bets.filter(
    (bet) => bet.status === 'stop_ready' || bet.status === 'stopped',
  ).length;
  if (stopReady > 0) {
    facts.push({
      label: 'Adapt cue',
      value:
        stopReady === 1
          ? '1 bet is stop-ready for the next value review'
          : `${stopReady} bets are stop-ready for the next value review`,
    });
  }
  return facts;
}

function betFacts(
  bet: SteerSpec['spec']['bets'][number],
  teamNameById: Map<string, string>,
  linkedMetrics: Array<{ title: string }>,
): ValueTreeFact[] {
  const facts: ValueTreeFact[] = [{ label: 'Kill criteria', value: bet.killCriteria }];

  const fundedTeams = bet.fundedTeamIds.map((id) => teamNameById.get(id) ?? id).filter(Boolean);
  if (fundedTeams.length > 0) {
    facts.push({
      label: 'Funded teams',
      value: fundedTeams.join(', '),
    });
  }

  const reviewParts = [bet.horizon?.trim(), bet.reviewDate?.trim()].filter(Boolean);
  if (reviewParts.length > 0) {
    facts.push({ label: 'Next review', value: reviewParts.join(' · ') });
  }

  if (bet.fundingStance) {
    facts.push({ label: 'Funding stance', value: presentFundingStance(bet.fundingStance) });
  }

  if (bet.kind) {
    facts.push({ label: 'Kind', value: presentBetKind(bet.kind) });
  }

  if (linkedMetrics.length > 0) {
    facts.push({
      label: 'Judged on',
      value: linkedMetrics.map((metric) => metric.title).join(', '),
    });
  }

  return facts;
}

function resolveBetMetrics(
  bet: SteerSpec['spec']['bets'][number],
  metricById: Map<
    string,
    {
      id: string;
      title: string;
      unit?: string;
      current?: number | null;
      baseline?: number | null;
      target?: number | null;
      interpretation?: string;
      outcomeId: string;
    }
  >,
) {
  const ids = [...(bet.primaryMetricId ? [bet.primaryMetricId] : []), ...(bet.metricIds ?? [])];
  const seen = new Set<string>();
  const metrics = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const metric = metricById.get(id);
    if (metric) metrics.push(metric);
  }
  return metrics;
}

function presentMeasureCue(metric: {
  id: string;
  title: string;
  unit?: string;
  current?: number | null;
  target?: number | null;
  interpretation?: string;
}): ValueTreeMeasureCue {
  const unit = metric.unit;
  const current = typeof metric.current === 'number' ? metric.current : null;
  const target = typeof metric.target === 'number' ? metric.target : null;
  const displayValue = current === null ? '—' : formatMeasureNumber(current, unit);
  const targetLabel = target === null ? null : `Target ${formatMeasureNumber(target, unit)}`;
  const interpretation =
    metric.interpretation?.trim() ||
    (target === null || current === null
      ? 'No reading yet.'
      : `${displayValue} vs ${formatMeasureNumber(target, unit)} target.`);

  return {
    id: metric.id,
    title: metric.title,
    displayValue,
    interpretation,
    targetLabel,
  };
}

function presentGoalStatus(status: SteerSpec['spec']['outcomes'][number]['status']): string {
  switch (status) {
    case 'on_track':
      return 'On track';
    case 'at_risk':
      return 'At risk';
    case 'achieved':
      return 'Achieved';
    case 'abandoned':
      return 'Abandoned';
  }
}

function presentFundingStance(
  stance: NonNullable<SteerSpec['spec']['bets'][number]['fundingStance']>,
): string {
  switch (stance) {
    case 'explore':
      return 'Explore';
    case 'exploit':
      return 'Exploit';
    case 'sustain':
      return 'Sustain';
  }
}

function presentBetKind(kind: NonNullable<SteerSpec['spec']['bets'][number]['kind']>): string {
  switch (kind) {
    case 'opportunity':
      return 'Opportunity';
    case 'capability':
      return 'Capability';
  }
}

function formatStatusMix(labels: string[]): string | null {
  if (labels.length === 0) return null;
  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => `${count} ${label.toLowerCase()}`)
    .join(' · ');
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function formatCounts(
  parts: Array<{ count: number; singular: string; plural: string }>,
): string | null {
  const present = parts.filter((part) => part.count > 0);
  if (present.length === 0) return null;
  return present
    .map((part) => `${part.count} ${part.count === 1 ? part.singular : part.plural}`)
    .join(' · ');
}

function formatMeasureNumber(value: number, unit?: string): string {
  const rendered = Number.isInteger(value) ? String(value) : String(value);
  if (!unit) return rendered;
  if (unit === 'percent') return `${rendered}%`;
  return `${rendered} ${unit}`;
}
