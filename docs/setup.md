# Setup & local development

## Prerequisites

- [Mise](https://mise.jdx.dev/) (installs Node and pnpm from `mise.toml`)
- Optional for docs media: `ffmpeg` (via mise), Playwright browsers

## Quick start

```bash
# Greenfield: prompts for name/slug, creates the repo, brands it
curl -fsSL https://raw.githubusercontent.com/mzworthington/react-cloudflare-template/main/scripts/create.sh | bash

# Already cloned from “Use this template”:
bin/init-project.sh   # prompts; or --name / --slug / --origin
bin/setup-dev-env.sh
cd app && pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

App sources and the pnpm workspace live under `app/`. Repo docs stay in `docs/` and are imported by the in-app viewer. Product identity lives in `app/src/siteConfig.ts` (written by `bin/init-project.sh`).

## Quality checks

Named tools (see [Quality](./quality.md)): **Prettier**, **oxlint**, **TypeScript**, **knip**, **Vitest**, **Husky** + **lint-staged**, plus **CodeQL** and **Lighthouse CI** in GitHub Actions.

```bash
cd app
pnpm format:check   # Prettier
pnpm lint           # oxlint
pnpm typecheck      # TypeScript
pnpm knip           # unused code / deps
pnpm test           # Vitest
pnpm build          # production build
```

**Pre-commit:** Husky runs lint-staged (Prettier), then format:check, oxlint, and typecheck on staged `app/` / `docs/` changes. After a UI change, optionally:

```bash
cd app
pnpm build && pnpm test:lighthouse
pnpm record:docs-media   # Playwright screenshots for the README
```

## Cloudflare hosting

1. Create a Cloudflare API token (Pages Edit + Zone DNS Edit if using a custom domain).
2. Follow **[Custom domains](./custom-domains.md)** for hostname layouts (subdomains on an existing zone), `.env`, bootstrap, and verify steps.
3. Secrets/var names: [cloudflare-secrets.md](./cloudflare-secrets.md).
4. Apply infra: `cd infra/cloudflare && pulumi up` (or merge to `main` for CI).
5. Push to `main`; CI builds and runs `wrangler pages deploy`.

Without a custom domain, the site is available at `https://<PAGES_PROJECT_NAME>.pages.dev` after the first deploy.

## Derived outputs

Changelog, docs screenshots, and related artifacts:

```bash
bin/sync-derived.sh
```

CI runs the same steps weekly via **Refresh derived**.
