import type { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BrandMark } from '../components/BrandMark';
import { SITE_NAME } from '../siteConfig';

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
    disabled: true,
  },
  {
    href: '/workspace/organisation',
    label: 'How work is organised',
    match: (path: string) => path.startsWith('/workspace/organisation'),
    disabled: true,
  },
  {
    href: '/workspace/decisions',
    label: 'Decision notes',
    match: (path: string) => path.startsWith('/workspace/decisions'),
    disabled: true,
  },
  {
    href: '/workspace/export',
    label: 'Export',
    match: (path: string) => path.startsWith('/workspace/export'),
    disabled: true,
  },
] as const;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

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
            if ('disabled' in item && item.disabled) {
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
        <p className="workspace-sidebar-note">No account required for Slice 1.</p>
      </aside>
      <div className="workspace-main">{children}</div>
    </div>
  );
}
