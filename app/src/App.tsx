import { useState, type ReactNode } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import { BrandMark } from './components/BrandMark';
import { SiteFooter } from './components/SiteFooter';
import { SITE_NAME } from './siteConfig';
import { isPreviewUnlocked } from './siteGate';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { WorkspaceHomePage } from './pages/WorkspaceHomePage';
import { SteeringOverviewPage } from './pages/SteeringOverviewPage';
import { BetDetailPage } from './pages/BetDetailPage';
import { DecisionNotesPage } from './pages/DecisionNotesPage';
import { ExportStubPage } from './pages/ExportStubPage';
import { OrganisationPage } from './pages/OrganisationPage';
import { OutcomesPage } from './pages/OutcomesPage';
import { WorkspaceSessionProvider } from './workspace/WorkspaceSession';
import { WorkspaceShell } from './workspace/WorkspaceShell';

function isWorkspacePath(path: string): boolean {
  return path === '/workspace' || path.startsWith('/workspace/');
}

function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="/" className="site-brand inline-flex items-center gap-2.5">
            <BrandMark variant="lockup" />
            <span>{SITE_NAME}</span>
          </a>
          <nav className="site-nav-links" aria-label="Primary">
            <a href="/" className="site-nav-link">
              Home
            </a>
            <a href="/workspace" className="site-nav-link">
              Workspace
            </a>
            <a href="/docs" className="site-nav-link">
              Docs
            </a>
            <a href="/design-system" className="site-nav-link">
              Design
            </a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/workspace" component={WorkspaceHomePage} />
      <Route path="/workspace/steering" component={SteeringOverviewPage} />
      <Route path="/workspace/outcomes" component={OutcomesPage} />
      <Route path="/workspace/organisation" component={OrganisationPage} />
      <Route path="/workspace/decisions" component={DecisionNotesPage} />
      <Route path="/workspace/export" component={ExportStubPage} />
      <Route path="/workspace/bets/:betId" component={BetDetailPage} />
      <Route path="/design-system" component={DesignSystemPage} />
      <Route path="/docs/design-system">
        <Redirect to="/design-system" />
      </Route>
      <Route path="/docs/*" component={DocsPage} />
      <Route path="/docs" component={DocsPage} />
      <Route>
        <section className="not-found">
          <h1>Not found</h1>
          <p>That page is not part of SteerLens.</p>
          <a href="/" className="btn-secondary mt-6">
            ← Back home
          </a>
        </section>
      </Route>
    </Switch>
  );
}

function UnlockedApp() {
  const [location] = useLocation();
  const workspace = isWorkspacePath(location);

  return (
    <WorkspaceSessionProvider>
      {workspace ? (
        <WorkspaceShell>
          <AppRoutes />
        </WorkspaceShell>
      ) : (
        <SiteChrome>
          <AppRoutes />
        </SiteChrome>
      )}
    </WorkspaceSessionProvider>
  );
}

export function App() {
  const [unlocked] = useState(() => isPreviewUnlocked());

  if (!unlocked) {
    return (
      <div className="site-shell">
        <main>
          <ComingSoonPage />
        </main>
      </div>
    );
  }

  return <UnlockedApp />;
}
