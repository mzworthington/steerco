import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_AUTHOR_NAME, SITE_AUTHOR_URL, SITE_REPO_URL } from '../siteConfig';
import { SiteFooter } from './SiteFooter';

afterEach(() => {
  cleanup();
});

describe('SiteFooter', () => {
  it('links author credit and source repo', () => {
    render(<SiteFooter />);
    const credit = screen.getByRole('link', { name: SITE_AUTHOR_NAME });
    expect(credit.getAttribute('href')).toBe(SITE_AUTHOR_URL);
    const source = screen.getByRole('link', { name: 'Source' });
    expect(source.getAttribute('href')).toBe(SITE_REPO_URL);
  });
});
