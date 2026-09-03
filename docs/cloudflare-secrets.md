# Cloudflare hosting: secrets checklist

Shared CI/bootstrap tooling lives in [edge-dns](https://github.com/mzworthington/edge-dns) ([reusable Cloudflare CI](https://github.com/mzworthington/edge-dns/blob/main/docs/reusable-cloudflare-ci.md)). This repo keeps thin shims only.

Real account IDs, zone IDs, API tokens, and hostnames belong in **Bitwarden**, **GitHub Actions secrets/vars**, or a local `.env` - never in committed sources.

## Bootstrap

```bash
export BWS_ACCESS_TOKEN="..."
export BWS_PROJECT_ID="..."

# Site identity (or use a gitignored .env - see .env.example)
export PULUMI_STACK=prod
export DOMAIN=mzworthington.co.uk
export PAGES_HOSTNAMES=steerco.mzworthington.co.uk
export PAGES_PROJECT_NAME=steerco

gh auth login
pulumi login
bin/setup-cloudflare-hosting.sh
```

The shim downloads the canonical script from edge-dns (`EDGE_DNS_REF`, default `main`).

Then `cd infra/cloudflare && pulumi up`, or merge to `main` for CI.

Public origin is `https://steerco.mzworthington.co.uk` (`SITE_ORIGIN` in `app/src/siteConfig.ts`).

### Existing zone required

The **zone** (`DOMAIN`) must already be active on Cloudflare (managed in edge-dns). Bootstrap only attaches **subdomains** in that zone.

## Secrets / vars

| Key                         | Kind     | Used by                                         |
| --------------------------- | -------- | ----------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`      | secret   | Wrangler + Pulumi                               |
| `CLOUDFLARE_ACCOUNT_ID`     | secret   | Wrangler + Pulumi                               |
| `CLOUDFLARE_ZONE_ID`        | secret   | Pulumi DNS / domains                            |
| `PULUMI_ACCESS_TOKEN`       | secret   | Pulumi workflow                                 |
| `PULUMI_PAGES_PROJECT_NAME` | variable | Deploy + Pulumi                                 |
| `PULUMI_PAGES_HOSTNAMES`    | variable | Pulumi (JSON array)                             |
| `POSTHOG_TOKEN`             | secret   | Pages build on `main` (PostHog project API key) |

Optional rename redirect: set Pulumi config `legacyRedirectHostnames` (JSON array), e.g. `["steerlens.mzworthington.co.uk"]`, so those hosts 301 to the first `pagesHostnames` entry. Requires **Zone Single Redirect Edit** on the API token, and the old Pages custom domain/DNS must be removed first (destroy the former product stack).

Prefer a **dedicated BWS project** per site. Bootstrap always resolves the zone from `DOMAIN`.

## API token scopes

- Account → **Cloudflare Pages: Edit**
- Account → **Account Settings: Edit** (Web Analytics)
- Zone → **Zone: Read**
- Zone → **DNS: Edit** (custom domains)
- Zone → **Zone Settings: Edit** (Observatory scheduled tests)
