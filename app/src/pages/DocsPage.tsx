import { Children, isValidElement, lazy, Suspense, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoute } from 'wouter';
import { DocsFrontmatterMeta } from '../components/DocsFrontmatterMeta';
import { DocsSidebar } from '../components/DocsSidebar';
import { DOC_SLUGS, findDocPage } from '../docs/pages';
import { splitDocsMarkdown } from '../docs/presentDocsMarkdown';
import { resolveDocsHref } from '../docs/resolveDocsHref';
import { DesignSystemPage } from './DesignSystemPage';

const MermaidPreview = lazy(() =>
  import('../components/MermaidPreview').then((m) => ({ default: m.MermaidPreview })),
);

function extractCodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractCodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractCodeText(node.props.children);
  }
  return '';
}

function hrefForDocSlug(slug: string): string {
  return slug === '' || slug === 'overview' ? '/docs' : `/docs/${slug}`;
}

export function DocsPage() {
  const [, params] = useRoute('/docs/*');
  const slug = params?.['*'] ?? '';
  const page = findDocPage(slug);
  const fromSlug = page.slug || 'overview';
  const activeHref = hrefForDocSlug(fromSlug);
  const { frontmatter, body } = splitDocsMarkdown(page.markdown);

  return (
    <article className="docs-layout" data-testid="docs">
      <DocsSidebar activeHref={activeHref} />
      <div className="docs-content">
        {page.slug === 'design-system' ? (
          <DesignSystemPage />
        ) : (
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
        )}
      </div>
    </article>
  );
}
