import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { BetDetailPage } from './BetDetailPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/bets/bet_loyalty', setLocation] as const,
    useParams: () => ({ betId: 'bet_loyalty' }),
    Link: ({
      href,
      children,
      className,
      onClick,
    }: {
      href: string;
      children: React.ReactNode;
      className?: string;
      onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
    }) => (
      <a href={href} className={className} onClick={onClick}>
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

describe('BetDetailPage', () => {
  it('shows outcome MoS context and saves edits into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <BetDetailPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('bet-detail')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /this bet should move/i })).toBeTruthy();
    expect(screen.getByText('Promise hit rate')).toBeTruthy();
    expect(screen.getByLabelText('Kill criteria')).toBeTruthy();

    const title = screen.getByLabelText('Bet title');
    await user.clear(title);
    await user.type(title, 'Loyalty ledger pause');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/saved to this workspace session/i)).toBeTruthy();
    const stored = sessionStorage.getItem('steerlens.workspace-session');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: { spec: { bets: Array<{ id: string; title: string }> } };
    };
    expect(parsed.spec.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.title).toBe(
      'Loyalty ledger pause',
    );
  });

  it('blocks save when title is empty', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <BetDetailPage />
      </WorkspaceSessionProvider>,
    );

    const title = screen.getByLabelText('Bet title');
    await user.clear(title);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/give this bet a short name/i)).toBeTruthy();
  });
});
