import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { WorkspaceSessionProvider } from './WorkspaceSession';
import { WorkspaceShell } from './WorkspaceShell';

function stubMatchMedia(lgUp: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: lgUp ? query.includes('min-width: 1024px') : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  document.body.style.overflow = '';
  stubMatchMedia(true);
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

  it('exposes a mobile navigation toggle that opens and closes the drawer', async () => {
    const user = userEvent.setup();
    stubMatchMedia(false);

    render(
      <WorkspaceSessionProvider>
        <WorkspaceShell>
          <div>content</div>
        </WorkspaceShell>
      </WorkspaceSessionProvider>,
    );

    const toggle = screen.getByTestId('nav-drawer-toggle');
    const drawer = screen.getByTestId('workspace-nav-drawer');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.className).not.toContain('is-open');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.className).toContain('is-open');
    expect(screen.getByTestId('nav-drawer-backdrop')).toBeTruthy();

    await user.click(screen.getByTestId('nav-drawer-close'));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.className).not.toContain('is-open');
  });
});
