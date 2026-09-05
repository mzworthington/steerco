import { useEffect, useMemo } from 'react';
import { Link, Redirect } from 'wouter';
import { presentTechnicalFitness } from '../application/presentTechnicalFitness';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function TechnicalFitnessPage() {
  const { session } = useWorkspaceSession();

  const model = useMemo(() => (session ? presentTechnicalFitness(session.spec) : null), [session]);

  useEffect(() => {
    if (model) {
      document.title = `Topology fitness · ${model.workspaceTitle} · SteerCo`;
    }
  }, [model]);

  if (!session) {
    return <Redirect to="/workspace" />;
  }

  if (!model) return null;

  return (
    <section className="technical-page" data-testid="technical-fitness">
      <header className="technical-header">
        <p className="technical-crumb">
          <Link href="/workspace/technical">Technical</Link> / Topology fitness
        </p>
        <h1 className="technical-title">Topology fitness</h1>
        <p className="technical-lead">
          {model.mismatchCount} mismatches · {model.errorCount} errors · {model.warningCount}{' '}
          warnings · <Link href="/workspace/steering">Back to steering</Link>
        </p>
      </header>

      <section className="technical-section" aria-labelledby="tech-mismatches">
        <h2 id="tech-mismatches" className="technical-section-title">
          Mismatch list
        </h2>
        {model.mismatches.length === 0 ? (
          <p className="technical-empty">No mismatches detected for this workspace.</p>
        ) : (
          <ul className="technical-mismatch-list">
            {model.mismatches.map((item) => (
              <li
                key={`${item.code}-${item.headline}`}
                className="technical-mismatch"
                data-severity={item.severity}
              >
                <div className="technical-mismatch-head">
                  <span className="technical-mismatch-severity">{item.severity}</span>
                  <code className="technical-mismatch-code">{item.code}</code>
                </div>
                <p className="technical-mismatch-title">{item.title}</p>
                <p className="technical-mismatch-headline">{item.headline}</p>
                {item.deepLink ? (
                  <Link href={item.deepLink} className="technical-deep-link">
                    Open related executive view
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="technical-section"
        aria-labelledby="tech-writeback"
        data-testid="technical-writeback-panel"
      >
        <h2 id="tech-writeback" className="technical-section-title">
          Write-back policy
        </h2>
        <p className="technical-lead">{model.writeBack.summary}</p>
        <p className="technical-meta">
          Provider-synced teams never emit Group YAML. Catalog-file teams need explicit opt-in.
          SteerBet overlays remain allowed.
        </p>
        <div className="technical-table-wrap">
          <table className="technical-table">
            <thead>
              <tr>
                <th scope="col">team</th>
                <th scope="col">provenance</th>
                <th scope="col">Group YAML</th>
                <th scope="col">reason</th>
              </tr>
            </thead>
            <tbody>
              {model.writeBack.rows.map((row) => (
                <tr key={row.teamId}>
                  <td>
                    <code>{row.teamId}</code>
                    <span className="technical-muted"> {row.displayName}</span>
                  </td>
                  <td>
                    <code>{row.provenance}</code>
                  </td>
                  <td>
                    <code>{row.allowed ? 'allowed' : 'blocked'}</code>
                  </td>
                  <td>{row.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
