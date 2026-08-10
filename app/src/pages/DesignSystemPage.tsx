import { useEffect, useState } from 'react';
import { BrandMark } from '../components/BrandMark';
import {
  COLOR_TOKENS,
  DESIGN_SYSTEM_SECTIONS,
  TYPE_TOKENS,
  type DesignSystemSectionId,
} from '../designSystem/tokens';
import { SITE_NAME } from '../siteConfig';

export function DesignSystemPage() {
  const [section, setSection] = useState<DesignSystemSectionId>('identity');

  useEffect(() => {
    document.title = `Design system · ${SITE_NAME}`;
  }, []);

  return (
    <div className="ds-page" data-testid="design-system">
      <header className="ds-intro">
        <p className="eyebrow">Executive · stone &amp; ocean</p>
        <h1>Design system</h1>
        <p>
          Light editorial language for SteerLens — board-pack calm, deep ocean accent, serif titles.
          Tokens live in{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            app/src/index.css
          </code>
          ; vector sources in{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            design-pack/
          </code>
          . Distinct from ArchLens. Mark: circles + arrow lockup; square icons use the arrow alone.
        </p>
      </header>

      <div className="ds-tabs" role="tablist" aria-label="Design system sections">
        {DESIGN_SYSTEM_SECTIONS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            id={`ds-tab-${entry.id}`}
            aria-selected={section === entry.id}
            aria-controls={`ds-panel-${entry.id}`}
            className="ds-tab"
            onClick={() => setSection(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div
        id={`ds-panel-${section}`}
        role="tabpanel"
        aria-labelledby={`ds-tab-${section}`}
        className="ds-panel"
      >
        {section === 'identity' ? <IdentityPanel /> : null}
        {section === 'tokens' ? <TokensPanel /> : null}
        {section === 'assets' ? <AssetsPanel /> : null}
        {section === 'components' ? <ComponentsPanel /> : null}
      </div>
    </div>
  );
}

function IdentityPanel() {
  return (
    <>
      <section className="ds-section">
        <h2>Brand signal</h2>
        <p>
          Product name as a hero-level serif signal. Motif is two circles + a northeast arrowhead;
          square surfaces (nav, favicon, app icons) use the arrow alone. First viewport: brand, one
          headline, one lead line, one CTA group — not a dashboard of cards.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="surface flex items-center gap-4">
            <BrandMark className="h-12 w-12" />
            <div>
              <p className="font-display text-ink text-2xl font-semibold tracking-tight">
                {SITE_NAME}
              </p>
              <p className="text-ink-muted mt-1 text-sm">Arrow only · square / favicon</p>
            </div>
          </div>
          <div className="surface flex flex-col justify-center gap-3">
            <BrandMark variant="lockup" className="h-10 w-auto" />
            <p className="text-ink-muted text-sm">Circles + arrow · header / wide</p>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Typography</h2>
        <p>
          Fraunces for editorial titles and the wordmark; Plus Jakarta Sans for UI and body — not
          Inter or Roboto.
        </p>
        <div className="type-stack">
          <div>
            <p className="eyebrow">Display · Fraunces</p>
            <p className="type-sample-display mt-2">Are we getting the outcome?</p>
          </div>
          <div>
            <p className="eyebrow">Body · Plus Jakarta Sans</p>
            <p className="type-sample-body mt-2">
              Strategy, team shape, and evidence stay aligned. Status, confidence, and next steps
              read at board-pack density — generous whitespace, clear hierarchy.
            </p>
          </div>
          <div>
            <p className="eyebrow">Mono · system</p>
            <p className="type-sample-mono mt-2">--color-ocean · #044a88 · --vl-accent</p>
          </div>
        </div>
      </section>
    </>
  );
}

function TokensPanel() {
  return (
    <section className="ds-section">
      <h2>Color tokens</h2>
      <p>
        Declared in{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          @theme
        </code>{' '}
        so Tailwind classes like{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          bg-ocean
        </code>{' '}
        stay in sync. Architecture aliases:{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          --vl-ink
        </code>
        ,{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          --vl-paper
        </code>
        ,{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          --vl-accent
        </code>
        .
      </p>
      <div className="token-grid">
        {COLOR_TOKENS.map((token) => (
          <article key={token.cssVar} className="token-card">
            <div className={`token-swatch ${token.swatchClass}`} aria-hidden />
            <div className="token-meta">
              <strong>{token.name}</strong>
              <code>{token.cssVar}</code>
              <code>{token.hex}</code>
              <p className="text-ink-muted pt-1 text-xs">{token.role}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <h2>Type tokens</h2>
        <div className="token-grid">
          {TYPE_TOKENS.map((token) => (
            <article key={token.cssVar} className="surface">
              <p className="eyebrow">{token.name}</p>
              <p className="font-display text-ink mt-2 text-lg font-semibold">{token.family}</p>
              <code className="text-ink-muted mt-2 block font-mono text-xs">{token.cssVar}</code>
              <p className="text-ink-muted mt-2 text-xs">{token.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AssetsPanel() {
  return (
    <section className="ds-section">
      <h2>Vector pack</h2>
      <p>
        Sources under{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          design-pack/
        </code>
        ; runtime copies under{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          app/public/
        </code>
        . Square assets are arrow-only;{' '}
        <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          logo-lockup.svg
        </code>{' '}
        carries the full circles + arrow motif.
      </p>
      <div className="asset-grid">
        <figure className="asset-tile">
          <img src="/assets/logo.svg" alt="" width={64} height={64} />
          <figcaption>logo.svg · arrow (square / nav)</figcaption>
        </figure>
        <figure className="asset-tile asset-tile-dark">
          <img src="/assets/logo-dark.svg" alt="" width={64} height={64} />
          <figcaption>logo-dark.svg · arrow on ink</figcaption>
        </figure>
        <figure className="asset-tile">
          <img src="/favicon.svg" alt="" width={64} height={64} />
          <figcaption>favicon.svg · arrow only</figcaption>
        </figure>
        <figure className="asset-tile sm:col-span-2 lg:col-span-3">
          <img
            src="/assets/logo-lockup.svg"
            alt=""
            width={280}
            height={88}
            className="h-14 w-auto"
          />
          <figcaption>logo-lockup.svg · circles + arrow (wide)</figcaption>
        </figure>
        <figure className="asset-tile sm:col-span-2 lg:col-span-3">
          <img
            src="/assets/grid.svg"
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 opacity-70"
          />
          <figcaption>grid.svg · soft paper grid (hero atmosphere)</figcaption>
        </figure>
      </div>
    </section>
  );
}

function ComponentsPanel() {
  return (
    <>
      <section className="ds-section">
        <h2>Calls to action</h2>
        <p>
          Prefer{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-primary
          </code>
          ,{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-secondary
          </code>
          , and{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-tertiary
          </code>{' '}
          over ad-hoc button stacks.
        </p>
        <div className="recipe-row">
          <button type="button" className="btn-primary">
            Share update
          </button>
          <button type="button" className="btn-secondary">
            Secondary
          </button>
          <button type="button" className="btn-tertiary">
            Tertiary
          </button>
        </div>
      </section>

      <section className="ds-section">
        <h2>Status</h2>
        <p>Executive status language from the mockups — ocean, amber, coral, signal.</p>
        <div className="status-row">
          <span className="status-on-track">
            <span className="status-dot bg-ocean" aria-hidden />
            On track
          </span>
          <span className="status-at-risk">
            <span className="status-dot bg-amber" aria-hidden />
            At risk
          </span>
          <span className="status-stop">
            <span className="status-dot bg-coral" aria-hidden />
            Stop
          </span>
          <span className="status-signal">
            <span className="status-dot bg-signal" aria-hidden />
            Signal
          </span>
        </div>
        <div className="callout-stop mt-6 max-w-sm">
          <p className="eyebrow-signal">Decision note</p>
          <p className="font-display text-coral mt-2 text-2xl font-semibold">STOP</p>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            Coral callout for stop-ready recommendations on decision notes.
          </p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Surface</h2>
        <p>
          Use{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .surface
          </code>{' '}
          for interactive panels;{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .surface-ocean
          </code>{' '}
          for highlighted org-shape cards. Skip cards when border and fill are not needed.
        </p>
        <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="surface">
            <p className="eyebrow">Paper card</p>
            <p className="text-ink mt-2 text-sm font-semibold">Interactive panel</p>
            <p className="text-ink-muted mt-1 text-sm leading-relaxed">
              White on stone paper with a soft edge.
            </p>
          </div>
          <div className="surface-ocean">
            <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
              Highlight
            </p>
            <p className="mt-2 text-sm font-semibold">Shared platform</p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              Ocean fill for the focal org node.
            </p>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Docs prose</h2>
        <p>
          In-app Markdown uses{' '}
          <code className="bg-stone text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .prose-docs
          </code>
          . Vector sources:{' '}
          <a href="/docs/design-pack" className="text-ocean hover:text-ocean-hover font-semibold">
            Design pack →
          </a>
        </p>
      </section>
    </>
  );
}
