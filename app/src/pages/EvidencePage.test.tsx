import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { takeDecisionNoteMeasured } from '../application/decisionNoteSeed';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { EvidencePage } from './EvidencePage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/evidence', setLocation] as const,
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

function seedSession(spec: Parameters<typeof sessionWithBaseline>[0]) {
  sessionStorage.setItem(
    'steerco.workspace-session',
    JSON.stringify(sessionWithBaseline(spec, 'sample', 'sample')),
  );
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
});

describe('EvidencePage', () => {
  it('shows sample banner and promise hit learning cue', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <EvidencePage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('evidence-page')).toBeTruthy();
    expect(screen.getByTestId('evidence-sample-banner').textContent).toMatch(/sample data/i);
    expect(screen.getByText(/climbing, still short of the target band/i)).toBeTruthy();
    expect(screen.getByText('91%')).toBeTruthy();
  });

  it('stashes all measured lines and navigates to decision notes', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <EvidencePage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getByTestId('evidence-use-all'));
    expect(setLocation).toHaveBeenCalledWith('/workspace/decisions');
    const lines = takeDecisionNoteMeasured();
    expect(lines?.some((line) => /promise hit rate/i.test(line))).toBe(true);
  });
});
