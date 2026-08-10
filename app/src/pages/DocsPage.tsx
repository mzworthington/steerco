import { Children, isValidElement, lazy, Suspense, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoute } from 'wouter';
import { DocsFrontmatterMeta } from '../components/DocsFrontmatterMeta';
import { docsNavPages, DOC_SLUGS, findDocPage } from '../docs/pages';
import { splitDocsMarkdown } from '../docs/presentDocsMarkdown';
import { resolveDocsHref } from '../docs/resolveDocsHref';

const MermaidPreview = lazy(() =>
  import('../components/MermaidPreview').then((m) => ({ default: m.MermaidPreview })),
);

const DOC_NAV = [
  { href: '/docs', title: 'Overview' },
  ...docsNavPages().map((entry) => ({
    href: `/docs/${entry.slug}`,
    title: entry.title,
  })),
];

function extractCodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractCodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractCodeText(node.props.children);
  }
  return '';
}

export function DocsPage() {
  const [, params] = useRoute('/docs/*');
  const slug = params?.['*'] ?? '';
  const page = findDocPage(slug);
  const fromSlug = page.slug || 'overview';
  const { frontmatter, body } = splitDocsMarkdown(page.markdown);

  return (
    <article className="docs-layout" data-testid="docs">
      <aside className="docs-sidebar">
        <h2 className="docs-sidebar-title">Documentation</h2>
        <ul className="docs-nav">
          {DOC_NAV.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href}>{entry.title}</a>
            </li>
          ))}
        </ul>
      </aside>
      <div className="docs-content">
        <div className="prose-docs">
          {frontmatter ? <DocsFrontmatterMeta fields={frontmatter} /> : null}
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const resolved = resolveDocsHref(href, fromSlug, DOC_SLUGS);
                if (resolved) {
                  return <a href={resolved}>{children}</a>;
                }
                return (
                  <a
                    href={href}
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={href?.startsWith('http') ? 'noreferrer' : undefined}
                  >
                    {children}
                  </a>
                );
              },
              pre: ({ children }) => {
                const codeEl = Children.toArray(children).find((child) => isValidElement(child));
                const className =
                  isValidElement<{ className?: string }>(codeEl) && codeEl.props.className
                    ? codeEl.props.className
                    : '';
                if (/\blanguage-mermaid\b/.test(className)) {
                  const code = extractCodeText(codeEl).replace(/\n$/, '');
                  return (
                    <Suspense
                      fallback={
                        <div className="docs-mermaid docs-mermaid-loading" aria-busy="true">
                          Loading diagram…
                        </div>
                      }
                    >
                      <MermaidPreview code={code} />
                    </Suspense>
                  );
                }
                return <pre>{children}</pre>;
              },
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
