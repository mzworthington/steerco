import { useEffect, useId, useState } from 'react';

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

let mermaidReady: Promise<MermaidApi> | undefined;

async function getMermaid(): Promise<MermaidApi> {
  mermaidReady ??= (async () => {
    const { default: mermaid } = await import('mermaid');
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'strict',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
      },
    });
    return mermaid;
  })();
  return mermaidReady;
}

type MermaidPreviewProps = {
  code: string;
};

/** Renders a Mermaid fence from docs/ADRs as an inline SVG diagram. */
export function MermaidPreview({ code }: MermaidPreviewProps) {
  const reactId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    let active = true;

    const renderDiagram = async () => {
      if (!code) return;
      setRendering(true);
      setError('');

      try {
        const mermaid = await getMermaid();
        if (!active) return;

        const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);

        if (active) {
          setSvg(renderedSvg);
          setRendering(false);
        }
      } catch {
        if (active) {
          setError('Could not render diagram.');
          setRendering(false);
        }
      }
    };

    void renderDiagram();

    return () => {
      active = false;
    };
  }, [code, reactId]);

  if (error) {
    return (
      <div
        className="docs-mermaid docs-mermaid-error"
        role="alert"
        data-testid="docs-mermaid-error"
      >
        <p>{error}</p>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  if (rendering && !svg) {
    return (
      <div className="docs-mermaid docs-mermaid-loading" aria-busy="true">
        Loading diagram…
      </div>
    );
  }

  return (
    <div
      className="docs-mermaid"
      data-testid="docs-mermaid"
      // Mermaid returns sanitized SVG for trusted docs content.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
