import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { BrandMark } from '../components/BrandMark';
import { SITE_NAME } from '../siteConfig';
import { useWorkspaceSession } from './WorkspaceSession';

const NAV = [
  { href: '/workspace', label: 'Home', match: (path: string) => path === '/workspace' },
  {
    href: '/workspace/steering',
    label: 'Steering overview',
    match: (path: string) => path.startsWith('/workspace/steering'),
  },
  {
    href: '/workspace/outcomes',
    label: 'Outcomes',
    match: (path: string) => path.startsWith('/workspace/outcomes'),
  },
  {
    href: '/workspace/evidence',
    label: 'Evidence',
    match: (path: string) => path.startsWith('/workspace/evidence'),
  },
  {
    href: '/workspace/organisation',
    label: 'How work is organised',
    match: (path: string) => path.startsWith('/workspace/organisation'),
  },
  {
    href: '/workspace/decisions',
    label: 'Decision notes',
    match: (path: string) => path.startsWith('/workspace/decisions'),
  },
  {
    href: '/workspace/export',
    label: 'Export',
    match: (path: string) => path.startsWith('/workspace/export'),
  },
] as const;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { session, hasPendingChanges, canWriteToFolder, saveWorkspace } = useWorkspaceSession();
  const [saveFlash, setSaveFlash] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const diffActive = location.startsWith('/workspace/diff');
  const sessionReady = Boolean(session);

  const onSave = async () => {
    if (!session || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const result = await saveWorkspace();
      if (!result.ok) {
        setSaveFlash(null);
        setSaveError(result.error);
        return;
      }
      setSaveFlash(
        result.method === 'directory'
          ? `Saved ${result.fileName}`
          : `Downloaded ${result.fileName}`,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-shell" data-testid="workspace-shell">
      <aside className="workspace-sidebar" aria-label="Workspace">
        <Link href="/workspace" className="workspace-brand">
          <BrandMark variant="lockup" />
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="workspace-nav" aria-label="Workspace sections">
          {NAV.map((item) => {
            const active = item.match(location);
            const isHome = item.href === '/workspace';
            const enabled = isHome || sessionReady;
            if (!enabled) {
              return (
                <span
                  key={item.href}
                  className="workspace-nav-link workspace-nav-link-disabled"
                  aria-disabled="true"
                >
                  {item.label}
                </span>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active ? 'workspace-nav-link workspace-nav-link-active' : 'workspace-nav-link'
                }
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {!sessionReady ? (
          <p className="workspace-nav-hint" data-testid="workspace-nav-hint">
            Open a workspace to explore.
          </p>
        ) : null}
        {session ? (
          <div className="workspace-persist">
            <Link
              href="/workspace/diff"
              className={
                diffActive
                  ? 'workspace-pending workspace-pending-active'
                  : hasPendingChanges
                    ? 'workspace-pending workspace-pending-dirty'
                    : 'workspace-pending'
              }
              data-testid="workspace-pending-link"
              aria-current={diffActive ? 'page' : undefined}
            >
              <span className="workspace-pending-label">
                {hasPendingChanges ? 'Pending changes' : 'No pending changes'}
              </span>
              {hasPendingChanges ? (
                <span className="workspace-pending-badge" aria-hidden="true">
                  ·
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="btn-primary workspace-save"
              data-testid="workspace-save"
              disabled={saving || !hasPendingChanges}
              onClick={() => void onSave()}
            >
              {saving ? 'Saving…' : canWriteToFolder ? 'Save to folder' : 'Save download'}
            </button>
            {saveError ? (
              <p className="workspace-save-error" role="alert">
                {saveError}
              </p>
            ) : null}
            {!saveError && saveFlash ? (
              <p className="workspace-save-flash" role="status">
                {saveFlash}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="workspace-sidebar-footer">
          <Link href="/docs/product-guide" className="workspace-sidebar-docs">
            Product guide
          </Link>
          <p className="workspace-sidebar-note">No account required for Slice 1.</p>
        </div>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
