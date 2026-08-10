import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MermaidPreview } from './MermaidPreview';
import mermaid from 'mermaid';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(),
  },
}));

describe('MermaidPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading then rendered SVG', async () => {
    let resolveRender: (value: { svg: string }) => void = () => undefined;
    const renderPromise = new Promise<{ svg: string }>((resolve) => {
      resolveRender = resolve;
    });
    vi.mocked(mermaid.render).mockImplementation(
      () => renderPromise as ReturnType<typeof mermaid.render>,
    );

    render(<MermaidPreview code="flowchart LR; A-->B;" />);

    expect(screen.getByText('Loading diagram…')).toBeInTheDocument();

    resolveRender({ svg: '<svg data-testid="mock-svg">diagram</svg>' });

    await waitFor(() => {
      expect(screen.getByTestId('mock-svg')).toBeInTheDocument();
    });
    expect(screen.getByTestId('docs-mermaid')).toBeInTheDocument();
  });

  it('shows an error and source when render fails', async () => {
    vi.mocked(mermaid.render).mockRejectedValue(new Error('Syntax error'));

    render(<MermaidPreview code="flowchart LR; A-->B;" />);

    await waitFor(() => {
      expect(screen.getByTestId('docs-mermaid-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Could not render diagram.')).toBeInTheDocument();
    expect(screen.getByText('flowchart LR; A-->B;')).toBeInTheDocument();
  });
});
