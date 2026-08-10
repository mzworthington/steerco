import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { applyAddOrganisationTeam } from '../application/presentOrganisation';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
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

function seedSession(spec: Parameters<typeof sessionWithBaseline>[0], label = 'sample') {
  sessionStorage.setItem(
    'steerlens.workspace-session',
    JSON.stringify(sessionWithBaseline(spec, 'sample', label)),
  );
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

    seedSession(opened.value);

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
    expect(screen.getByText(/expected until 2026-12-31/i)).toBeTruthy();
  });

  it('surfaces operating-model mismatches', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const withUnfundedTeam = applyAddOrganisationTeam(opened.value, {
      displayName: 'Returns desk',
      role: 'stream_aligned',
    });
    expect(withUnfundedTeam.ok).toBe(true);
    if (!withUnfundedTeam.ok) return;

    seedSession(withUnfundedTeam.value);

    render(
      <WorkspaceSessionProvider>
        <OrganisationPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('organisation-mismatches')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /operating-model checks/i })).toBeTruthy();
    expect(screen.getByText(/returns desk.*not funding any bet/i)).toBeTruthy();
  });

  it('adds a team by display name into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

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

  it('adds a member to an existing team into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OrganisationPage />
      </WorkspaceSessionProvider>,
    );

    await user.type(screen.getByLabelText('Member name'), 'Nina Torres');
    await user.type(screen.getByLabelText('Title'), 'Backend Engineer');
    await user.click(screen.getByRole('button', { name: 'Add member' }));

    expect(screen.getByText(/member added to this workspace session/i)).toBeTruthy();
    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          teams: Array<{ id: string; members?: Array<{ displayName: string; title: string }> }>;
        };
      };
    };
    const hasMember = parsed.spec.spec.teams.some((team) =>
      team.members?.some((member) => member.displayName === 'Nina Torres'),
    );
    expect(hasMember).toBe(true);
  });

  it('edits an existing member into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OrganisationPage />
      </WorkspaceSessionProvider>,
    );

    const editButtons = screen.getAllByRole('button', { name: 'Edit' });
    await user.click(editButtons[0]!);

    expect(screen.getByRole('heading', { name: /edit member/i })).toBeTruthy();
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Interim Lead');
    await user.click(screen.getByRole('button', { name: 'Save member' }));

    expect(screen.getByText(/member updated in this workspace session/i)).toBeTruthy();
    expect(screen.getByText(/interim lead/i)).toBeTruthy();
  });
});
