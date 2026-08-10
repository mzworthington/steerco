import { Route, Switch } from 'wouter';
import { BrandMark } from './components/BrandMark';
import { SiteFooter } from './components/SiteFooter';
import { SITE_NAME } from './siteConfig';
import { DesignSystemPage } from './pages/DesignSystemPage';
import { DocsPage } from './pages/DocsPage';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <div className="site-shell">
      <header className="site-nav">
        <div className="site-nav-inner">
          <a href="/" className="site-brand inline-flex items-center gap-2.5">
            <BrandMark />
            <span>{SITE_NAME}</span>
          </a>
          <nav className="site-nav-links" aria-label="Primary">
            <a href="/" className="site-nav-link">
              Home
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
      <main>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/design-system" component={DesignSystemPage} />
          <Route path="/docs/:slug*" component={DocsPage} />
          <Route path="/docs" component={DocsPage} />
          <Route>
            <section className="not-found">
              <h1>Not found</h1>
              <p>That page is not part of this starter.</p>
              <a href="/" className="btn-secondary mt-6">
                ← Back home
              </a>
            </section>
          </Route>
        </Switch>
      </main>
      <SiteFooter />
    </div>
  );
}
