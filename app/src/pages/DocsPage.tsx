import {
  Children,
  isValidElement,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRoute } from 'wouter';
import { DocsFrontmatterMeta } from '../components/DocsFrontmatterMeta';
import { DocsSidebar } from '../components/DocsSidebar';
import {
  NavDrawerBackdrop,
  NavDrawerToggle,
  useNavDrawerEffects,
} from '../components/NavDrawerChrome';
import { DOC_SLUGS, findDocPage } from '../docs/pages';
import { splitDocsMarkdown } from '../docs/presentDocsMarkdown';
import { resolveDocsHref } from '../docs/resolveDocsHref';
import { useLgUp } from '../hooks/useMediaQuery';
import { DesignSystemPage } from './DesignSystemPage';

const MermaidPreview = lazy(() =>
  import('../components/MermaidPreview').then((m) => ({ default: m.MermaidPreview })),
);

const DOCS_NAV_ID = 'docs-nav-drawer';

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
  const [navOpen, setNavOpen] = useState(false);
  const desktop = useLgUp();
  const drawerOpen = desktop || navOpen;

  useEffect(() => {
    setNavOpen(false);
  }, [slug]);

  useEffect(() => {
    if (desktop) setNavOpen(false);
  }, [desktop]);

  useNavDrawerEffects({
    open: navOpen,
    onClose: () => setNavOpen(false),
    desktop,
  });

  const closeNav = () => setNavOpen(false);

  return (
    <article className="docs-layout" data-testid="docs">
      <div className="docs-mobile-bar" data-testid="docs-mobile-bar">
        <NavDrawerToggle
          open={navOpen}
          onToggle={() => setNavOpen((value) => !value)}
          controlsId={DOCS_NAV_ID}
          label="Open documentation navigation"
        />
        <p className="docs-mobile-bar-label">Documentation</p>
      </div>

      <NavDrawerBackdrop open={!desktop && navOpen} onClose={closeNav} />

      <DocsSidebar
        id={DOCS_NAV_ID}
        activeHref={activeHref}
        open={drawerOpen}
        onNavigate={closeNav}
        showClose={!desktop}
        isInert={!desktop && !navOpen}
      />

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
