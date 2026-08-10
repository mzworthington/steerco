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

function seedSession(session: WorkspaceSessionState) {
  sessionStorage.setItem('steerlens.workspace-session', JSON.stringify(session));
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

    seedSession({
      spec: opened.value,
      source: 'sample',
      label: 'sample',
    });

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

  it('saves measured bullet edits into the session', async () => {
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
});
