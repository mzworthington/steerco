import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DocsPage } from './DocsPage';

vi.mock('../components/MermaidPreview', () => ({
  MermaidPreview: ({ code }: { code: string }) => <div data-testid="docs-mermaid">{code}</div>,
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
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
