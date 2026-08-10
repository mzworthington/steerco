import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkspaceSessionProvider } from './WorkspaceSession';
import { WorkspaceShell } from './WorkspaceShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe('WorkspaceShell', () => {
  it('links to the product guide from the sidebar footer', () => {
    render(
      <WorkspaceSessionProvider>
        <WorkspaceShell>
          <div>content</div>
        </WorkspaceShell>
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByRole('link', { name: /product guide/i }).getAttribute('href')).toBe(
      '/docs/product-guide',
    );
  });

  it('disables section nav until a workspace session exists', () => {
    render(
      <WorkspaceSessionProvider>
        <WorkspaceShell>
          <div>content</div>
        </WorkspaceShell>
      </WorkspaceSessionProvider>,
    );

    expect(screen.getByRole('link', { name: /^home$/i })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /steering overview/i })).toBeNull();
    expect(screen.getByText('Steering overview').getAttribute('aria-disabled')).toBe('true');
    expect(screen.getByTestId('workspace-nav-hint')).toBeTruthy();
  });
});
