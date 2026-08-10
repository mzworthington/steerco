import { describe, expect, it } from 'vitest';
import { DOC_SLUGS, docsNavSections, findDocPage } from './pages';
import { presentDocsMarkdown, splitDocsMarkdown } from './presentDocsMarkdown';
import { resolveDocsHref } from './resolveDocsHref';

describe('splitDocsMarkdown', () => {
  it('parses frontmatter fields and returns the body without fences', () => {
    const { frontmatter, body } = splitDocsMarkdown(
      "---\nstatus: Accepted\ndate: 2026-08-10\ndeciders: ['SteerLens']\n---\n\n# Title\n",
    );
    expect(frontmatter).toEqual({
      status: 'Accepted',
      date: '2026-08-10',
      deciders: 'SteerLens',
    });
    expect(body).toContain('# Title');
    expect(body).not.toContain('```yaml');
    expect(presentDocsMarkdown('---\nstatus: Accepted\n---\n\n# Title\n')).toBe('\n# Title\n');
  });

  it('leaves markdown without frontmatter unchanged', () => {
    expect(splitDocsMarkdown('# Hello\n')).toEqual({ frontmatter: null, body: '# Hello\n' });
  });
});

describe('docs navigation', () => {
  it('puts product pages before build & ops', () => {
    const sections = docsNavSections();
    expect(sections.map((section) => section.id)).toEqual(['product', 'build']);
    expect(sections[0]!.entries.map((entry) => entry.href)).toEqual([
      '/docs',
      '/docs/product-guide',
    ]);
    expect(sections[1]!.entries[0]!.href).toBe('/docs/setup');
  });

  it('registers the product guide', () => {
    expect(findDocPage('product-guide').title).toBe('Product guide');
    expect(findDocPage('product-guide').markdown).toContain('# Product guide');
  });
});

describe('ADR docs pages', () => {
  it('registers the ADR index and individual ADRs', () => {
    expect(findDocPage('adrs').title).toBe('ADRs');
    expect(DOC_SLUGS.has('adrs/0002-tech-stack')).toBe(true);
    expect(DOC_SLUGS.has('adrs/0006-steerspec-name-and-kinded-refs')).toBe(true);
    const page = findDocPage('adrs/0002-tech-stack');
    expect(page.markdown).toContain('status: Accepted');
    expect(page.markdown).toContain('# 0002. Tech stack for SteerLens');
  });

  it('resolves relative ADR links from the index', () => {
    expect(resolveDocsHref('./0002-tech-stack.md', 'adrs', DOC_SLUGS)).toBe(
      '/docs/adrs/0002-tech-stack',
    );
    expect(resolveDocsHref('./0006-steerspec-name-and-kinded-refs.md', 'adrs', DOC_SLUGS)).toBe(
      '/docs/adrs/0006-steerspec-name-and-kinded-refs',
    );
  });

  it('resolves sibling ADR links from a nested ADR page', () => {
    expect(
      resolveDocsHref(
        './0003-local-first-no-auth.md',
        'adrs/0006-steerspec-name-and-kinded-refs',
        DOC_SLUGS,
      ),
    ).toBe('/docs/adrs/0003-local-first-no-auth');
  });

  it('resolves ADR links from top-level docs via ./ADRs/...', () => {
    expect(resolveDocsHref('./ADRs/0002-tech-stack.md', 'tech-stack', DOC_SLUGS)).toBe(
      '/docs/adrs/0002-tech-stack',
    );
  });
});
