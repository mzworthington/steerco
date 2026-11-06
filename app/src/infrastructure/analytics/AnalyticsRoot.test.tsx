import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsRoot } from './AnalyticsRoot';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    startExceptionAutocapture: vi.fn(),
  },
}));

vi.mock('@posthog/react', () => ({
  PostHogProvider: ({ children }: { children?: ReactNode }) => (
    <div data-testid="posthog-provider">{children}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe('AnalyticsRoot', () => {
  it('paints children without loading PostHog when analytics is disabled', () => {
    render(
      <AnalyticsRoot config={{ enabled: false }}>
        <p>Home</p>
      </AnalyticsRoot>,
    );
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.queryByTestId('posthog-provider')).toBeNull();
  });

  it('wraps children after the SDK chunk loads when analytics is enabled', async () => {
    render(
      <AnalyticsRoot
        config={{ enabled: true, apiKey: 'phc_test', apiHost: 'https://example.test' }}
      >
        <p>Home</p>
      </AnalyticsRoot>,
    );
    expect(screen.getByText('Home')).toBeTruthy();
    expect(await screen.findByTestId('posthog-provider')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
  });
});
