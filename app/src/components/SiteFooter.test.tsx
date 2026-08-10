import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_AUTHOR_NAME, SITE_AUTHOR_URL } from '../siteConfig';
import { SiteFooter } from './SiteFooter';

afterEach(() => {
  cleanup();
});

describe('SiteFooter', () => {
  it('links author credit to the personal site', () => {
    render(<SiteFooter />);
    const credit = screen.getByRole('link', { name: SITE_AUTHOR_NAME });
    expect(credit.getAttribute('href')).toBe(SITE_AUTHOR_URL);
  });
});
