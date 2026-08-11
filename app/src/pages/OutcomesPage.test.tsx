import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { OutcomesPage } from './OutcomesPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/outcomes', setLocation] as const,
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

describe('OutcomesPage', () => {
  it('shows MoS framing, value tree, hero measures, and bet rows', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OutcomesPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('outcomes-page')).toBeTruthy();
    expect(screen.getByTestId('outcomes-value-tree')).toBeTruthy();
    expect(screen.getByTestId('value-tree-vision')).toBeTruthy();
    expect(screen.getByTestId('value-tree-canvas')).toBeTruthy();
    expect(screen.getByTestId('value-tree-detail')).toBeTruthy();
    expect(screen.getByText(/measures of success for this outcome/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /reliable customer promises/i })).toBeTruthy();
    expect(screen.getByText('91%')).toBeTruthy();
    expect(screen.getAllByText(/claimed by/i).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: /same-day pickup reliability/i }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('link', { name: /loyalty ledger unification/i }).length,
    ).toBeGreaterThan(0);
  });

  it('edits a measure current value into the session', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OutcomesPage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getAllByRole('button', { name: /edit current \/ target/i })[0]!);
    const current = screen.getByLabelText('Current');
    await user.clear(current);
    await user.type(current, '93');
    await user.click(screen.getByRole('button', { name: /save measure/i }));

    expect(screen.getByText(/saved measure to this workspace session/i)).toBeTruthy();
    expect(screen.getByText('93%')).toBeTruthy();

    const stored = sessionStorage.getItem('steerlens.workspace-session');
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

  it('switches Lean Value Tree orientation and selects nodes for detail', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OutcomesPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('value-tree-detail').textContent).toMatch(/investment vision/i);

    await user.click(screen.getByTestId('value-tree-orient-lr'));
    expect(screen.getByTestId('value-tree-orient-lr')).toHaveAttribute('aria-pressed', 'true');

    const outline = screen.getByTestId('value-tree-outline');
    await user.click(within(outline).getByText(/same-day pickup reliability/i));
    expect(screen.getByTestId('value-tree-detail').textContent).toMatch(/open bet/i);

    await user.click(screen.getByTestId('value-tree-expand'));
    expect(screen.getByTestId('outcomes-value-tree')).toHaveAttribute('data-expanded', 'true');
    expect(screen.queryByTestId('value-tree-outline')).toBeNull();
    await user.click(screen.getByTestId('value-tree-expand'));
    expect(screen.getByTestId('outcomes-value-tree')).toHaveAttribute('data-expanded', 'false');
  });

  it('links outcomes and bets by checkbox when saving a product brief', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <OutcomesPage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getByRole('button', { name: /add product/i }));
    const editor = screen.getByTestId('outcomes-product-edit');
    expect(editor).toBeTruthy();

    await user.type(screen.getByLabelText('Title'), 'Checkout continuity');
    await user.type(screen.getByLabelText('Problem'), 'Shoppers abandon when promises slip');

    const outcomes = screen.getByTestId('outcomes-product-outcomes');
    expect(
      within(outcomes).getByRole('checkbox', { name: /reliable customer promises/i }),
    ).toBeChecked();

    const bets = screen.getByTestId('outcomes-product-bets');
    await user.click(within(bets).getByRole('checkbox', { name: /same-day pickup reliability/i }));
    await user.click(screen.getByRole('button', { name: /save brief/i }));

    expect(screen.getByText(/saved product brief to this workspace session/i)).toBeTruthy();
    expect(screen.getByText('Checkout continuity')).toBeTruthy();

    const stored = sessionStorage.getItem('steerlens.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          products?: Array<{
            title: string;
            outcomeIds: string[];
            betIds: string[];
          }>;
        };
      };
    };
    const saved = parsed.spec.spec.products?.find((item) => item.title === 'Checkout continuity');
    expect(saved?.outcomeIds.length).toBeGreaterThan(0);
    expect(saved?.betIds).toContain('bet_pickup');
  });
});
