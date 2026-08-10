import { useEffect, useMemo } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { presentBetStatus } from '../application/presentSteeringOverview';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function BetDetailStubPage() {
  const params = useParams<{ betId: string }>();
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const bet = useMemo(
    () => session?.spec.spec.bets.find((item) => item.id === params.betId) ?? null,
    [session, params.betId],
  );

  useEffect(() => {
    document.title = bet ? `${bet.title} · SteerLens` : 'Bet · SteerLens';
  }, [bet]);

  if (!session) return null;

  if (!bet) {
    return (
      <section className="workspace-home" data-testid="bet-detail-missing">
        <h1 className="workspace-home-title">Bet not found</h1>
        <p className="workspace-home-lead">That bet is not in the open workspace.</p>
        <Link href="/workspace/steering" className="btn-secondary">
          ← Back to steering
        </Link>
      </section>
    );
  }

  const status = presentBetStatus(bet.status);

  return (
    <section className="workspace-home" data-testid="bet-detail-stub">
      <p className="eyebrow">Bet detail</p>
      <h1 className="workspace-home-title">{bet.title}</h1>
      <p className="workspace-home-lead">{bet.successSignal}</p>
      <p
        className={
          status.tone === 'stop'
            ? 'status-stop'
            : status.tone === 'at-risk'
              ? 'status-at-risk'
              : 'status-on-track'
        }
      >
        {status.label}
      </p>
      <p className="text-ink-muted mt-6 text-sm">
        Full bet editing (F04) lands next. Kill criteria and funding stay in SteerSpec for now.
      </p>
      <Link href="/workspace/steering" className="btn-secondary mt-8">
        ← Back to steering
      </Link>
    </section>
  );
}
