import { useEffect, useState, type ReactNode } from 'react';
import { initBrowserPostHog, type PostHogInitClient } from './initBrowserPostHog';
import type { PostHogBrowserConfig } from './posthogConfig';

type ReadyAnalytics = {
  wrap: (children: ReactNode) => ReactNode;
};

/**
 * Renders children on the first frame. The PostHog SDK is a separate chunk and
 * loads only when a project token is configured, so the home preview does not
 * download it.
 */
export function AnalyticsRoot({
  config,
  children,
}: {
  config: PostHogBrowserConfig;
  children: ReactNode;
}) {
  const [ready, setReady] = useState<ReadyAnalytics | null>(null);

  useEffect(() => {
    if (!config.enabled) return;
    let cancelled = false;

    void (async () => {
      const [{ default: posthog }, { PostHogProvider }] = await Promise.all([
        import('posthog-js'),
        import('@posthog/react'),
      ]);
      const client: PostHogInitClient = {
        init: (apiKey, options) => posthog.init(apiKey, options),
        startExceptionAutocapture: () => {
          posthog.startExceptionAutocapture();
        },
      };
      initBrowserPostHog(config, client);
      if (!cancelled) {
        setReady({
          wrap: (node) => <PostHogProvider client={posthog}>{node}</PostHogProvider>,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config]);

  if (!ready) return children;
  return ready.wrap(children);
}
