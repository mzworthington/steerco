import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { SteeringOverviewPage } from './SteeringOverviewPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/steering', setLocation] as const,
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

describe('SteeringOverviewPage', () => {
  it('renders sample bets with distinct status words', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <SteeringOverviewPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('steering-overview')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /northwind q3 alignment/i })).toBeTruthy();
    expect(screen.getByText(/one recommended to stop\. three bets funded\./i)).toBeTruthy();
    expect(screen.getAllByText('On track').length).toBeGreaterThan(0);
    expect(screen.getAllByText('At risk').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Stop').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /loyalty ledger unification/i })).toBeTruthy();
  });
});
