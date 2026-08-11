import { cleanup, render, screen, within } from '@testing-library/react';
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

  it('adds a new evidence measure onto a goal from the page', async () => {
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

    await user.click(screen.getByTestId('evidence-add-cta'));
    const form = screen.getByTestId('evidence-add-form');
    expect(form).toBeTruthy();

    await user.selectOptions(within(form).getByLabelText(/goal/i), 'out_promise');
    await user.type(within(form).getByLabelText(/^title$/i), 'Checkout conversion');
    await user.type(within(form).getByLabelText(/^unit$/i), 'percent');
    await user.type(within(form).getByLabelText(/^current$/i), '3.2');
    await user.type(within(form).getByLabelText(/^target$/i), '4');
    await user.type(within(form).getByLabelText(/what we learned/i), 'Still thin at peak hours.');
    await user.type(within(form).getByLabelText(/^note$/i), 'From weekly product review sheet');
    await user.click(within(form).getByRole('button', { name: /save evidence/i }));

    expect(screen.getByText(/evidence added/i)).toBeTruthy();
    expect(screen.getByText('Checkout conversion')).toBeTruthy();
    expect(screen.getByText(/still thin at peak hours/i)).toBeTruthy();
    expect(screen.getByText(/weekly product review sheet/i)).toBeTruthy();

    const stored = sessionStorage.getItem('steerco.workspace-session');
    const parsed = JSON.parse(stored ?? '{}') as {
      spec: {
        spec: {
          outcomes: Array<{
            id: string;
            metrics: Array<{ id: string; title: string; current?: number }>;
          }>;
          evidence: Array<{ metricId?: string | null; source: string; note?: string }>;
        };
      };
    };
    const metric = parsed.spec.spec.outcomes
      .find((outcome) => outcome.id === 'out_promise')
      ?.metrics.find((item) => item.title === 'Checkout conversion');
    expect(metric?.current).toBe(3.2);
    expect(
      parsed.spec.spec.evidence.some(
        (item) =>
          item.metricId === metric?.id &&
          item.source === 'manual' &&
          /weekly product review/i.test(item.note ?? ''),
      ),
    ).toBe(true);
  });
});
