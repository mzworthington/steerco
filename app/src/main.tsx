import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './adapters/registerServiceWorker';
import { App } from './App';
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

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (posthogConfig.enabled) {
  void import('./infrastructure/analytics/loadBrowserPostHog')
    .then(({ mountPostHog }) => {
      mountPostHog(posthogConfig);
    })
    .catch((error: unknown) => {
      console.error(error);
    });
}

void registerServiceWorker(() => import('virtual:pwa-register'));
