import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  cleanup();
  setLocation.mockReset();
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
    expect(screen.getByRole('button', { name: /start from sample/i })).toBeTruthy();
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
});
