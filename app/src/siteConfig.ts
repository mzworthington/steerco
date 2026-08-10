/** Product identity: customize with `bin/init-project.sh` after creating from the template. */
export const SITE_SLUG = 'react-cloudflare-template';
export const SITE_NAME = 'React Cloudflare Template';
export const SITE_DESCRIPTION =
  'React on Cloudflare Pages with hosting, docs, and CI wired, so day one is product work, not plumbing.';
export const SITE_TAGLINE =
  'Hosting, docs, and CI already wired, so day one is product work, not plumbing.';
/** Public site origin (no trailing slash). Used for canonical/SEO when enabled. */
export const SITE_ORIGIN = 'https://example.com';
/** GitHub repository for this template (or your fork after init). */
export const SITE_REPO_URL = 'https://github.com/mzworthington/react-cloudflare-template';
/** Owner/name used in `gh repo create --template …`. */
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
