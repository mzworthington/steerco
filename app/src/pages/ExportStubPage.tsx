import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

/** Placeholder until F08 export board pack lands. */
export function ExportStubPage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  useEffect(() => {
    document.title = 'Export · SteerLens';
  }, []);

  if (!session) return null;

  return (
    <section className="workspace-home" data-testid="export-stub">
      <p className="eyebrow">Export</p>
      <h1 className="workspace-home-title">Board pack export</h1>
      <p className="workspace-home-lead">
        Invest / Work / Adapt board-pack export (F08) lands next. Decision notes are ready to
        include when export ships.
      </p>
      <Link href="/workspace/decisions" className="btn-secondary mt-8">
        ← Back to decision notes
      </Link>
    </section>
  );
}
