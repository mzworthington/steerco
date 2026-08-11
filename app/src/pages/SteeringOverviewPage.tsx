import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { applyBetValueRank, presentSteeringOverview } from '../application/presentSteeringOverview';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function SteeringOverviewPage() {
  const { session, setSession } = useWorkspaceSession();
  const [, setLocation] = useLocation();
  const [rankError, setRankError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(
    () =>
      session
        ? presentSteeringOverview(session.spec, {
            periodLabel: session.source === 'sample' ? 'Sample period' : 'Local workspace',
          })
        : null,
    [session],
  );

  useEffect(() => {
    if (model) {
      document.title = `${model.workspaceTitle} · Steering · SteerLens`;
    }
  }, [model]);

  if (!session || !model) {
    return null;
  }

  const setRank = (betId: string, next: number | null) => {
    const applied = applyBetValueRank(session.spec, betId, next);
    if (!applied.ok) {
      setRankError(applied.error);
      return;
    }
    setRankError(null);
    setSession({ ...session, spec: applied.value });
  };

  const nudgeRank = (betId: string, current: number | null, delta: number) => {
    const base = current ?? 1;
    setRank(betId, Math.max(1, base + delta));
  };

  return (
    <section className="steering-overview" data-testid="steering-overview">
      <header className="steering-header">
        <div>
          <p className="eyebrow">{model.periodLabel}</p>
          <h1 className="steering-title">{model.workspaceTitle}</h1>
          <p className="steering-vision">{model.vision}</p>
          <p className="steering-alignment">{model.alignmentSummary}</p>
          <p className="steering-portfolio-mix" data-testid="steering-portfolio-mix">
            {model.portfolioMix.hint}
          </p>
          {model.nextReviewSummary ? (
            <p className="steering-next-review">{model.nextReviewSummary}</p>
          ) : null}
          {model.mismatchSummary ? (
            <p className="steering-mismatch">{model.mismatchSummary}</p>
          ) : null}
          {model.wipMismatchSummary ? (
            <p className="steering-mismatch" data-testid="steering-wip-mismatches">
              {model.wipMismatchSummary}{' '}
              <Link href="/workspace/technical/fitness">Open fitness</Link>
            </p>
          ) : null}
          {model.decisionNotesSummary ? (
            <p className="steering-decisions">
              <Link href="/workspace/decisions">{model.decisionNotesSummary}</Link>
            </p>
          ) : null}
        </div>
        <ul className="steering-status-counts" aria-label="Bet status summary">
          <li>
            <span className="status-on-track">{model.statusCounts.onTrack} On track</span>
          </li>
          <li>
            <span className="status-at-risk">{model.statusCounts.atRisk} At risk</span>
          </li>
          <li>
            <span className="status-stop">{model.statusCounts.stop} Stop</span>
          </li>
        </ul>
      </header>

      {rankError ? (
        <p className="steering-rank-error" role="alert">
          {rankError}
        </p>
      ) : null}

      <div className="steering-outcomes">
        {model.outcomes.map((outcome) => (
          <section
            key={outcome.id}
            className="steering-outcome"
            aria-labelledby={`outcome-${outcome.id}`}
          >
            <h2 id={`outcome-${outcome.id}`} className="steering-outcome-title">
              {outcome.title}
            </h2>
            {outcome.summary ? <p className="steering-outcome-summary">{outcome.summary}</p> : null}
            <ul className="steering-bet-list">
              {outcome.bets.map((bet) => (
                <li key={bet.id}>
                  <div className="steering-bet-card" data-status={bet.statusTone}>
                    <div className="steering-bet-main">
                      <Link href={`/workspace/bets/${bet.id}`} className="steering-bet-link">
                        <h3 className="steering-bet-title">{bet.title}</h3>
                        <p className="steering-bet-cue">{bet.metricCue}</p>
                      </Link>
                      <div className="steering-bet-rank" data-testid={`bet-rank-${bet.id}`}>
                        <span className="steering-bet-rank-label">Value rank</span>
                        <button
                          type="button"
                          className="steering-bet-rank-btn"
                          aria-label={`Raise priority for ${bet.title}`}
                          onClick={() => nudgeRank(bet.id, bet.valueRank, -1)}
                        >
                          ▲
                        </button>
                        <input
                          type="number"
                          min={1}
                          step={1}
                          className="steering-bet-rank-input"
                          value={bet.valueRank ?? ''}
                          aria-label={`Value rank for ${bet.title}`}
                          onChange={(event) => {
                            const raw = event.target.value.trim();
                            if (!raw) {
                              setRank(bet.id, null);
                              return;
                            }
                            const next = Number(raw);
                            if (Number.isFinite(next)) {
                              setRank(bet.id, Math.trunc(next));
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="steering-bet-rank-btn"
                          aria-label={`Lower priority for ${bet.title}`}
                          onClick={() => nudgeRank(bet.id, bet.valueRank, 1)}
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                    <span
                      className={
                        bet.statusTone === 'on-track'
                          ? 'status-on-track'
                          : bet.statusTone === 'at-risk'
                            ? 'status-at-risk'
                            : bet.statusTone === 'stop'
                              ? 'status-stop'
                              : 'text-ink-muted'
                      }
                    >
                      {bet.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
