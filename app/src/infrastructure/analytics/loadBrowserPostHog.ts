import { initBrowserPostHog } from './initBrowserPostHog';
import type { PostHogBrowserConfig } from './posthogConfig';

export function mountPostHog(config: PostHogBrowserConfig): void {
  initBrowserPostHog(config);
}
