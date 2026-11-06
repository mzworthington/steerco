import { lazy, Suspense } from 'react';
import { Redirect, Route, Switch, useLocation } from 'wouter';
import { BrandMark } from './components/BrandMark';
import { RouteBoundary, RouteFallback } from './components/RouteBoundary';
import { SiteFooter } from './components/SiteFooter';
import { SkipToMain } from './components/SkipToMain';
import { SITE_NAME } from './siteConfig';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';

const DocsPage = lazy(() =>
  import('./pages/DocsPage').then((module) => ({ default: module.DocsPage })),
);

const WorkspaceApp = lazy(() =>
  import('./workspace/WorkspaceApp').then((module) => ({ default: module.WorkspaceApp })),
);

function isWorkspacePath(path: string): boolean {
  return path === '/workspace' || path.startsWith('/workspace/');
}

function SiteHeader() {
  return (
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
  );
}

function PublicRoutes() {
  return (
    <div className="site-shell">
      <SkipToMain />
      <SiteHeader />
      <RouteBoundary>
        <Suspense
          fallback={
            <main id="main-content">
              <RouteFallback />
            </main>
          }
        >
          <main id="main-content">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/design-system">
                <Redirect to="/docs/design-system" />
              </Route>
              <Route path="/docs/*" component={DocsPage} />
              <Route path="/docs" component={DocsPage} />
              <Route>
                <NotFoundPage />
              </Route>
            </Switch>
          </main>
          <SiteFooter />
        </Suspense>
      </RouteBoundary>
    </div>
  );
}

function UnlockedApp() {
  const [location] = useLocation();

  if (isWorkspacePath(location)) {
    return (
      <RouteBoundary>
        <Suspense fallback={<RouteFallback />}>
          <WorkspaceApp />
        </Suspense>
      </RouteBoundary>
    );
  }

  return <PublicRoutes />;
}

export function App() {
  return <UnlockedApp />;
}
