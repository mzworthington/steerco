import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { ProductsPage } from './ProductsPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/products', setLocation] as const,
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

describe('ProductsPage', () => {
  it('lists product briefs and saves a new brief linked to goals and bets', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <ProductsPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('products-page')).toBeTruthy();
    expect(screen.getByText('Customer promises')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /add brief/i }));
    const editor = screen.getByTestId('products-edit');
    expect(editor).toBeTruthy();

    await user.type(screen.getByLabelText('Title'), 'Checkout continuity');
    await user.type(screen.getByLabelText('Problem'), 'Shoppers abandon when promises slip');

    const outcomes = screen.getByTestId('products-outcomes');
    expect(
      within(outcomes).getByRole('checkbox', { name: /reliable customer promises/i }),
    ).toBeChecked();

    const bets = screen.getByTestId('products-bets');
    await user.click(within(bets).getByRole('checkbox', { name: /same-day pickup reliability/i }));
    await user.click(screen.getByRole('button', { name: /save brief/i }));

    expect(screen.getByText(/saved product brief to this workspace session/i)).toBeTruthy();
    expect(screen.getByText('Checkout continuity')).toBeTruthy();

    const stored = sessionStorage.getItem('steerco.workspace-session');
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
