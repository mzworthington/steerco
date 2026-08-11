import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { GoalsPage } from './GoalsPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/goals', setLocation] as const,
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
    'steerco.workspace-session',
    JSON.stringify(sessionWithBaseline(spec, 'sample', label)),
  );
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
});

describe('GoalsPage', () => {
  it('shows MoS framing, value tree, and vision detail by default', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('goals-page')).toBeTruthy();
    expect(screen.getByTestId('goals-value-tree')).toBeTruthy();
    expect(screen.getByTestId('value-tree-canvas')).toBeTruthy();
    expect(screen.queryByTestId('value-tree-vision')).toBeNull();
    expect(screen.queryByTestId('value-tree-detail')).toBeNull();
    expect(screen.getByTestId('goals-selection')).toBeTruthy();
    expect(screen.getByTestId('goals-vision-detail')).toBeTruthy();
    expect(screen.getByTestId('goals-vision-facts')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /investment vision/i })).toBeTruthy();
    expect(screen.getByText(/measures of success for this goal/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /add product/i })).toBeNull();
  });

  it('shows goal measures, bets, and only linked product briefs when a goal node is selected', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    const goalNodes = screen.getAllByTestId('value-tree-node-goal');
    fireEvent.click(goalNodes[0]!);

    expect(screen.getByTestId('goals-goal-detail')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /reliable customer promises/i })).toBeTruthy();
    expect(screen.getByText('91%')).toBeTruthy();
    expect(screen.getAllByText(/claimed by/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: /same-day pickup reliability/i }).length,
    ).toBeGreaterThan(0);

    const linked = screen.getByTestId('goals-linked-products');
    expect(linked).toBeTruthy();
    expect(screen.getByText('Customer promises')).toBeTruthy();
    expect(screen.getByRole('link', { name: /manage briefs/i })).toHaveAttribute(
      'href',
      '/workspace/products',
    );
  });

  it('opens bet detail in a modal from the tree without navigating away', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    fireEvent.click(screen.getAllByTestId('value-tree-node-bet')[0]!);
    expect(screen.getByTestId('goals-bet-detail')).toBeTruthy();

    await user.click(screen.getByTestId('goals-open-bet'));
    expect(screen.getByTestId('bet-detail-modal')).toBeTruthy();
    expect(screen.getByTestId('bet-detail')).toBeTruthy();
    expect(setLocation).not.toHaveBeenCalledWith(expect.stringMatching(/\/workspace\/bets\//));

    await user.click(screen.getByRole('button', { name: /^close$/i }));
    expect(screen.queryByTestId('bet-detail-modal')).toBeNull();
    expect(screen.getByTestId('goals-page')).toBeTruthy();
  });

  it('opens bet detail in a modal from a linked product brief bet', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    fireEvent.click(screen.getAllByTestId('value-tree-node-goal')[0]!);
    const productBets = screen.getAllByTestId('goals-product-bet');
    expect(productBets.length).toBeGreaterThan(0);

    await user.click(productBets[0]!);
    expect(screen.getByTestId('bet-detail-modal')).toBeTruthy();
    expect(screen.getByTestId('bet-detail')).toBeTruthy();
    expect(setLocation).not.toHaveBeenCalledWith(expect.stringMatching(/\/workspace\/bets\//));
  });

  it('edits a measure current value into the session from a selected goal', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    fireEvent.click(screen.getAllByTestId('value-tree-node-goal')[0]!);

    await user.click(screen.getAllByRole('button', { name: /edit current \/ target/i })[0]!);
    const current = screen.getByLabelText('Current');
    await user.clear(current);
    await user.type(current, '93');
    await user.click(screen.getByRole('button', { name: /save measure/i }));

    expect(screen.getByText(/saved measure to this workspace session/i)).toBeTruthy();
    expect(screen.getByText('93%')).toBeTruthy();

    const stored = sessionStorage.getItem('steerco.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          outcomes: Array<{ metrics: Array<{ id: string; current: number }> }>;
        };
      };
    };
    expect(
      parsed.spec.spec.outcomes[0]?.metrics.find((metric) => metric.id === 'met_promise_hit')
        ?.current,
    ).toBe(93);
  });

  it('renders the Lean Value Tree without expand or orientation controls', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <GoalsPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.queryByTestId('value-tree-orient')).toBeNull();
    expect(screen.queryByTestId('value-tree-vision')).toBeNull();
    expect(screen.queryByTestId('value-tree-expand')).toBeNull();
    expect(screen.getByTestId('value-tree-canvas')).toBeTruthy();
  });
});
