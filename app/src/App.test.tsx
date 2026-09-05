import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <div data-testid="home" />,
}));

vi.mock('./pages/DocsPage', () => ({
  DocsPage: () => <div data-testid="docs" />,
}));

import { App } from './App';

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

describe('App routing', () => {
  it('routes /privacy to the privacy notice', () => {
    window.history.replaceState({}, '', '/privacy');
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Privacy policy' })).toBeTruthy();
  });

  it('shows the home page by default', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /skip to main content/i })).toBeTruthy();
  });

  it('redirects /design-system to /docs/design-system', () => {
    window.history.replaceState({}, '', '/design-system');
    render(<App />);
    expect(screen.getByTestId('docs')).toBeTruthy();
    expect(window.location.pathname).toBe('/docs/design-system');
  });

  it('routes nested ADR docs paths to DocsPage', () => {
    window.history.replaceState({}, '', '/docs/adrs/0005-provider-teams-reference-only');
    render(<App />);
    expect(screen.getByTestId('docs')).toBeTruthy();
    expect(screen.queryByText(/not found/i)).toBeNull();
  });
});
