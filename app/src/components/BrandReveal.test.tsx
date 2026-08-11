import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrandReveal } from './BrandReveal';
import { SITE_NAME } from '../siteConfig';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('BrandReveal', () => {
  it('fades in SteerCo after the arrow sweep', () => {
    vi.useFakeTimers();
    render(<BrandReveal />);

    const wordmark = screen.getByText(SITE_NAME);
    expect(wordmark.className).not.toContain('is-visible');
    expect(screen.getByTestId('brand-reveal').getAttribute('data-named')).toBe('false');

    act(() => {
      vi.advanceTimersByTime(1350);
    });

    expect(screen.getByTestId('brand-reveal').getAttribute('data-named')).toBe('true');
    expect(wordmark.className).toContain('is-visible');
  });
});
