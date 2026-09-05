import { useEffect, useMemo, useState } from 'react';
import { Link, Redirect } from 'wouter';
import {
  presentSteeringOverview,
  reorderBetValueStack,
} from '../application/presentSteeringOverview';
import { SteeringValueStack } from '../components/steering/SteeringValueStack';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';
import { PageHeader } from '../components/PageHeader';

export function SteeringOverviewPage() {
  const { session, setSession } = useWorkspaceSession();
  const [rankError, setRankError] = useState<string | null>(null);

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

  if (!session) {
    return <Redirect to="/workspace" />;
  }

  if (!model) {
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
      <PageHeader
        eyebrow={model.periodLabel}
        title={model.workspaceTitle}
        framing={
          <>
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
          </>
        }
        action={
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
        }
      />

      {rankError ? (
        <p className="steering-rank-error" role="alert">
          {rankError}
        </p>
      ) : null}

      <SteeringValueStack bets={model.valueStack} onReorder={reorderStack} />
    </section>
  );
}
