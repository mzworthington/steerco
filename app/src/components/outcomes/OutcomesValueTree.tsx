import { lazy, Suspense, useMemo, useState } from 'react';
import { presentValueTree, type ValueTreeOrientation } from '../../application/presentValueTree';
import type { SteerSpec } from '@steerlens/core';

const MermaidPreview = lazy(() =>
  import('../MermaidPreview').then((module) => ({ default: module.MermaidPreview })),
);

type Props = {
  spec: SteerSpec;
  /** Compact chrome for Technical mode. */
  dense?: boolean;
};

export function OutcomesValueTree({ spec, dense = false }: Props) {
  const [orientation, setOrientation] = useState<ValueTreeOrientation>('TB');
  const tree = useMemo(() => presentValueTree(spec, orientation), [spec, orientation]);

  return (
    <section
      className={dense ? 'value-tree value-tree--dense' : 'value-tree'}
      aria-labelledby="value-tree-heading"
      data-testid="outcomes-value-tree"
    >
      <div className="value-tree-header">
        <div>
          <p className="eyebrow">Lean Value Tree</p>
          <h2 id="value-tree-heading" className="value-tree-title">
            How investment nests
          </h2>
          <p className="value-tree-lead">{tree.lead}</p>
        </div>
        <div
          className="value-tree-orient"
          role="group"
          aria-label="Tree orientation"
          data-testid="value-tree-orient"
        >
          <button
            type="button"
            className={
              orientation === 'TB' ? 'value-tree-orient-btn is-active' : 'value-tree-orient-btn'
            }
            aria-pressed={orientation === 'TB'}
            onClick={() => setOrientation('TB')}
            data-testid="value-tree-orient-tb"
          >
            Top down
          </button>
          <button
            type="button"
            className={
              orientation === 'LR' ? 'value-tree-orient-btn is-active' : 'value-tree-orient-btn'
            }
            aria-pressed={orientation === 'LR'}
            onClick={() => setOrientation('LR')}
            data-testid="value-tree-orient-lr"
          >
            Left to right
          </button>
        </div>
      </div>

      <p className="value-tree-vision" data-testid="value-tree-vision">
        <span className="value-tree-vision-label">Vision</span>
        {tree.vision}
      </p>

      <div className="value-tree-canvas" data-testid="value-tree-canvas">
        <Suspense
          fallback={
            <div className="docs-mermaid docs-mermaid-loading" aria-busy="true">
              Loading diagram…
            </div>
          }
        >
          <MermaidPreview code={tree.mermaid} />
        </Suspense>
      </div>

      <details className="value-tree-outline">
        <summary>
          Outline ({tree.outcomeCount} outcomes · {tree.betCount} bets
          {tree.initiativeCount > 0 ? ` · ${tree.initiativeCount} initiatives` : ''})
        </summary>
        <ol className="value-tree-outline-list" data-testid="value-tree-outline">
          {tree.outline.map((outcome) => (
            <li key={outcome.id}>
              <span className="value-tree-outline-outcome">{outcome.title}</span>
              {outcome.bets.length > 0 ? (
                <ol>
                  {outcome.bets.map((bet) => (
                    <li key={bet.id}>
                      <span className="value-tree-outline-bet">{bet.title}</span>
                      {bet.initiatives.length > 0 ? (
                        <ol>
                          {bet.initiatives.map((initiative) => (
                            <li key={initiative.id}>{initiative.title}</li>
                          ))}
                        </ol>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="value-tree-outline-empty">No bets under this outcome yet.</p>
              )}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
