import { StrictMode, type ReactNode } from 'react';
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

const reactRoot = createRoot(root);
const app = <App />;

function paint(children: ReactNode) {
  reactRoot.render(<StrictMode>{children}</StrictMode>);
}

paint(app);

if (posthogConfig.enabled) {
  void import('./infrastructure/analytics/loadBrowserPostHog')
    .then(({ mountPostHog }) => {
      mountPostHog(posthogConfig, paint, app);
    })
    .catch((error: unknown) => {
      console.error(error);
    });
}

void registerServiceWorker(() => import('virtual:pwa-register'));
