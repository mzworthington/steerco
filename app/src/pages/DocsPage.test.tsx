import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocsPage } from './DocsPage';

vi.mock('../components/MermaidPreview', () => ({
  MermaidPreview: ({ code }: { code: string }) => <div data-testid="docs-mermaid">{code}</div>,
}));

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
  window.history.replaceState({}, '', '/');
  stubMatchMedia(true);
  document.body.style.overflow = '';
});

describe('DocsPage mermaid fences', () => {
  it('renders ADR mermaid blocks via MermaidPreview', async () => {
    window.history.replaceState({}, '', '/docs/adrs/0002-tech-stack');
    render(<DocsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('docs-mermaid')).toBeInTheDocument();
    });
    expect(screen.getByTestId('docs-mermaid').textContent).toContain('flowchart LR');
    expect(screen.queryByText(/```mermaid/)).not.toBeInTheDocument();
  });
});

describe('DocsPage design system', () => {
  it('renders the live showcase inside the docs shell', () => {
    window.history.replaceState({}, '', '/docs/design-system');
    render(<DocsPage />);

    expect(screen.getByTestId('docs')).toBeTruthy();
    expect(screen.getByTestId('design-system')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Build & ops' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1, name: 'Design system' })).toBeTruthy();
  });
});

describe('DocsPage mobile navigation', () => {
  it('opens the documentation drawer from the mobile bar', async () => {
    const user = userEvent.setup();
    stubMatchMedia(false);

    window.history.replaceState({}, '', '/docs');
    render(<DocsPage />);

    expect(screen.getByTestId('docs-mobile-bar')).toBeTruthy();
    const toggle = screen.getByTestId('nav-drawer-toggle');
    const drawer = screen.getByTestId('docs-nav-drawer');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.className).not.toContain('is-open');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.className).toContain('is-open');
    expect(screen.getByRole('navigation', { name: 'Build & ops' })).toBeTruthy();
  });
});
