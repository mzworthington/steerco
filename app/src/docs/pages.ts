import architecture from '../../../docs/architecture.md?raw';
import designPack from '../../../docs/design-pack.md?raw';
import designSystem from '../../../docs/design-system.md?raw';
import overview from '../../../docs/overview.md?raw';
import quality from '../../../docs/quality.md?raw';
import setup from '../../../docs/setup.md?raw';
import techStack from '../../../docs/tech-stack.md?raw';
import workflows from '../../../docs/workflows.md?raw';
import adrIndex from '../../../docs/ADRs/README.md?raw';
import adr0001 from '../../../docs/ADRs/0001-cloudflare-pages-pulumi-wrangler.md?raw';
import adr0002 from '../../../docs/ADRs/0002-tech-stack.md?raw';
import adr0003 from '../../../docs/ADRs/0003-local-first-no-auth.md?raw';
import adr0004 from '../../../docs/ADRs/0004-suite-relationship-archlens.md?raw';
import adr0005 from '../../../docs/ADRs/0005-provider-teams-reference-only.md?raw';
import { titleFromMarkdown } from './presentDocsMarkdown';

export type DocPage = {
  slug: string;
  title: string;
  markdown: string;
};

function adrPage(stem: string, markdown: string): DocPage {
  return {
    slug: `adrs/${stem}`,
    title: titleFromMarkdown(markdown, stem),
    markdown,
  };
}

const ADR_PAGES: DocPage[] = [
  adrPage('0001-cloudflare-pages-pulumi-wrangler', adr0001),
  adrPage('0002-tech-stack', adr0002),
  adrPage('0003-local-first-no-auth', adr0003),
  adrPage('0004-suite-relationship-archlens', adr0004),
  adrPage('0005-provider-teams-reference-only', adr0005),
];

const TOP_LEVEL: DocPage[] = [
  { slug: '', title: 'Overview', markdown: overview },
  { slug: 'overview', title: 'Overview', markdown: overview },
  { slug: 'workflows', title: 'Workflows', markdown: workflows },
  { slug: 'quality', title: 'Quality', markdown: quality },
  { slug: 'setup', title: 'Setup', markdown: setup },
  { slug: 'design-system', title: 'Design system', markdown: designSystem },
  { slug: 'design-pack', title: 'Design pack', markdown: designPack },
  { slug: 'tech-stack', title: 'Tech stack', markdown: techStack },
  { slug: 'architecture', title: 'Architecture', markdown: architecture },
  { slug: 'adrs', title: 'ADRs', markdown: adrIndex },
];

const DOC_PAGES: DocPage[] = [...TOP_LEVEL, ...ADR_PAGES];

export const DOC_SLUGS = new Set(DOC_PAGES.map((page) => page.slug));

/** Top-level sidebar entries (ADR detail pages are reached from the ADR index). */
export function docsNavPages(): DocPage[] {
  return DOC_PAGES.filter(
    (entry) => entry.slug !== '' && entry.slug !== 'overview' && !entry.slug.includes('/'),
  );
}

export function findDocPage(slug: string | undefined): DocPage {
  const key = (slug ?? '').replace(/^\/+|\/+$/g, '');
  return DOC_PAGES.find((page) => page.slug === key) ?? DOC_PAGES[0]!;
}
