# Setup & local development

## Prerequisites

- [Mise](https://mise.jdx.dev/) (installs Node and pnpm from `mise.toml`)
- Optional for docs media: `ffmpeg` (via mise), Playwright browsers

## Quick start

```bash
git clone https://github.com/mzworthington/steerco.git
cd steerco
bin/setup-dev-env.sh
cd app && pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

`bin/setup-dev-env.sh` bootstraps [Waykit](https://github.com/mzworthington/waykit) when needed. Check the handshake with `wk align .`. Project MCP is the kit `default` profile. For live Cloudflare work, `wk mcp cloudflare-ops --project`, then restore `wk mcp default --project`.

| Path                    | Role                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `app/`                  | pnpm workspace - SPA (`@steerco/app`) + `@steerco/core`            |
| `docs/`                 | Product & ops Markdown (rendered at `/docs`, including specs/PRDs) |
| `schemas/`              | JSON Schema for SteerSpec                                          |
| `samples/`              | Example steertree.yaml                                             |
| `mockups/`              | Executive mockups                                                  |
| `app/src/siteConfig.ts` | Public name, origin, and SEO copy                                  |

## Quality checks

Named tools (see [Quality](./quality.md)): **Prettier**, **oxlint**, **TypeScript**, **knip**, **Vitest**, **Husky** + **lint-staged**, plus **CodeQL** and **Lighthouse CI** in GitHub Actions.

```bash
cd app
pnpm format:check   # Prettier
pnpm lint           # oxlint
pnpm typecheck      # TypeScript (app + core)
pnpm knip           # unused code / deps
pnpm test           # Vitest (app + core)
pnpm build          # production build
```

**Pre-commit:** Husky runs lint-staged (Prettier), then format:check, oxlint, typecheck, and knip on staged `app/` / `docs/` changes. After a UI change, optionally:

```bash
cd app
pnpm build && pnpm test:lighthouse
pnpm record:docs-media   # Playwright screenshots for docs
```

## Cloudflare hosting

1. Create a Cloudflare API token (Pages Edit + Zone DNS Edit if using a custom domain).
2. Bootstrap secrets/vars and hostname layout: [cloudflare-secrets.md](./cloudflare-secrets.md).
3. Apply infra: `cd infra/cloudflare && pulumi up` (or merge to `main` for CI).
4. Push to `main`; CI builds and runs `wrangler pages deploy`.

Without a custom domain, the site is available at `https://<PAGES_PROJECT_NAME>.pages.dev` after the first deploy.

## Derived outputs

Changelog, docs screenshots, and related artifacts:

```bash
bin/sync-derived.sh
```

CI runs the same steps weekly via **Refresh derived**.
