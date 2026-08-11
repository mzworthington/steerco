import architecture from '../../../docs/architecture.md?raw';
import designPack from '../../../docs/design-pack.md?raw';
import designSystem from '../../../docs/design-system.md?raw';
import overview from '../../../docs/overview.md?raw';
import productGuide from '../../../docs/product-guide.md?raw';
import quality from '../../../docs/quality.md?raw';
import setup from '../../../docs/setup.md?raw';
import steerbetsOverlay from '../../../docs/steerbets-overlay.md?raw';
import techStack from '../../../docs/tech-stack.md?raw';
import workflows from '../../../docs/workflows.md?raw';
import adrIndex from '../../../docs/ADRs/README.md?raw';
import adr0001 from '../../../docs/ADRs/0001-cloudflare-pages-pulumi-wrangler.md?raw';
import adr0002 from '../../../docs/ADRs/0002-tech-stack.md?raw';
import adr0003 from '../../../docs/ADRs/0003-local-first-no-auth.md?raw';
import adr0004 from '../../../docs/ADRs/0004-suite-relationship-archlens.md?raw';
import adr0005 from '../../../docs/ADRs/0005-provider-teams-reference-only.md?raw';
import adr0006 from '../../../docs/ADRs/0006-steerspec-name-and-kinded-refs.md?raw';
import adr0007 from '../../../docs/ADRs/0007-mermaid-docs-react-flow-product-graphs.md?raw';
import { titleFromMarkdown } from './presentDocsMarkdown';

export type DocSection = 'product' | 'build';

export type DocPage = {
  slug: string;
  title: string;
  markdown: string;
  section: DocSection;
  /** When false, registered for routing but omitted from the sidebar. */
  nav?: boolean;
};

export type DocNavEntry = {
  href: string;
  title: string;
};

export type DocNavSection = {
  id: DocSection;
  title: string;
  entries: DocNavEntry[];
};

function adrPage(stem: string, markdown: string): DocPage {
  return {
    slug: `adrs/${stem}`,
    title: titleFromMarkdown(markdown, stem),
    markdown,
    section: 'build',
    nav: false,
  };
}

const ADR_PAGES: DocPage[] = [
  adrPage('0001-cloudflare-pages-pulumi-wrangler', adr0001),
  adrPage('0002-tech-stack', adr0002),
  adrPage('0003-local-first-no-auth', adr0003),
  adrPage('0004-suite-relationship-archlens', adr0004),
  adrPage('0005-provider-teams-reference-only', adr0005),
  adrPage('0006-steerspec-name-and-kinded-refs', adr0006),
  adrPage('0007-mermaid-docs-react-flow-product-graphs', adr0007),
];

const TOP_LEVEL: DocPage[] = [
  { slug: '', title: 'Overview', markdown: overview, section: 'product', nav: false },
  { slug: 'overview', title: 'Overview', markdown: overview, section: 'product', nav: false },
  { slug: 'product-guide', title: 'Product guide', markdown: productGuide, section: 'product' },
  {
    slug: 'steerbets-overlay',
    title: 'SteerBet overlay',
    markdown: steerbetsOverlay,
    section: 'build',
  },
  { slug: 'setup', title: 'Setup', markdown: setup, section: 'build' },
  { slug: 'architecture', title: 'Architecture', markdown: architecture, section: 'build' },
  { slug: 'tech-stack', title: 'Tech stack', markdown: techStack, section: 'build' },
  { slug: 'quality', title: 'Quality', markdown: quality, section: 'build' },
  { slug: 'workflows', title: 'Workflows', markdown: workflows, section: 'build' },
  { slug: 'design-system', title: 'Design system', markdown: designSystem, section: 'build' },
  { slug: 'design-pack', title: 'Design pack', markdown: designPack, section: 'build' },
  { slug: 'adrs', title: 'ADRs', markdown: adrIndex, section: 'build' },
];

const DOC_PAGES: DocPage[] = [...TOP_LEVEL, ...ADR_PAGES];

export const DOC_SLUGS = new Set(DOC_PAGES.map((page) => page.slug));

function hrefForSlug(slug: string): string {
  return slug === '' ? '/docs' : `/docs/${slug}`;
}

/** Sidebar groups - Product first; build docs are secondary. */
export function docsNavSections(): DocNavSection[] {
  const productEntries: DocNavEntry[] = [
    { href: '/docs', title: 'Overview' },
    ...DOC_PAGES.filter((page) => page.section === 'product' && page.nav !== false).map((page) => ({
      href: hrefForSlug(page.slug),
      title: page.title,
    })),
  ];

  const buildEntries: DocNavEntry[] = DOC_PAGES.filter(
    (page) => page.section === 'build' && page.nav !== false && !page.slug.includes('/'),
  ).map((page) => ({
    href: hrefForSlug(page.slug),
    title: page.title,
  }));

  return [
    { id: 'product', title: 'Product', entries: productEntries },
    { id: 'build', title: 'Build & ops', entries: buildEntries },
  ];
}

export function findDocPage(slug: string | undefined): DocPage {
  const key = (slug ?? '').replace(/^\/+|\/+$/g, '');
  return DOC_PAGES.find((page) => page.slug === key) ?? DOC_PAGES[0]!;
}
