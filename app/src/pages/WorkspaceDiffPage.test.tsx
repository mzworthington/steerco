import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { WorkspaceDiffPage } from './WorkspaceDiffPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/diff', setLocation] as const,
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

function seedDirtySession() {
  const opened = openWorkspaceFromYaml(sampleYaml);
  expect(opened.ok).toBe(true);
  if (!opened.ok) return null;
  const baseline = sessionWithBaseline(opened.value, 'sample', 'sample');
  const working = structuredClone(baseline.spec);
  const bet = working.spec.bets.find((item) => item.id === 'bet_loyalty');
  expect(bet).toBeTruthy();
  if (!bet) return null;
  bet.status = 'stopped';
  sessionStorage.setItem(
    'steerlens.workspace-session',
    JSON.stringify({ ...baseline, spec: working }),
  );
  return working;
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});

describe('WorkspaceDiffPage', () => {
  it('lists modified bets and can revert to baseline', async () => {
    const user = userEvent.setup();
    expect(seedDirtySession()).toBeTruthy();
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );

    render(
      <WorkspaceSessionProvider>
        <WorkspaceDiffPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('workspace-diff-page')).toBeTruthy();
    expect(screen.getByText(/loyalty ledger unification/i)).toBeTruthy();
    expect(screen.getByText(/^Modified$/i)).toBeTruthy();

    await user.click(screen.getByTestId('workspace-diff-revert'));
    expect(screen.getByTestId('workspace-diff-empty')).toBeTruthy();

    const stored = JSON.parse(sessionStorage.getItem('steerlens.workspace-session') ?? '{}') as {
      spec: { spec: { bets: Array<{ id: string; status: string }> } };
    };
    expect(stored.spec.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.status).toBe(
      'stop_ready',
    );
  });

  it('accepts the draft as the new baseline', async () => {
    const user = userEvent.setup();
    expect(seedDirtySession()).toBeTruthy();

    render(
      <WorkspaceSessionProvider>
        <WorkspaceDiffPage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getByTestId('workspace-diff-accept'));
    expect(screen.getByTestId('workspace-diff-empty')).toBeTruthy();

    const stored = JSON.parse(sessionStorage.getItem('steerlens.workspace-session') ?? '{}') as {
      spec: { spec: { bets: Array<{ id: string; status: string }> } };
      baselineSpec: { spec: { bets: Array<{ id: string; status: string }> } };
    };
    expect(stored.spec.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.status).toBe('stopped');
    expect(stored.baselineSpec.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.status).toBe(
      'stopped',
    );
  });
});
