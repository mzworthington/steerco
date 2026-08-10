# Custom domains

Attach subdomain hostname(s) to the Cloudflare Pages project on an **existing active zone**. Real zone names, hostnames, and tokens belong in **local `.env`** (gitignored) or **GitHub Actions secrets/vars**, not in committed template files. See also [secrets checklist](./cloudflare-secrets.md).

## What you get

| Layer             | Role                                                                    |
| ----------------- | ----------------------------------------------------------------------- |
| **Pages project** | Named by `PAGES_PROJECT_NAME` (also `https://<name>.pages.dev`)         |
| **Pulumi**        | Creates the Pages project, DNS CNAMEs, and Pages custom domains         |
| **CI deploy**     | Builds `app/dist` and runs `wrangler pages deploy` on `main`            |
| **`SITE_ORIGIN`** | App public URL (canonical/SEO); set with `bin/init-project.sh --origin` |

You can ship on `*.pages.dev` only, then add a custom subdomain later.

## Prerequisites

1. An **existing, active Cloudflare zone** for your domain (e.g. `example.com`). This template assumes subdomains only; it does not create zones or configure registrar nameservers.
2. An API token with:
   - Account → **Cloudflare Pages: Edit**
   - Zone → **Zone: Read**
   - Zone → **DNS: Edit**
3. `gh` authenticated to the target repo, and `pulumi login` (the bootstrap script can mint a CI token).

## Hostname layout

| Variable             | Example                                         |
| -------------------- | ----------------------------------------------- |
| `DOMAIN`             | `example.com` (the **zone** name in Cloudflare) |
| `PAGES_HOSTNAMES`    | `app.example.com`                               |
| `PAGES_PROJECT_NAME` | same as init slug (e.g. `my-app`)               |
| `--origin`           | `https://app.example.com`                       |

Multiple subdomains: `PAGES_HOSTNAMES=app.example.com,staging.example.com`.

### No custom domain yet

Omit hostnames bootstrap later. After the first `main` deploy, open `https://<PAGES_PROJECT_NAME>.pages.dev`.

## Step-by-step

### 1. Customize the app origin

```bash
bin/init-project.sh --name "My App" --slug my-app \
  --origin https://app.example.com
```

Or run `bin/init-project.sh` with no flags and answer the prompts.

This writes `SITE_ORIGIN` in `app/src/siteConfig.ts`. Re-run with `--force` to change later.

### 2. Local `.env` (recommended)

```bash
cp .env.example .env
```

Edit at least (Pages project name should match the slug from init):

```bash
PULUMI_STACK=prod
DOMAIN=example.com
PAGES_HOSTNAMES=app.example.com
PAGES_PROJECT_NAME=my-app
CLOUDFLARE_API_TOKEN=...   # or use Bitwarden (BWS_*); see secrets doc
```

`.env` is gitignored. Do not put real domains in README or `siteConfig` defaults inside a public template.

### 3. Bootstrap secrets + Pulumi config

```bash
gh auth login
pulumi login
bin/setup-cloudflare-hosting.sh
```

The script:

- Resolves account/zone IDs if missing (zone must already be active)
- Writes **GitHub** secrets/vars (`CLOUDFLARE_*`, `PULUMI_*`, `PULUMI_PAGES_HOSTNAMES`)
- Writes **gitignored** `infra/cloudflare/Pulumi.<stack>.yaml`

### 4. Apply infrastructure

```bash
cd infra/cloudflare && pulumi up
```

Or push infra changes to `main` and approve the **pulumi-prod** GitHub Environment.

Pulumi creates:

- Cloudflare Pages project
- Proxied CNAME(s) for each subdomain → the Pages `*.pages.dev` target
- Pages custom domain attachment(s)

### 5. Deploy the site

Push to `main` (or wait for the next CI run). Wrangler uploads `app/dist`.

### 6. Verify

1. `https://<PAGES_PROJECT_NAME>.pages.dev`: always works after deploy.
2. `https://<your-subdomain>`: after DNS propagates (usually minutes on Cloudflare).
3. Cloudflare dashboard → **Pages** → project → **Custom domains** shows Active.

## Where configuration lives

| Concern                       | Local                                         | CI                                                                           |
| ----------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------- |
| API token, account, zone      | `.env` / Bitwarden                            | GitHub **secrets**                                                           |
| Project name + hostnames      | `.env`                                        | GitHub **variables** (`PULUMI_PAGES_PROJECT_NAME`, `PULUMI_PAGES_HOSTNAMES`) |
| Pulumi stack values           | `infra/cloudflare/Pulumi.*.yaml` (gitignored) | Same stack, configured by the setup action from vars/secrets                 |
| Public site origin in the SPA | `SITE_ORIGIN` via `init-project.sh`           | Built into the app bundle                                                    |

## Troubleshooting

| Symptom                                             | Check                                                                                                                                                                                                |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Zone missing or not active                          | Add the zone in Cloudflare and wait until it is **Active** before running bootstrap. This template does not configure nameservers.                                                                   |
| Custom domain pending                               | DNS CNAME exists and is proxied (orange cloud); wait for SSL.                                                                                                                                        |
| CI Pulumi fails on hostnames                        | Set repo variable `PULUMI_PAGES_HOSTNAMES` to JSON, e.g. `["app.example.com"]`.                                                                                                                      |
| Wrong site origin in HTML/meta                      | Re-run `bin/init-project.sh --origin https://… --force` and redeploy.                                                                                                                                |
| Token denied                                        | Token needs Pages Edit + Zone Read + DNS Edit on the correct account/zone.                                                                                                                           |
| Wrong zone in Pulumi (`zoneName` is another domain) | Shared BWS had `CLOUDFLARE_ZONE_ID` for a different site. Re-run bootstrap after the fix that resolves zone from `DOMAIN`; update GitHub `CLOUDFLARE_ZONE_ID` secret. Prefer a BWS project per site. |

## Related

- [Setup](./setup.md): local app + quality
- [Secrets checklist](./cloudflare-secrets.md): token scopes and var names
- [Workflows](./workflows.md): CI deploy + Pulumi approval gate
- [ADR 0001](./ADRs/0001-cloudflare-pages-pulumi-wrangler.md): why Pages + Pulumi + Wrangler
