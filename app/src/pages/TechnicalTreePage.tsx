import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { presentTechnicalTree } from '../application/presentTechnicalTree';
import { OutcomesValueTree } from '../components/outcomes/OutcomesValueTree';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

export function TechnicalTreePage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  const model = useMemo(() => (session ? presentTechnicalTree(session.spec) : null), [session]);

  useEffect(() => {
    if (model) {
      document.title = `Steer tree · ${model.workspaceTitle} · SteerLens`;
    }
  }, [model]);

  if (!session || !model) return null;

  return (
    <section className="technical-page" data-testid="technical-tree">
      <header className="technical-header">
        <p className="technical-crumb">
          <Link href="/workspace/technical">Technical</Link> / Steer tree
        </p>
        <h1 className="technical-title">Steer tree</h1>
        <p className="technical-lead">
          {model.workspaceTitle} · {model.outcomes.length} outcomes · {model.bets.length} bets ·{' '}
          {model.teams.length} teams · {model.initiativeCount} initiatives · {model.productCount}{' '}
          products
        </p>
        {model.techRadarUrl ? (
          <p className="technical-meta">
            Tech radar:{' '}
            <a href={model.techRadarUrl} target="_blank" rel="noreferrer">
              {model.techRadarUrl}
            </a>
          </p>
        ) : null}
      </header>

      <OutcomesValueTree spec={session.spec} dense />

      <section className="technical-section" aria-labelledby="tech-outcomes">
        <h2 id="tech-outcomes" className="technical-section-title">
          Outcomes
        </h2>
        <div className="technical-table-wrap">
          <table className="technical-table">
            <thead>
              <tr>
                <th scope="col">id</th>
                <th scope="col">title</th>
                <th scope="col">status</th>
                <th scope="col">metrics</th>
              </tr>
            </thead>
            <tbody>
              {model.outcomes.map((outcome) => (
                <tr key={outcome.id}>
                  <td>
                    <code>{outcome.id}</code>
                  </td>
                  <td>
                    <Link href="/workspace/outcomes">{outcome.title}</Link>
                  </td>
                  <td>
                    <code>{outcome.status}</code>
                  </td>
                  <td>
                    <code>{outcome.metricIds.join(', ') || '—'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="technical-section" aria-labelledby="tech-bets">
        <h2 id="tech-bets" className="technical-section-title">
          Bets
        </h2>
        <div className="technical-table-wrap">
          <table className="technical-table">
            <thead>
              <tr>
                <th scope="col">id</th>
                <th scope="col">title</th>
                <th scope="col">outcomeId</th>
                <th scope="col">kind / stance</th>
                <th scope="col">valueRank</th>
                <th scope="col">systemRefs</th>
              </tr>
            </thead>
            <tbody>
              {model.bets.map((bet) => (
                <tr key={bet.id}>
                  <td>
                    <code>{bet.id}</code>
                  </td>
                  <td>
                    <Link href={bet.executiveHref}>{bet.title}</Link>
                  </td>
                  <td>
                    <code>{bet.outcomeId}</code>
                  </td>
                  <td>
                    <code>
                      {bet.kind ?? '—'} / {bet.fundingStance ?? '—'}
                    </code>
                  </td>
                  <td>
                    <code>{bet.valueRank ?? '—'}</code>
                  </td>
                  <td>
                    <code>{bet.systemRefs.join(', ') || '—'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="technical-section" aria-labelledby="tech-teams">
        <h2 id="tech-teams" className="technical-section-title">
          Teams
        </h2>
        <div className="technical-table-wrap">
          <table className="technical-table">
            <thead>
              <tr>
                <th scope="col">id</th>
                <th scope="col">displayName</th>
                <th scope="col">role</th>
                <th scope="col">provenance</th>
                <th scope="col">externalRefs</th>
              </tr>
            </thead>
            <tbody>
              {model.teams.map((team) => (
                <tr key={team.id}>
                  <td>
                    <code>{team.id}</code>
                  </td>
                  <td>
                    <Link href={team.executiveHref}>{team.displayName}</Link>
                  </td>
                  <td>
                    <code>{team.role}</code>
                  </td>
                  <td>
                    <code>{team.provenance}</code>
                  </td>
                  <td>
                    <code>
                      {team.externalRefs.length === 0
                        ? '—'
                        : team.externalRefs.map((ref) => `${ref.system}:${ref.id}`).join(', ')}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="technical-section" aria-labelledby="tech-rels">
        <h2 id="tech-rels" className="technical-section-title">
          Relationships
        </h2>
        <div className="technical-table-wrap">
          <table className="technical-table">
            <thead>
              <tr>
                <th scope="col">from</th>
                <th scope="col">to</th>
                <th scope="col">mode</th>
                <th scope="col">windows</th>
              </tr>
            </thead>
            <tbody>
              {model.relationships.map((rel) => (
                <tr key={`${rel.fromTeamId}-${rel.toTeamId}-${rel.mode}`}>
                  <td>
                    <code>{rel.fromTeamId}</code>
                    <span className="technical-muted"> {rel.fromLabel}</span>
                  </td>
                  <td>
                    <code>{rel.toTeamId}</code>
                    <span className="technical-muted"> {rel.toLabel}</span>
                  </td>
                  <td>
                    <code>{rel.mode}</code>
                  </td>
                  <td>
                    <code>
                      {[
                        rel.effectiveFrom ? `from ${rel.effectiveFrom}` : null,
                        rel.effectiveUntil ? `until ${rel.effectiveUntil}` : null,
                        rel.expectedUntil ? `expectedUntil ${rel.expectedUntil}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
