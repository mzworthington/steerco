import type { SteerSpec } from '@steerlens/core';

export type ValueTreeOrientation = 'TB' | 'LR';

export type ValueTreeNodeKind = 'vision' | 'outcome' | 'bet' | 'initiative';

export type ValueTreeGraphNode = {
  id: string;
  kind: ValueTreeNodeKind;
  label: string;
  /** Short supporting line for the node and detail panel. */
  summary: string | null;
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

export type ValueTreeOutlineBet = {
  id: string;
  title: string;
  initiatives: Array<{ id: string; title: string }>;
};

export type ValueTreeOutlineOutcome = {
  id: string;
  title: string;
  bets: ValueTreeOutlineBet[];
};

export type ValueTreeModel = {
  vision: string;
  orientation: ValueTreeOrientation;
  lead: string;
  nodes: ValueTreeGraphNode[];
  edges: ValueTreeGraphEdge[];
  outline: ValueTreeOutlineOutcome[];
  outcomeCount: number;
  betCount: number;
  initiativeCount: number;
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
  href: string | null;
  hrefLabel: string | null;
  children: LayoutChild[];
};

/**
 * Present the Lean Value Tree spine as positioned nodes/edges (TB or LR)
 * plus an outline for a11y. Vision → outcomes → bets → optional initiatives.
 */
export function presentValueTree(
  spec: SteerSpec,
  orientation: ValueTreeOrientation = 'TB',
): ValueTreeModel {
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

  const outline: ValueTreeOutlineOutcome[] = spec.spec.outcomes.map((outcome) => {
    const bets = spec.spec.bets
      .filter((bet) => bet.outcomeId === outcome.id)
      .map((bet) => ({
        id: bet.id,
        title: bet.title,
        initiatives: (initiativesByBet.get(bet.id) ?? []).map((item) => ({
          id: item.id,
          title: item.title,
        })),
      }));
    return { id: outcome.id, title: outcome.title, bets };
  });

  const betCount = outline.reduce((sum, outcome) => sum + outcome.bets.length, 0);
  const initiativeCount = outline.reduce(
    (sum, outcome) => sum + outcome.bets.reduce((inner, bet) => inner + bet.initiatives.length, 0),
    0,
  );

  const root: LayoutChild = {
    id: 'vision',
    kind: 'vision',
    label: 'Vision',
    summary: truncate(spec.spec.vision, 120),
    href: null,
    hrefLabel: null,
    children: spec.spec.outcomes.map((outcome) => {
      const outcomeBets = spec.spec.bets.filter((bet) => bet.outcomeId === outcome.id);
      const measureCount = outcome.metrics.length;
      return {
        id: outcome.id,
        kind: 'outcome' as const,
        label: outcome.title,
        summary:
          outcome.summary?.trim() ||
          `${measureCount} measure${measureCount === 1 ? '' : 's'} · ${outcomeBets.length} bet${outcomeBets.length === 1 ? '' : 's'}`,
        href: '/workspace/outcomes',
        hrefLabel: 'Open outcomes',
        children: outcomeBets.map((bet) => {
          const initiatives = initiativesByBet.get(bet.id) ?? [];
          return {
            id: bet.id,
            kind: 'bet' as const,
            label: bet.title,
            summary: bet.successSignal,
            href: `/workspace/bets/${bet.id}`,
            hrefLabel: 'Open bet',
            children: initiatives.map((initiative) => ({
              id: initiative.id,
              kind: 'initiative' as const,
              label: initiative.title,
              summary: initiative.successSignal,
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
    lead:
      orientation === 'TB'
        ? 'Top-down Lean Value Tree: vision → outcomes → bets → initiatives. Select a node for detail.'
        : 'Left-to-right Lean Value Tree: vision → outcomes → bets → initiatives. Select a node for detail.',
    nodes,
    edges,
    outline,
    outcomeCount: outline.length,
    betCount,
    initiativeCount,
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

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
