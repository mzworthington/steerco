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
    'steerco.workspace-session',
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
    expect(screen.getAllByText('Promise hit rate').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Kill criteria')).toBeTruthy();
    expect(screen.getByTestId('bet-who-delivers')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^customer$/i })).toBeTruthy();
    expect(screen.getByLabelText('Fund Care workspace')).toBeChecked();

    const title = screen.getByLabelText('Bet title');
    await user.clear(title);
    await user.type(title, 'Loyalty ledger pause');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText(/saved to this workspace session/i)).toBeTruthy();
    const stored = sessionStorage.getItem('steerco.workspace-session');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: { spec: { bets: Array<{ id: string; title: string }> } };
    };
    expect(parsed.spec.spec.bets.find((bet) => bet.id === 'bet_loyalty')?.title).toBe(
      'Loyalty ledger pause',
    );
  });

  it('saves funding stance, kind, review timing, and metric links', async () => {
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

    await user.selectOptions(screen.getByLabelText('Funding stance'), 'explore');
    await user.selectOptions(screen.getByLabelText('Kind'), 'capability');
    await user.type(screen.getByLabelText('Review date'), '2026-11-15');
    await user.type(screen.getByLabelText('Horizon'), 'Q4 review');

    const cycleMetric = screen.getByRole('checkbox', { name: /promise-to-fulfilil days/i });
    await user.click(cycleMetric);
    await user.selectOptions(screen.getByLabelText('Primary metric'), 'met_cycle_days');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText(/saved to this workspace session/i)).toBeTruthy();

    const stored = sessionStorage.getItem('steerco.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          bets: Array<{
            id: string;
            fundingStance?: string;
            kind?: string;
            reviewDate?: string;
            horizon?: string;
            metricIds: string[];
            primaryMetricId?: string | null;
          }>;
        };
      };
    };
    const bet = parsed.spec.spec.bets.find((item) => item.id === 'bet_loyalty');
    expect(bet).toMatchObject({
      fundingStance: 'explore',
      kind: 'capability',
      reviewDate: '2026-11-15',
      horizon: 'Q4 review',
      primaryMetricId: 'met_cycle_days',
    });
    expect(bet?.metricIds).toEqual(expect.arrayContaining(['met_promise_hit', 'met_cycle_days']));
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
