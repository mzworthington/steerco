import { useEffect, useMemo } from 'react';
import { Link, Redirect } from 'wouter';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

const LINKS = [
  {
    href: '/workspace/technical/tree',
    title: 'Steer tree',
    description: 'Ids, provenance, external refs, and funding links for goals, bets, and teams.',
  },
  {
    href: '/workspace/technical/fitness',
    title: 'Topology fitness',
    description: 'Full mismatch list plus write-back policy panel (ADR 0005).',
  },
  {
    href: '/workspace/technical/vocabulary',
    title: 'Vocabulary bridge',
    description: 'EDGE and Team Topologies aliases for staff+ without changing executive chrome.',
  },
  {
    href: '/workspace/technical/import',
    title: 'Catalog import',
    description: 'Parse a catalog file, preview team merge, apply refs - never emit Group YAML.',
  },
] as const;

export function TechnicalHubPage() {
  const { session } = useWorkspaceSession();

  const title = useMemo(
    () => session?.spec.metadata.title ?? session?.spec.metadata.name ?? 'Workspace',
    [session],
  );

  useEffect(() => {
    document.title = `Technical · ${title} · SteerCo`;
  }, [title]);

  if (!session) {
    return <Redirect to="/workspace" />;
  }

  return (
    <section className="technical-page" data-testid="technical-hub">
      <header className="technical-header">
        <p className="eyebrow">Technical mode</p>
        <h1 className="technical-title">SteerSpec detail</h1>
        <p className="technical-lead">
          Dense refs, fitness, and import for staff+. Executive screens stay jargon-light -
          deep-link back when you need the steering conversation.
        </p>
        <p className="technical-exec-links">
          <Link href="/workspace/steering">← Steering overview</Link>
          <Link href="/workspace/organisation">How work is organised</Link>
        </p>
      </header>

      <ul className="technical-hub-list">
        {LINKS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="technical-hub-card">
              <h2 className="technical-hub-card-title">{item.title}</h2>
              <p className="technical-hub-card-desc">{item.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
