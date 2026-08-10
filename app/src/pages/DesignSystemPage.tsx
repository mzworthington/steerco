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
        <p className="eyebrow">Coastal-ink</p>
        <h1>Design system</h1>
        <p>
          Lightweight starter language for this template — tokens, assets, and a few named recipes.
          Rebrand the values in{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            app/src/index.css
          </code>{' '}
          and{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            design-pack/
          </code>{' '}
          when the product is yours.
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
          The first viewport should read as one composition: product name as the hero, one lead
          line, one CTA group, and atmosphere from mist gradients plus a soft drafting grid — not a
          dashboard of cards.
        </p>
        <div className="surface mt-6 flex items-center gap-4">
          <BrandMark className="h-12 w-12" />
          <div>
            <p className="font-display text-ink text-2xl font-bold tracking-tight">{SITE_NAME}</p>
            <p className="text-ink-muted mt-1 text-sm">Mark + wordmark · coastal-ink</p>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Typography</h2>
        <p>
          Syne for display hierarchy; Source Sans 3 for readable UI copy; mono for tokens and
          labels.
        </p>
        <div className="type-stack">
          <div>
            <p className="eyebrow">Display · Syne</p>
            <p className="type-sample-display mt-2">Ship the shell. Own the brand.</p>
          </div>
          <div>
            <p className="eyebrow">Body · Source Sans 3</p>
            <p className="type-sample-body mt-2">
              Tokens live in a single CSS file. Prefer named recipes over one-off utility piles so
              rebrands stay mechanical.
            </p>
          </div>
          <div>
            <p className="eyebrow">Mono · system</p>
            <p className="type-sample-mono mt-2">--color-accent · #0f766e</p>
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
        <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          @theme
        </code>{' '}
        so Tailwind classes like{' '}
        <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          bg-accent
        </code>{' '}
        stay in sync with CSS variables.
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
              <p className="font-display text-ink mt-2 text-lg font-bold">{token.family}</p>
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
        <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          design-pack/
        </code>
        ; runtime copies under{' '}
        <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
          app/public/
        </code>
        . Keep SVG fills aligned with the token table when you rebrand.
      </p>
      <div className="asset-grid">
        <figure className="asset-tile">
          <img src="/assets/logo.svg" alt="" width={64} height={64} />
          <figcaption>logo.svg · light nav</figcaption>
        </figure>
        <figure className="asset-tile asset-tile-dark">
          <img src="/assets/logo-dark.svg" alt="" width={64} height={64} />
          <figcaption>logo-dark.svg · dark surfaces</figcaption>
        </figure>
        <figure className="asset-tile">
          <img src="/favicon.svg" alt="" width={64} height={64} />
          <figcaption>favicon.svg · tab icon</figcaption>
        </figure>
        <figure className="asset-tile sm:col-span-2 lg:col-span-3">
          <img
            src="/assets/grid.svg"
            alt=""
            width={96}
            height={96}
            className="h-24 w-24 opacity-70"
          />
          <figcaption>grid.svg · drafting tile (also used as hero atmosphere)</figcaption>
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
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-primary
          </code>
          ,{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-secondary
          </code>
          , and{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .btn-tertiary
          </code>{' '}
          over ad-hoc button stacks.
        </p>
        <div className="recipe-row">
          <button type="button" className="btn-primary">
            Primary
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
        <h2>Surface</h2>
        <p>
          Use{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .surface
          </code>{' '}
          when a bordered container helps interaction or comparison — not as default page chrome.
        </p>
        <div className="surface mt-6 max-w-md">
          <p className="eyebrow">Example</p>
          <p className="text-ink mt-2 text-sm font-semibold">Interactive panel</p>
          <p className="text-ink-muted mt-1 text-sm leading-relaxed">
            Good for token cards, settings groups, and showcase demos. Skip the card if removing
            border and fill still reads clearly.
          </p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Docs prose</h2>
        <p>
          In-app Markdown uses{' '}
          <code className="bg-mist text-ink rounded px-1.5 py-0.5 font-mono text-[0.9em]">
            .prose-docs
          </code>
          . Written guide:{' '}
          <a
            href="/docs/design-system"
            className="text-accent hover:text-accent-hover font-semibold"
          >
            Design system docs →
          </a>
        </p>
      </section>
    </>
  );
}
