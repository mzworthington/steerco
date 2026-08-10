/** Product identity: customize with `bin/init-project.sh` after creating from the template. */
export const SITE_SLUG = 'steerlens';
export const SITE_NAME = 'SteerLens';
export const SITE_DESCRIPTION =
  'SteerLens helps Engineering Directors and non-technical executives keep strategy, team shape, and evidence aligned';
export const SITE_TAGLINE =
  'Hosting, docs, and CI already wired, so day one is product work, not plumbing.';
/** Public site origin (no trailing slash). Used for canonical/SEO when enabled. */
export const SITE_ORIGIN = 'https://steerlens.mzworthington.co.uk';
/** GitHub repository for this product. */
export const SITE_REPO_URL = 'https://github.com/mzworthington/steerlens';
/** Upstream template used by `scripts/create.sh` / `gh repo create --template …`. */
export const SITE_TEMPLATE_REF = 'mzworthington/react-cloudflare-template';
/** Author credit shown in the site footer. */
export const SITE_AUTHOR_NAME = 'Matthew Z Worthington';
export const SITE_AUTHOR_URL = 'https://mzworthington.co.uk';

/** One-line create script (prompts for name/slug). Prefer `| bash` (not `| sh`). */
export const SITE_CREATE_COMMAND =
  'curl -fsSL https://raw.githubusercontent.com/mzworthington/react-cloudflare-template/main/scripts/create.sh | bash';

/** @deprecated Prefer SITE_CREATE_COMMAND. */
export function templateCloneSnippet(): string {
  return SITE_CREATE_COMMAND;
}

/** Short hosting teaser; full walkthrough lives in docs/custom-domains. */
export function hostingBootstrapSnippet(): string {
  return [
    'cp .env.example .env   # DOMAIN, PAGES_HOSTNAMES, BWS_* or token',
    'bin/setup-cloudflare-hosting.sh',
  ].join('\n');
}
