import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_NAME, SITE_SUPPORTING, SITE_TAGLINE } from '../siteConfig';
import { HomePage } from './HomePage';

afterEach(() => {
  cleanup();
});

describe('HomePage', () => {
  it('renders the product name and tagline', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: SITE_NAME })).toBeTruthy();
    expect(screen.getByTestId('brand-reveal')).toBeTruthy();
    expect(screen.getByText(SITE_TAGLINE)).toBeTruthy();
    expect(screen.getByText(SITE_SUPPORTING)).toBeTruthy();
  });

  it('links to workspace and product guide', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /open workspace/i }).getAttribute('href')).toBe(
      '/workspace',
    );
    expect(screen.getByRole('link', { name: /product guide/i }).getAttribute('href')).toBe(
      '/docs/product-guide',
    );
  });
});
