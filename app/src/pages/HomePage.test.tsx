import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_CREATE_COMMAND, SITE_NAME, SITE_REPO_URL } from '../siteConfig';
import { HomePage } from './HomePage';

afterEach(() => {
  cleanup();
});

describe('HomePage', () => {
  it('renders the product name', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: SITE_NAME })).toBeTruthy();
  });

  it('links to the GitHub repository', () => {
    render(<HomePage />);
    const link = screen.getByRole('link', { name: /view on github/i });
    expect(link.getAttribute('href')).toBe(SITE_REPO_URL);
  });

  it('shows the create-script one-liner', () => {
    render(<HomePage />);
    const snippet = screen.getByTestId('template-snippet');
    expect(snippet.textContent).toContain(SITE_CREATE_COMMAND);
    expect(snippet.textContent).toContain('scripts/create.sh');
  });

  it('shows a hosting bootstrap teaser linked to custom-domains docs', () => {
    render(<HomePage />);
    const snippet = screen.getByTestId('hosting-snippet');
    expect(snippet.textContent).toContain('bin/setup-cloudflare-hosting.sh');
    expect(snippet.textContent).toContain('.env.example');
    const link = screen.getByRole('link', { name: /custom domains/i });
    expect(link.getAttribute('href')).toBe('/docs/custom-domains');
  });
});
