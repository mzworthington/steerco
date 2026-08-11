import type { SteerSpec } from '@steerlens/core';

export type ValueTreeOrientation = 'TB' | 'LR';

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
  mermaid: string;
  lead: string;
  outline: ValueTreeOutlineOutcome[];
  outcomeCount: number;
  betCount: number;
  initiativeCount: number;
};

/**
 * Present the Lean Value Tree spine as Mermaid (TB or LR) plus an outline for a11y.
 * Vision → outcomes → bets → optional initiatives.
 */
export function presentValueTree(
  spec: SteerSpec,
  orientation: ValueTreeOrientation = 'TB',
): ValueTreeModel {
  const initiativesByBet = new Map<string, Array<{ id: string; title: string }>>();
  for (const initiative of spec.spec.initiatives ?? []) {
    const list = initiativesByBet.get(initiative.betId) ?? [];
    list.push({ id: initiative.id, title: initiative.title });
    initiativesByBet.set(initiative.betId, list);
  }

  const outline: ValueTreeOutlineOutcome[] = spec.spec.outcomes.map((outcome) => {
    const bets = spec.spec.bets
      .filter((bet) => bet.outcomeId === outcome.id)
      .map((bet) => ({
        id: bet.id,
        title: bet.title,
        initiatives: initiativesByBet.get(bet.id) ?? [],
      }));
    return { id: outcome.id, title: outcome.title, bets };
  });

  const betCount = outline.reduce((sum, outcome) => sum + outcome.bets.length, 0);
  const initiativeCount = outline.reduce(
    (sum, outcome) => sum + outcome.bets.reduce((inner, bet) => inner + bet.initiatives.length, 0),
    0,
  );

  return {
    vision: spec.spec.vision,
    orientation,
    mermaid: buildMermaid(spec.spec.vision, outline, orientation),
    lead:
      orientation === 'TB'
        ? 'Top-down Lean Value Tree: vision → outcomes → bets → initiatives.'
        : 'Left-to-right Lean Value Tree: vision → outcomes → bets → initiatives.',
    outline,
    outcomeCount: outline.length,
    betCount,
    initiativeCount,
  };
}

function buildMermaid(
  vision: string,
  outline: ValueTreeOutlineOutcome[],
  orientation: ValueTreeOrientation,
): string {
  const lines: string[] = [`flowchart ${orientation}`];
  const visionId = 'vision';
  lines.push(`  ${visionId}["${escapeLabel(truncate(vision, 72))}"]`);

  if (outline.length === 0) {
    lines.push('  empty["No outcomes yet"]');
    lines.push(`  ${visionId} --> empty`);
    return lines.join('\n');
  }

  for (const outcome of outline) {
    const outcomeNode = mermaidSafeId(outcome.id);
    lines.push(`  ${outcomeNode}["${escapeLabel(outcome.title)}"]`);
    lines.push(`  ${visionId} --> ${outcomeNode}`);

    for (const bet of outcome.bets) {
      const betNode = mermaidSafeId(bet.id);
      lines.push(`  ${betNode}["${escapeLabel(bet.title)}"]`);
      lines.push(`  ${outcomeNode} --> ${betNode}`);

      for (const initiative of bet.initiatives) {
        const initNode = mermaidSafeId(initiative.id);
        lines.push(`  ${initNode}["${escapeLabel(initiative.title)}"]`);
        lines.push(`  ${betNode} --> ${initNode}`);
      }
    }
  }

  return lines.join('\n');
}

function mermaidSafeId(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9_]/g, '_');
  return /^[0-9]/.test(cleaned) ? `n_${cleaned}` : cleaned;
}

function escapeLabel(value: string): string {
  return value.replace(/"/g, "'").replace(/[\[\]]/g, '');
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}
