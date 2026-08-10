# Cloudflare hosting: secrets checklist

Companion to **[Custom domains](./custom-domains.md)**. Shared CI/bootstrap tooling lives in [edge-dns](https://github.com/mzworthington/edge-dns) ([reusable Cloudflare CI](https://github.com/mzworthington/edge-dns/blob/main/docs/reusable-cloudflare-ci.md)). This repo keeps thin shims only.

Real account IDs, zone IDs, API tokens, and hostnames belong in **Bitwarden**, **GitHub Actions secrets/vars**, or a local `.env` — never in committed template sources.

## Bootstrap

```bash
export BWS_ACCESS_TOKEN="..."
export BWS_PROJECT_ID="..."

# Site identity (or use a gitignored .env — see .env.example)
export PULUMI_STACK=prod
export DOMAIN=example.com
export PAGES_HOSTNAMES=app.example.com
export PAGES_PROJECT_NAME=my-app   # same as init-project slug

gh auth login
pulumi login
bin/setup-cloudflare-hosting.sh
```

The shim downloads the canonical script from edge-dns (`EDGE_DNS_REF`, default `main`).

Then `cd infra/cloudflare && pulumi up`, or merge to `main` for CI.

Set public origin in the app with `bin/init-project.sh --origin https://app.example.com`.

### Existing zone required

The **zone** (`DOMAIN`) must already be active on Cloudflare (managed in edge-dns). Bootstrap only attaches **subdomains** in that zone.

## Secrets / vars

| Key                         | Kind     | Used by              |
| --------------------------- | -------- | -------------------- |
| `CLOUDFLARE_API_TOKEN`      | secret   | Wrangler + Pulumi    |
| `CLOUDFLARE_ACCOUNT_ID`     | secret   | Wrangler + Pulumi    |
| `CLOUDFLARE_ZONE_ID`        | secret   | Pulumi DNS / domains |
| `PULUMI_ACCESS_TOKEN`       | secret   | Pulumi workflow      |
| `PULUMI_PAGES_PROJECT_NAME` | variable | Deploy + Pulumi      |
| `PULUMI_PAGES_HOSTNAMES`    | variable | Pulumi (JSON array)  |

Prefer a **dedicated BWS project** per site. Bootstrap always resolves the zone from `DOMAIN`.

## API token scopes

- Account → **Cloudflare Pages: Edit**
- Account → **Account Settings: Edit** (Web Analytics)
- Zone → **Zone: Read**
- Zone → **DNS: Edit** (custom domains)
- Zone → **Zone Settings: Edit** (Observatory scheduled tests)
