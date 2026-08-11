import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBlankSteerSpec } from '../application/createBlankWorkspace';
import { WorkspaceSessionProvider } from '../workspace/WorkspaceSession';
import { WorkspaceHomePage } from './WorkspaceHomePage';

const setLocation = vi.fn();

vi.mock('wouter', async () => {
  const actual = await vi.importActual<typeof import('wouter')>('wouter');
  return {
    ...actual,
    useLocation: () => ['/workspace', setLocation] as const,
  };
});

const createNewWorkspaceFile = vi.fn();

vi.mock('../adapters/createNewWorkspaceFile', () => ({
  createNewWorkspaceFile: (...args: unknown[]) => createNewWorkspaceFile(...args),
}));

afterEach(() => {
  cleanup();
  setLocation.mockReset();
  createNewWorkspaceFile.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

describe('WorkspaceHomePage', () => {
  it('shows privacy copy and keyboard-accessible CTAs', () => {
    render(
      <WorkspaceSessionProvider>
        <WorkspaceHomePage />
      </WorkspaceSessionProvider>,
    );

    expect(
      screen.getByText(/everything stays on this device until you choose to connect systems/i),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: /open folder/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /create new file/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /start from sample/i })).toBeTruthy();
  });

  it('creates a new file and navigates to steering', async () => {
    const user = userEvent.setup();
    const blank = createBlankSteerSpec();
    createNewWorkspaceFile.mockResolvedValue({
      ok: true,
      value: blank,
      label: 'New workspace',
      method: 'download',
      persistence: { mode: 'download' },
    });

    render(
      <WorkspaceSessionProvider>
        <WorkspaceHomePage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getByRole('button', { name: /create new file/i }));

    expect(createNewWorkspaceFile).toHaveBeenCalled();
    expect(setLocation).toHaveBeenCalledWith('/workspace/steering');
    expect(sessionStorage.getItem('steerlens.workspace-session')).toMatch(/new-workspace/);
  });

  it('starts from sample and navigates to steering', async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceSessionProvider>
        <WorkspaceHomePage />
      </WorkspaceSessionProvider>,
    );

    await user.click(screen.getByRole('button', { name: /start from sample/i }));

    expect(setLocation).toHaveBeenCalledWith('/workspace/steering');
    expect(sessionStorage.getItem('steerlens.workspace-session')).toMatch(/northwind-q3-alignment/);
  });

  it('offers continue when a session is already open', async () => {
    const user = userEvent.setup();
    const { loadSampleWorkspace, SAMPLE_WORKSPACE_LABEL } =
      await import('../adapters/sampleWorkspaceLoader');
    const opened = loadSampleWorkspace();
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    sessionStorage.setItem(
      'steerlens.workspace-session',
      JSON.stringify({
        spec: opened.value,
        baselineSpec: opened.value,
        source: 'sample',
        label: SAMPLE_WORKSPACE_LABEL,
      }),
    );

    render(
      <WorkspaceSessionProvider>
        <WorkspaceHomePage />
      </WorkspaceSessionProvider>,
    );

    const continueButton = screen.getByTestId('workspace-continue');
    expect(continueButton.textContent).toMatch(/continue/i);
    await user.click(continueButton);
    expect(setLocation).toHaveBeenCalledWith('/workspace/steering');
  });
});
