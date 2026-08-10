import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import {
  WorkspaceSessionProvider,
  type WorkspaceSessionState,
} from '../workspace/WorkspaceSession';
import { OrganisationPage } from './OrganisationPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/organisation', setLocation] as const,
    Link: ({
      href,
      children,
      className,
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={href} className={className}>
        {children}
      </a>
    ),
  };
});

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function seedSession(session: WorkspaceSessionState) {
  sessionStorage.setItem('steerlens.workspace-session', JSON.stringify(session));
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
});

describe('OrganisationPage', () => {
  it('shows purpose zones, English relationships, and decision-note CTA', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession({
      spec: opened.value,
      source: 'sample',
      label: 'sample',
    });

    render(
      <WorkspaceSessionProvider>
        <OrganisationPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('organisation-page')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /how work is organised/i })).toBeTruthy();
    expect(screen.getByText(/four team types from team topologies/i)).toBeTruthy();
    expect(
      screen.getByText(/storefront experience uses as a service fulfilment platform/i),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /prepare decision note/i })).toBeTruthy();
  });

  it('adds a team by display name into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession({
      spec: opened.value,
      source: 'sample',
      label: 'sample',
    });

    render(
      <WorkspaceSessionProvider>
        <OrganisationPage />
      </WorkspaceSessionProvider>,
    );

    await user.type(screen.getByLabelText('Display name'), 'Returns desk');
    await user.click(screen.getByRole('button', { name: 'Add a team' }));

    expect(screen.getByText(/team added to this workspace session/i)).toBeTruthy();
    expect(screen.getAllByText('Returns desk').length).toBeGreaterThan(0);

    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: { spec: { teams: Array<{ displayName: string }> } };
    };
    expect(parsed.spec.spec.teams.some((team) => team.displayName === 'Returns desk')).toBe(true);
  });
});
