/**
 * Resolve a Markdown href to an in-app `/docs/...` path when it targets a
 * registered docs page (including nested ADR slugs).
 */
export function resolveDocsHref(
  href: string | undefined,
  fromSlug: string,
  knownSlugs: ReadonlySet<string>,
): string | null {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || /^[a-z]+:\/\//i.test(href)) {
    return null;
  }

  let target = href.split('#')[0] ?? href;
  if (target.endsWith('.html')) {
    target = target.replace(/\.html$/, '');
  }

  let joined: string;
  if (target.startsWith('/docs/') || target === '/docs') {
    joined = target.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  } else if (target.startsWith('/')) {
    return null;
  } else {
    const baseSegments = resolutionBaseSegments(fromSlug, knownSlugs);
    for (const part of target.split('/')) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        baseSegments.pop();
        continue;
      }
      baseSegments.push(normalizeDocsSegment(part));
    }
    joined = baseSegments.join('/');
    joined = joined.replace(/\.md$/i, '');
  }

  joined = joined
    .split('/')
    .map((segment) => normalizeDocsSegment(segment))
    .join('/');

  if (joined.endsWith('/README') || joined === 'README') {
    joined = joined.replace(/\/?README$/i, '') || 'adrs';
  }
  if (joined.endsWith('/index')) {
    joined = joined.slice(0, -'/index'.length);
  }

  const slug = joined.replace(/^\/+|\/+$/g, '');
  if (slug === '' || knownSlugs.has(slug)) {
    return slug === '' ? '/docs' : `/docs/${slug}`;
  }
  return null;
}

/** Folder names in repo Markdown may differ in case from in-app slugs. */
function normalizeDocsSegment(segment: string): string {
  if (segment.toLowerCase() === 'adrs') return 'adrs';
  return segment.replace(/\.md$/i, '');
}

/**
 * Relative links resolve from the current page's directory.
 * Directory-index pages (e.g. `adrs` with children `adrs/0001-…`) keep their slug as the base.
 * Nested pages (e.g. `adrs/0006-…`) use the parent directory so `./sibling.md` works.
 * Top-level pages (e.g. `tech-stack`) resolve from the docs root so `./ADRs/0002-….md` works.
 */
function resolutionBaseSegments(fromSlug: string, knownSlugs: ReadonlySet<string>): string[] {
  const parts = fromSlug.split('/').filter(Boolean).map(normalizeDocsSegment);
  if (parts.length === 0) return [];

  const prefix = parts.join('/');
  const isDirectoryIndex = [...knownSlugs].some((slug) => slug.startsWith(`${prefix}/`));

  if (isDirectoryIndex) return parts;
  if (parts.length === 1) return [];
  return parts.slice(0, -1);
}
