import { StrictMode, type ReactElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PostHogProvider } from '@posthog/react';
import posthog from 'posthog-js';
import { registerServiceWorker } from './adapters/registerServiceWorker';
import { App } from './App';
import { initBrowserPostHog } from './infrastructure/analytics/initBrowserPostHog';
import { resolvePostHogConfig } from './infrastructure/analytics/posthogConfig';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Root element #root not found');
}

const posthogConfig = resolvePostHogConfig(import.meta.env, {
  onMissingInDev: (message) => {
    console.error(message);
  },
});
initBrowserPostHog(posthogConfig);

const app: ReactElement = <App />;

createRoot(root).render(
  <StrictMode>
    {posthogConfig.enabled ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app}
  </StrictMode>,
);

void registerServiceWorker(() => import('virtual:pwa-register'));
