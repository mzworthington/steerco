import { cleanup, render, screen, within } from '@testing-library/react';
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
  it('defaults to zoomed-out flow of change and can switch to as-is detail', async () => {
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

    expect(screen.getByTestId('organisation-page')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /how work is organised/i })).toBeTruthy();
    expect(screen.getByTestId('organisation-view-switch')).toBeTruthy();
    expect(screen.getByTestId('organisation-flow-overview')).toBeTruthy();
    expect(screen.getByTestId('organisation-lvt-placeholder')).toBeTruthy();
    expect(screen.queryByTestId('organisation-as-of')).toBeNull();
    expect(
      screen.getByText(/storefront experience uses as a service fulfilment platform/i),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: /prepare decision note/i })).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /^as-is$/i }));
    expect(screen.getByTestId('organisation-capacity-board')).toBeTruthy();
    expect(screen.getByTestId('organisation-flow-canvas')).toBeTruthy();
    expect(screen.getByTestId('organisation-as-of')).toBeTruthy();
    expect(screen.getByTestId('organisation-team-team_pricing')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /^domain$/i }));
    expect(screen.getByTestId('organisation-domain-zoom')).toBeTruthy();
    expect(screen.getByTestId('organisation-domain-select')).toBeTruthy();
    expect(screen.getByTestId('organisation-domain-external-edges')).toBeTruthy();
    expect(screen.getAllByText(/out of domain/i).length).toBeGreaterThan(0);
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

    await user.click(screen.getByTestId('organisation-add-team-cta'));
    const modal = screen.getByTestId('organisation-team-modal');
    expect(modal).toBeTruthy();
    await user.type(within(modal).getByLabelText('Display name'), 'Returns desk');
    await user.selectOptions(
      within(modal).getByTestId('organisation-team-modal-domain'),
      'domain_customer',
    );
    await user.selectOptions(
      within(modal).getByTestId('organisation-team-modal-stream'),
      'stream_returns',
    );
    await user.click(within(modal).getByRole('button', { name: 'Add a team' }));

    expect(screen.getByText(/team added/i)).toBeTruthy();
    expect(within(modal).getByRole('heading', { name: /edit team/i })).toBeTruthy();

    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: { teams: Array<{ displayName: string; streamIds?: string[] }> };
      };
    };
    const created = parsed.spec.spec.teams.find((team) => team.displayName === 'Returns desk');
    expect(created).toBeTruthy();
    expect(created?.streamIds).toEqual(['stream_returns']);
  });

  it('edits a team and can attach a relationship from the modal', async () => {
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

    await user.click(screen.getByRole('tab', { name: /^as-is$/i }));
    await user.click(screen.getByTestId('organisation-edit-team-team_storefront'));
    const modal = screen.getByTestId('organisation-team-modal');
    expect(modal).toBeTruthy();
    expect(within(modal).getByDisplayValue('Storefront experience')).toBeTruthy();

    await user.selectOptions(within(modal).getByLabelText('Other team'), 'team_observability');
    await user.click(within(modal).getByRole('button', { name: 'Add relationship' }));

    expect(screen.getByText(/relationship saved/i)).toBeTruthy();
    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          relationships: Array<{ fromTeamId: string; toTeamId: string; mode: string }>;
        };
      };
    };
    expect(
      parsed.spec.spec.relationships.some(
        (rel) =>
          rel.fromTeamId === 'team_storefront' &&
          rel.toTeamId === 'team_observability' &&
          rel.mode === 'x_as_a_service',
      ),
    ).toBe(true);
  });

  it('adds a person onto a team with quick add', async () => {
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

    await user.click(screen.getByRole('tab', { name: /^as-is$/i }));
    await user.click(screen.getAllByRole('button', { name: 'Add person' })[0]!);
    await user.type(screen.getByLabelText('Name'), 'Nina Torres');
    await user.click(screen.getByRole('button', { name: 'Add to team' }));

    expect(screen.getByText(/nina torres added to the team/i)).toBeTruthy();
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

  it('edits allocation for an existing person', async () => {
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

    await user.click(screen.getByRole('tab', { name: /^as-is$/i }));
    await user.click(
      screen.getByTestId('organisation-person-mem_storefront_em').querySelector('button')!,
    );
    expect(screen.getByTestId('organisation-allocation-editor')).toBeTruthy();
    await user.clear(screen.getByLabelText('Title'));
    await user.type(screen.getByLabelText('Title'), 'Interim Lead');
    await user.click(screen.getByRole('button', { name: 'Save allocation' }));

    expect(screen.getByText(/allocation updated/i)).toBeTruthy();
    expect(screen.getByDisplayValue('Interim Lead')).toBeTruthy();
  });
});
