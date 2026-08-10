import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SITE_NAME } from '../siteConfig';
import { ComingSoonPage } from './ComingSoonPage';

afterEach(() => {
  cleanup();
});

describe('ComingSoonPage', () => {
  it('shows Coming Soon with the product name', () => {
    render(<ComingSoonPage />);
    expect(screen.getByTestId('coming-soon')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /coming soon/i })).toBeTruthy();
    expect(screen.getByText(SITE_NAME)).toBeTruthy();
  });
});
