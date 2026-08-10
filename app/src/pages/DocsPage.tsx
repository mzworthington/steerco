import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoute } from 'wouter';
import { DocsFrontmatterMeta } from '../components/DocsFrontmatterMeta';
import { docsNavPages, DOC_SLUGS, findDocPage } from '../docs/pages';
import { splitDocsMarkdown } from '../docs/presentDocsMarkdown';
import { resolveDocsHref } from '../docs/resolveDocsHref';

const DOC_NAV = [
  { href: '/docs', title: 'Overview' },
  ...docsNavPages().map((entry) => ({
    href: `/docs/${entry.slug}`,
    title: entry.title,
  })),
];

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
            }}
          >
            {body}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
