import { useEffect } from 'react';
import { BrandReveal } from '../components/BrandReveal';
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN, SITE_SLUG, SITE_TAGLINE } from '../siteConfig';

export function HomePage() {
  useEffect(() => {
    document.title = SITE_NAME;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', SITE_DESCRIPTION);
  }, []);

  return (
    <section
      className="hero"
      data-testid="home"
      data-site-slug={SITE_SLUG}
      data-site-origin={SITE_ORIGIN}
    >
      <div className="hero-inner">
        <BrandReveal className="items-start" wordmarkAs="h1" wordmarkClassName="hero-brand" />
        <p className="hero-lead">{SITE_TAGLINE}</p>
        <p className="hero-supporting text-ink-muted mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
          Align outcomes, funded bets, and team shape in a local workspace - then leave with a
          decision note fit for a board pack.
        </p>
        <div className="hero-actions">
          <a href="/workspace" className="btn-primary">
            Open workspace
          </a>
          <a href="/docs/product-guide" className="btn-secondary">
            Product guide
          </a>
        </div>
      </div>
    </section>
  );
}
