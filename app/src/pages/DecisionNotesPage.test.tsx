import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { DecisionNotesPage } from './DecisionNotesPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/decisions', setLocation] as const,
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

describe('DecisionNotesPage', () => {
  it('shows the sample stop note and MoS helper copy', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <DecisionNotesPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('decision-notes-page')).toBeTruthy();
    expect(screen.getByDisplayValue(/stop loyalty ledger unification/i)).toBeTruthy();
    expect(screen.getByText(/prefer measures of success/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /promise hit rate/i })).toBeTruthy();
  });

  it('groups affected teams by domain and filters via search', async () => {
    const user = userEvent.setup({ delay: null });
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <DecisionNotesPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('decision-affected-groups')).toBeTruthy();
    expect(screen.getByText(/^commerce$/i)).toBeTruthy();
    expect(screen.getByText(/^shared support$/i)).toBeTruthy();
    expect(screen.getByTestId('decision-affected-count').textContent).toMatch(/3 teams selected/i);

    await user.type(screen.getByTestId('decision-affected-search'), 'loyalty');
    expect(screen.getByLabelText(/loyalty experience/i)).toBeTruthy();
    expect(screen.queryByLabelText(/storefront experience/i)).toBeNull();
  });

  it('saves measured bullet edits into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <DecisionNotesPage />
      </WorkspaceSessionProvider>,
    );

    const measured = screen.getByLabelText('Measured bullets');
    await user.clear(measured);
    await user.type(measured, 'Promise hit rate still flat\nShared wait time up');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/saved decision note/i)).toBeTruthy();
    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: { spec: { decisionNotes: Array<{ measured: string[] }> } };
    };
    expect(parsed.spec.spec.decisionNotes[0]?.measured).toEqual([
      'Promise hit rate still flat',
      'Shared wait time up',
    ]);
  });

  it('checks a measured metric when its suggestion chip is clicked', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <DecisionNotesPage />
      </WorkspaceSessionProvider>,
    );

    const cycleCheckbox = screen.getByRole('checkbox', { name: 'Promise-to-fulfilil days' });
    expect(cycleCheckbox).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: /promise-to-fulfilil days/i }));

    expect(cycleCheckbox).toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: { spec: { decisionNotes: Array<{ measuredMetricIds: string[] }> } };
    };
    expect(parsed.spec.spec.decisionNotes[0]?.measuredMetricIds).toEqual(
      expect.arrayContaining(['met_promise_hit', 'met_shared_wait', 'met_cycle_days']),
    );
  });

  it('toggles a measured metric checkbox directly', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <DecisionNotesPage />
      </WorkspaceSessionProvider>,
    );

    const sharedWaitCheckbox = screen.getByRole('checkbox', { name: 'Shared-service wait time' });
    expect(sharedWaitCheckbox).toBeChecked();

    await user.click(sharedWaitCheckbox);
    expect(sharedWaitCheckbox).not.toBeChecked();
  });
});
