import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from './adapters/registerServiceWorker';
import { App } from './App';
import { AnalyticsRoot } from './infrastructure/analytics/AnalyticsRoot';
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
    <AnalyticsRoot config={posthogConfig}>
      <App />
    </AnalyticsRoot>
  </StrictMode>,
);

void registerServiceWorker(() => import('virtual:pwa-register'));
