import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoute } from 'wouter';
import { DOC_PAGES, findDocPage } from '../docs/pages';

const DOC_NAV = [
  { href: '/docs', title: "What's included" },
  ...DOC_PAGES.filter((entry) => entry.slug !== '' && entry.slug !== 'overview').map((entry) => ({
    href: `/docs/${entry.slug}`,
    title: entry.title,
  })),
];

export function DocsPage() {
  const [, params] = useRoute('/docs/:slug*');
  const slug = params?.['slug*'];
  const page = findDocPage(slug);

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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{page.markdown}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
