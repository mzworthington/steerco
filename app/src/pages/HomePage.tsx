import { useEffect } from 'react';
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_REPO_URL,
  SITE_SLUG,
  SITE_TAGLINE,
} from '../siteConfig';

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
        <h1 className="hero-brand">{SITE_NAME}</h1>
        <p className="hero-lead">{SITE_TAGLINE}</p>
        <p className="hero-supporting text-ink-muted mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
          Align outcomes, funded bets, and team shape in a local workspace — then leave with a
          decision note fit for a board pack.
        </p>
        <div className="hero-actions">
          <a href="/docs" className="btn-primary">
            Read the docs
          </a>
          <a href={SITE_REPO_URL} className="btn-secondary" target="_blank" rel="noreferrer">
            View on GitHub →
          </a>
        </div>
      </div>
    </section>
  );
}
