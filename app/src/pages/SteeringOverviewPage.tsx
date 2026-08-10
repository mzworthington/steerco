import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { presentSteeringOverview } from '../application/presentSteeringOverview';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function SteeringOverviewPage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();

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

  return (
    <section className="steering-overview" data-testid="steering-overview">
      <header className="steering-header">
        <div>
          <p className="eyebrow">{model.periodLabel}</p>
          <h1 className="steering-title">{model.workspaceTitle}</h1>
          <p className="steering-vision">{model.vision}</p>
          <p className="steering-alignment">{model.alignmentSummary}</p>
          {model.nextReviewSummary ? (
            <p className="steering-next-review">{model.nextReviewSummary}</p>
          ) : null}
          {model.mismatchSummary ? (
            <p className="steering-mismatch">{model.mismatchSummary}</p>
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
                  <Link
                    href={`/workspace/bets/${bet.id}`}
                    className="steering-bet-card"
                    data-status={bet.statusTone}
                  >
                    <div>
                      <h3 className="steering-bet-title">{bet.title}</h3>
                      <p className="steering-bet-cue">{bet.metricCue}</p>
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
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
