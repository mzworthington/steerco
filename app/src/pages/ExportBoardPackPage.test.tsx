import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { WorkspaceSessionProvider, sessionWithBaseline } from '../workspace/WorkspaceSession';
import { ExportBoardPackPage } from './ExportBoardPackPage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace/export', setLocation] as const,
  };
});

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function seedSession(spec: Parameters<typeof sessionWithBaseline>[0]) {
  sessionStorage.setItem(
    'steerlens.workspace-session',
    JSON.stringify(sessionWithBaseline(spec, 'sample', 'sample')),
  );
}

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  sessionStorage.clear();
});

describe('ExportBoardPackPage', () => {
  it('previews decision notes and omits organisation when unchecked', async () => {
    const user = userEvent.setup();
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    seedSession(opened.value);

    render(
      <WorkspaceSessionProvider>
        <ExportBoardPackPage />
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByTestId('export-board-pack-page')).toBeTruthy();
    expect(screen.getByTestId('export-section-decisions').textContent).toMatch(/loyalty/i);
    expect(screen.getByTestId('export-section-organisation')).toBeTruthy();
    expect(screen.getAllByText('Invest').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Adapt').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('checkbox', { name: /how work is organised/i }));
    expect(screen.queryByTestId('export-section-organisation')).toBeNull();
    expect(screen.getByTestId('export-section-decisions')).toBeTruthy();
  });
});
