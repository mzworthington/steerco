import { POSTHOG_SDK_DEFAULTS, type PostHogBrowserConfig } from './posthogConfig';

export type PostHogInitClient = {
  init: (
    apiKey: string,
    options: {
      api_host: string;
      ui_host: string;
      defaults: typeof POSTHOG_SDK_DEFAULTS;
      capture_pageview: 'history_change';
      cookieless_mode: 'always';
      person_profiles: 'never';
    },
  ) => unknown;
  startExceptionAutocapture?: () => void;
};

export function initBrowserPostHog(
  config: PostHogBrowserConfig,
  client: PostHogInitClient,
): boolean {
  if (!config.enabled) {
    return false;
  }
  client.init(config.apiKey, {
    api_host: config.apiHost,
    ui_host: 'https://eu.posthog.com',
    defaults: POSTHOG_SDK_DEFAULTS,
    capture_pageview: 'history_change',
    cookieless_mode: 'always',
    person_profiles: 'never',
  });
  client.startExceptionAutocapture?.();
  return true;
}
