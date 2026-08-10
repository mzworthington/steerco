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
