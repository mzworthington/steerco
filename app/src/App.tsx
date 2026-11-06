import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Redirect, Route, Switch, useLocation, useParams } from 'wouter';
import { lvtPath } from './application/lvtRoutes';
import { BrandMark } from './components/BrandMark';
import { SiteFooter } from './components/SiteFooter';
import { SkipToMain } from './components/SkipToMain';
import { HomePage } from './pages/HomePage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SITE_NAME } from './siteConfig';

// Route splits: `/` must not download workspace graphs, docs markdown, or mermaid.
const WorkspaceFrame = lazy(() =>
  import('./workspace/WorkspaceFrame').then((module) => ({ default: module.WorkspaceFrame })),
);
const DocsPage = lazyNamed(() => import('./pages/DocsPage'), 'DocsPage');
const WorkspaceHomePage = lazyNamed(() => import('./pages/WorkspaceHomePage'), 'WorkspaceHomePage');
const SteeringOverviewPage = lazyNamed(
  () => import('./pages/SteeringOverviewPage'),
  'SteeringOverviewPage',
);
const DecisionNotesPage = lazyNamed(() => import('./pages/DecisionNotesPage'), 'DecisionNotesPage');
const EvidencePage = lazyNamed(() => import('./pages/EvidencePage'), 'EvidencePage');
const ExportBoardPackPage = lazyNamed(
  () => import('./pages/ExportBoardPackPage'),
  'ExportBoardPackPage',
);
const OrganisationPage = lazyNamed(() => import('./pages/OrganisationPage'), 'OrganisationPage');
const GoalsPage = lazyNamed(() => import('./pages/GoalsPage'), 'GoalsPage');
const ProductsPage = lazyNamed(() => import('./pages/ProductsPage'), 'ProductsPage');
const WorkspaceDiffPage = lazyNamed(() => import('./pages/WorkspaceDiffPage'), 'WorkspaceDiffPage');
const TechnicalHubPage = lazyNamed(() => import('./pages/TechnicalHubPage'), 'TechnicalHubPage');
const TechnicalTreePage = lazyNamed(() => import('./pages/TechnicalTreePage'), 'TechnicalTreePage');
const TechnicalFitnessPage = lazyNamed(
  () => import('./pages/TechnicalFitnessPage'),
  'TechnicalFitnessPage',
);
const TechnicalVocabularyPage = lazyNamed(
  () => import('./pages/TechnicalVocabularyPage'),
  'TechnicalVocabularyPage',
);
const TechnicalImportPage = lazyNamed(
  () => import('./pages/TechnicalImportPage'),
  'TechnicalImportPage',
);

function lazyNamed<ExportName extends string, Props>(
  loader: () => Promise<Record<ExportName, ComponentType<Props>>>,
  name: ExportName,
) {
  return lazy(() => loader().then((module) => ({ default: module[name] })));
}

function isWorkspacePath(path: string): boolean {
  return path === '/workspace' || path.startsWith('/workspace/');
}

function BetToLvtRedirect() {
  const params = useParams<{ betId: string }>();
  return <Redirect to={lvtPath('bet', params.betId || 'vision')} />;
}

function RouteFallback() {
  return (
    <p className="text-ink-muted min-h-dvh px-5 py-16" role="status">
      Loading…
    </p>
  );
}

function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <SkipToMain />
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="/" className="site-brand inline-flex items-center gap-2.5">
            <BrandMark variant="mark" />
            <span>{SITE_NAME}</span>
          </a>
          <nav className="site-nav-links" aria-label="Primary">
            <a href="/workspace" className="site-nav-link">
              Workspace
            </a>
            <a href="/docs" className="site-nav-link">
              Docs
            </a>
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/workspace" component={WorkspaceHomePage} />
        <Route path="/workspace/steering" component={SteeringOverviewPage} />
        <Route path="/workspace/lvt/:hierarchyType/:slug" component={GoalsPage} />
        <Route path="/workspace/lvt" component={GoalsPage} />
        <Route path="/workspace/goals">
          <Redirect to="/workspace/lvt" />
        </Route>
        <Route path="/workspace/products" component={ProductsPage} />
        <Route path="/workspace/outcomes">
          <Redirect to="/workspace/lvt" />
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
        <Route path="/workspace/bets/:betId" component={BetToLvtRedirect} />
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
    </Suspense>
  );
}

function UnlockedApp() {
  const [location] = useLocation();
  const workspace = isWorkspacePath(location);

  if (workspace) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <WorkspaceFrame>
          <AppRoutes />
        </WorkspaceFrame>
      </Suspense>
    );
  }

  return (
    <SiteChrome>
      <AppRoutes />
    </SiteChrome>
  );
}

export function App() {
  return <UnlockedApp />;
}
