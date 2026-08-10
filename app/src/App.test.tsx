import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_STORAGE_KEY } from './siteGate';

vi.mock('./pages/HomePage', () => ({
  HomePage: () => <div data-testid="home" />,
}));

vi.mock('./pages/DocsPage', () => ({
  DocsPage: () => <div data-testid="docs" />,
}));

vi.mock('./pages/DesignSystemPage', () => ({
  DesignSystemPage: () => <div data-testid="design-system" />,
}));

import { App } from './App';

afterEach(() => {
  cleanup();
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  window.history.replaceState({}, '', '/');
});

describe('App site gate', () => {
  it('shows the Coming Soon splash by default', () => {
    render(<App />);
    expect(screen.getByTestId('coming-soon')).toBeTruthy();
    expect(screen.queryByTestId('home')).toBeNull();
  });

  it('shows the site when preview=1 is in the query string', () => {
    window.history.replaceState({}, '', '/?preview=1');
    render(<App />);
    expect(screen.queryByTestId('coming-soon')).toBeNull();
    expect(screen.getByTestId('home')).toBeTruthy();
  });
});
