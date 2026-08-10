import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { loadSampleWorkspace, SAMPLE_WORKSPACE_LABEL } from '../adapters/sampleWorkspaceLoader';
import { openWorkspaceFromLocalPick } from '../adapters/localSteerSpecPicker';
import {
  listRecentWorkspaces,
  rememberRecentWorkspace,
  type RecentWorkspace,
} from '../adapters/recentWorkspacesStore';
import { useWorkspaceSession } from '../workspace/WorkspaceSession';

function formatOpenedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function WorkspaceHomePage() {
  const [, setLocation] = useLocation();
  const { openSession } = useWorkspaceSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<RecentWorkspace[]>(() => listRecentWorkspaces());

  useEffect(() => {
    document.title = 'Your workspace · SteerLens';
  }, []);

  const recentItems = useMemo(() => recent, [recent]);

  async function startFromSample() {
    setError(null);
    const opened = loadSampleWorkspace();
    if (!opened.ok) {
      setError(opened.error);
      return;
    }
    openSession({
      spec: opened.value,
      source: 'sample',
      label: SAMPLE_WORKSPACE_LABEL,
    });
    setRecent(
      rememberRecentWorkspace({
        id: 'sample:northwind-q3-alignment',
        title: SAMPLE_WORKSPACE_LABEL,
        kind: 'sample',
      }),
    );
    setLocation('/workspace/steering');
  }

  async function openFolder() {
    setError(null);
    setBusy(true);
    try {
      const opened = await openWorkspaceFromLocalPick();
      if ('cancelled' in opened && opened.cancelled) {
        return;
      }
      if (!opened.ok) {
        setError(opened.error);
        return;
      }
      const title = opened.value.metadata.title ?? opened.value.metadata.name;
      const label = opened.label ?? title;
      const source = label.endsWith('.yaml') || label.endsWith('.yml') ? 'file' : 'folder';
      openSession({
        spec: opened.value,
        source,
        label,
      });
      setRecent(
        rememberRecentWorkspace({
          id: `${source}:${opened.value.metadata.name}`,
          title,
          kind: 'file',
        }),
      );
      setLocation('/workspace/steering');
    } finally {
      setBusy(false);
    }
  }

  function reopenRecent(entry: RecentWorkspace) {
    if (entry.kind === 'sample') {
      void startFromSample();
      return;
    }
    setError(
      'Re-open that workspace with Open folder — folder access is not kept between visits yet.',
    );
  }

  return (
    <section className="workspace-home" data-testid="workspace-home">
      <div className="workspace-home-copy">
        <h1 className="workspace-home-title">Your workspace</h1>
        <p className="workspace-home-lead">
          Everything stays on this device until you choose to connect systems.
        </p>
        <div className="workspace-home-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void openFolder()}
            disabled={busy}
          >
            Open folder
          </button>
          <button type="button" className="btn-secondary" onClick={() => void startFromSample()}>
            Start from sample
          </button>
        </div>
        {error ? (
          <p className="workspace-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="workspace-recent">
        <h2 className="workspace-recent-title">Recent workspaces</h2>
        {recentItems.length === 0 ? (
          <p className="workspace-recent-empty">No recent workspaces yet.</p>
        ) : (
          <ul className="workspace-recent-list">
            {recentItems.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="workspace-recent-item"
                  onClick={() => reopenRecent(entry)}
                >
                  <span className="workspace-recent-name">{entry.title}</span>
                  <span className="workspace-recent-meta">{formatOpenedAt(entry.openedAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
