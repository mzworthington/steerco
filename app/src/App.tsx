import { useState, type ReactNode } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import { BrandMark } from './components/BrandMark';
import { SiteFooter } from './components/SiteFooter';
import { SITE_NAME } from './siteConfig';
import { isPreviewUnlocked } from './siteGate';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';
import { WorkspaceHomePage } from './pages/WorkspaceHomePage';
import { SteeringOverviewPage } from './pages/SteeringOverviewPage';
import { BetDetailPage } from './pages/BetDetailPage';
import { DecisionNotesPage } from './pages/DecisionNotesPage';
import { EvidencePage } from './pages/EvidencePage';
import { ExportBoardPackPage } from './pages/ExportBoardPackPage';
import { OrganisationPage } from './pages/OrganisationPage';
import { GoalsPage } from './pages/GoalsPage';
import { ProductsPage } from './pages/ProductsPage';
import { WorkspaceDiffPage } from './pages/WorkspaceDiffPage';
import { TechnicalHubPage } from './pages/TechnicalHubPage';
import { TechnicalTreePage } from './pages/TechnicalTreePage';
import { TechnicalFitnessPage } from './pages/TechnicalFitnessPage';
import { TechnicalVocabularyPage } from './pages/TechnicalVocabularyPage';
import { TechnicalImportPage } from './pages/TechnicalImportPage';
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
            <BrandMark variant="mark" />
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
      <Route path="/workspace/goals" component={GoalsPage} />
      <Route path="/workspace/products" component={ProductsPage} />
      <Route path="/workspace/outcomes">
        <Redirect to="/workspace/goals" />
      </Route>
      <Route path="/workspace/evidence" component={EvidencePage} />
      <Route path="/workspace/organisation" component={OrganisationPage} />
      <Route path="/workspace/decisions" component={DecisionNotesPage} />
      <Route path="/workspace/diff" component={WorkspaceDiffPage} />
      <Route path="/workspace/export" component={ExportBoardPackPage} />
      <Route path="/workspace/technical/tree" component={TechnicalTreePage} />
      <Route path="/workspace/technical/fitness" component={TechnicalFitnessPage} />
      <Route path="/workspace/technical/vocabulary" component={TechnicalVocabularyPage} />
      <Route path="/workspace/technical/import" component={TechnicalImportPage} />
      <Route path="/workspace/technical" component={TechnicalHubPage} />
      <Route path="/workspace/bets/:betId" component={BetDetailPage} />
      <Route path="/design-system">
        <Redirect to="/docs/design-system" />
      </Route>
      <Route path="/docs/*" component={DocsPage} />
      <Route path="/docs" component={DocsPage} />
      <Route>
        <section className="not-found">
          <h1>Not found</h1>
          <p>That page is not part of SteerCo.</p>
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
