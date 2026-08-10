import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

/** Lightweight placeholder until F07 decision notes land. */
export function DecisionNotesStubPage() {
  const { session } = useWorkspaceSession();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!session) {
      setLocation('/workspace');
    }
  }, [session, setLocation]);

  useEffect(() => {
    document.title = 'Decision notes · SteerLens';
  }, []);

  if (!session) return null;

  return (
    <section className="workspace-home" data-testid="decision-notes-stub">
      <p className="eyebrow">Decision notes</p>
      <h1 className="workspace-home-title">Decision notes</h1>
      <p className="workspace-home-lead">
        Authoring start / continue / stop notes (F07) lands next. Your organisation shape is ready
        to inform that note.
      </p>
      <Link href="/workspace/organisation" className="btn-secondary mt-8">
        ← Back to organisation
      </Link>
    </section>
  );
}
