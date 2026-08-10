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
    const baseSegments = fromSlug ? fromSlug.split('/').filter(Boolean) : [];
    for (const part of target.split('/')) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        baseSegments.pop();
        continue;
      }
      baseSegments.push(part);
    }
    joined = baseSegments.join('/');
    joined = joined.replace(/\.md$/i, '');
  }

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
