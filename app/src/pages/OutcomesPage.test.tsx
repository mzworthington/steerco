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

function seedSession(session: WorkspaceSessionState) {
  sessionStorage.setItem('steerlens.workspace-session', JSON.stringify(session));
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
});

describe('OutcomesPage', () => {
  it('shows MoS framing, hero measures, and bet rows', () => {
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
        <OutcomesPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('outcomes-page')).toBeTruthy();
    expect(screen.getByText(/measures of success for this outcome/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /reliable customer promises/i })).toBeTruthy();
    expect(screen.getByText('91%')).toBeTruthy();
    expect(screen.getByRole('link', { name: /same-day pickup reliability/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /loyalty ledger unification/i })).toBeTruthy();
  });

  it('edits a measure current value into the session', async () => {
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
});
