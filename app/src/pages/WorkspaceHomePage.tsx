import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { createNewWorkspaceFile } from '../adapters/createNewWorkspaceFile';
import { loadSampleWorkspace, SAMPLE_WORKSPACE_LABEL } from '../adapters/sampleWorkspaceLoader';
import {
  openWorkspaceFromDirectoryHandle,
  openWorkspaceFromLocalPick,
} from '../adapters/localSteerSpecPicker';
import {
  listRecentWorkspaces,
  rememberRecentWorkspace,
  type RecentWorkspace,
} from '../adapters/recentWorkspacesStore';
import {
  ensureDirectoryWritePermission,
  loadWorkspaceDirectoryBinding,
} from '../adapters/workspaceDirectoryStore';
import { BLANK_WORKSPACE_LABEL } from '../application/createBlankWorkspace';
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
  const { session, openSession } = useWorkspaceSession();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<RecentWorkspace[]>(() => listRecentWorkspaces());

  useEffect(() => {
    document.title = 'Your workspace · SteerCo';
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
      persistence: { mode: 'download' },
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

  async function createNewFile() {
    setError(null);
    setBusy(true);
    try {
      const created = await createNewWorkspaceFile();
      if ('cancelled' in created && created.cancelled) {
        return;
      }
      if (!created.ok) {
        setError(created.error);
        return;
      }
      const title = created.value.metadata.title ?? created.value.metadata.name;
      openSession({
        spec: created.value,
        source: created.method === 'directory' ? 'folder' : 'file',
        label: created.label || BLANK_WORKSPACE_LABEL,
        persistence: created.persistence,
      });
      setRecent(
        rememberRecentWorkspace({
          id: `file:${created.value.metadata.name}`,
          title,
          kind: 'file',
        }),
      );
      setLocation('/workspace/steering');
    } finally {
      setBusy(false);
    }
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
        persistence:
          opened.directory && opened.fileName
            ? {
                mode: 'directory',
                directory: opened.directory,
                fileName: opened.fileName,
              }
            : { mode: 'download' },
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

  async function reopenRecent(entry: RecentWorkspace) {
    if (entry.kind === 'sample') {
      void startFromSample();
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const binding = await loadWorkspaceDirectoryBinding(entry.id);
      if (!binding) {
        setError(
          'Re-open that workspace with Open folder - the browser no longer has a saved folder handle.',
        );
        return;
      }
      const allowed = await ensureDirectoryWritePermission(binding.directory);
      if (!allowed) {
        setError('Folder access was denied. Choose Open folder and grant permission again.');
        return;
      }
      const opened = await openWorkspaceFromDirectoryHandle(binding.directory);
      if (!opened.ok) {
        setError(opened.error);
        return;
      }
      const title = opened.value.metadata.title ?? opened.value.metadata.name;
      const source = entry.id.startsWith('file:') ? 'file' : 'folder';
      openSession({
        spec: opened.value,
        source,
        label: opened.label ?? title,
        persistence:
          opened.directory && opened.fileName
            ? {
                mode: 'directory',
                directory: opened.directory,
                fileName: opened.fileName,
              }
            : { mode: 'download' },
      });
      setRecent(
        rememberRecentWorkspace({
          id: entry.id,
          title,
          kind: 'file',
        }),
      );
      setLocation('/workspace/steering');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="workspace-home" data-testid="workspace-home">
      <div className="workspace-home-copy">
        <h1 className="workspace-home-title">Your workspace</h1>
        <p className="workspace-home-lead">
          Everything stays on this device until you choose to connect systems.
        </p>
        <div className="workspace-home-actions">
          {session ? (
            <button
              type="button"
              className="btn-primary"
              data-testid="workspace-continue"
              onClick={() => setLocation('/workspace/steering')}
            >
              Continue {session.label}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={() => void openFolder()}
              disabled={busy}
            >
              Open folder
            </button>
          )}
          {session ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => void openFolder()}
              disabled={busy}
            >
              Open folder
            </button>
          ) : null}
          <button
            type="button"
            className="btn-secondary"
            data-testid="workspace-create-file"
            onClick={() => void createNewFile()}
            disabled={busy}
          >
            Create new file
          </button>
          <button
            type="button"
            className="btn-tertiary"
            onClick={() => void startFromSample()}
            disabled={busy}
          >
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
                  onClick={() => void reopenRecent(entry)}
                  disabled={busy}
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
