# Quality

SteerCo keeps a full local + CI quality toolchain so regressions fail early.

**Toolchain:**

| Tool                             | Role                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| **Prettier**                     | Opinionated formatting (incl. Tailwind class sorting via `prettier-plugin-tailwindcss`) |
| **oxlint**                       | Fast lint for `app/src` and `packages/core/src`                                         |
| **TypeScript**                   | Strict `tsc --noEmit` for the SPA and `@steerco/core`                                   |
| **knip**                         | Unused files, exports, and dependencies (`app/knip.json`)                               |
| **Vitest** + **Testing Library** | Unit / component tests (app + core)                                                     |
| **Husky**                        | Git hooks (`.husky/pre-commit`)                                                         |
| **lint-staged**                  | Prettier on staged files before the full pre-commit suite                               |
| **CodeQL**                       | GitHub security analysis for JS/TS                                                      |
| **Lighthouse CI**                | Perf / a11y / SEO gates (`app/lighthouserc.cjs`)                                        |
| **Playwright**                   | Docs screenshot capture (`pnpm record:docs-media`)                                      |

## Local gates

Run from `app/`:

| Command                             | Tool                         | Catches                                     |
| ----------------------------------- | ---------------------------- | ------------------------------------------- |
| `pnpm format` / `pnpm format:check` | **Prettier**                 | Style drift across app, docs, and workflows |
| `pnpm lint`                         | **oxlint**                   | Bugs and smell in app + core sources        |
| `pnpm typecheck`                    | **TypeScript**               | Type errors before runtime                  |
| `pnpm knip`                         | **knip**                     | Unused files, exports, and dependencies     |
| `pnpm test`                         | **Vitest** + Testing Library | Unit / component regressions                |
| `pnpm build`                        | `tsc` + Vite                 | Production bundle breaks                    |

```bash
cd app
pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build
```

## Pre-commit (Husky + lint-staged)

On relevant staged files (`app/`, `docs/`, or common source extensions), `.husky/pre-commit` runs:

1. **lint-staged**: **Prettier** `--write` on staged paths
2. **`pnpm format:check`**: full Prettier scope (app + root docs / GitHub YAML)
3. **`pnpm lint`** (**oxlint**) + **`pnpm typecheck`** (**TypeScript**) + **`pnpm knip`**

**Vitest** still runs in CI on every PR (and locally anytime).

## CI (every PR / `main`)

The **CI & Deployment** workflow runs:

`format:check` → `lint` → `typecheck` → **knip** → **test** → **build**

Deploy to Pages only happens after those jobs succeed on `main`.

## Security (CodeQL)

**CodeQL** analyzes JavaScript/TypeScript on push/PR to `main` and on a weekly schedule. Findings show up in GitHub’s security view.

## Performance & a11y (Lighthouse CI)

**Lighthouse CI** builds the app, serves the preview, and scores `/` and docs routes. Config: `app/lighthouserc.cjs`.

| Category       | Gate                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------- |
| Accessibility  | error below `0.9`                                                                              |
| Best practices | warn below `0.85`                                                                              |
| SEO            | warn below `0.8`                                                                               |
| Performance    | warn below `0.45`                                                                              |
| PWA            | off in Lighthouse 12+ (no PWA audits); verified by `pnpm build` → `scripts/verifyPwaBuild.mjs` |

Weekly workflow uploads the report artifact; locally: `pnpm build && pnpm test:lighthouse`.

## Docs media (Playwright)

**Playwright** (gated by `RECORD_DOCS_MEDIA=1`) captures docs screenshots via `pnpm record:docs-media`. The weekly **Refresh derived** workflow can regenerate them with the changelog.

Next: [Workflows](/docs/workflows) · [Setup](/docs/setup) · [Tech stack](/docs/tech-stack)
