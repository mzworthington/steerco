import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  presentSteeringOverview,
  reorderBetValueStack,
} from '../application/presentSteeringOverview';
import { SteeringValueStack } from '../components/steering/SteeringValueStack';
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
      document.title = `${model.workspaceTitle} · Steering · SteerCo`;
    }
  }, [model]);

  if (!session || !model) {
    return null;
  }

  const reorderStack = (orderedBetIds: string[]) => {
    const applied = reorderBetValueStack(session.spec, orderedBetIds);
    if (!applied.ok) {
      setRankError(applied.error);
      return;
    }
    setRankError(null);
    setSession({ ...session, spec: applied.value });
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

      <SteeringValueStack bets={model.valueStack} onReorder={reorderStack} />
    </section>
  );
}
