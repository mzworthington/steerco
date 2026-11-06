import { type ReactNode } from 'react';
import { PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { initBrowserPostHog } from './initBrowserPostHog';
import type { PostHogBrowserConfig } from './posthogConfig';

export function mountPostHog(
  config: PostHogBrowserConfig,
  paint: (children: ReactNode) => void,
  app: ReactNode,
): void {
  if (!initBrowserPostHog(config)) return;
  paint(<PostHogProvider client={posthog}>{app}</PostHogProvider>);
}
