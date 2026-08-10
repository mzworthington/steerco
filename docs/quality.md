# Quality

The template ships a full local + CI quality toolchain, not “add Prettier later.”

**In the box by name:**

| Tool                             | Role                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| **Prettier**                     | Opinionated formatting (incl. Tailwind class sorting via `prettier-plugin-tailwindcss`) |
| **oxlint**                       | Fast lint for `src/`                                                                    |
| **TypeScript**                   | Strict `tsc --noEmit` typecheck                                                         |
| **knip**                         | Unused files, exports, and dependencies (`app/knip.json`)                               |
| **Vitest** + **Testing Library** | Unit / component tests                                                                  |
| **Husky**                        | Git hooks (`.husky/pre-commit`)                                                         |
| **lint-staged**                  | Prettier on staged files before the full pre-commit suite                               |
| **CodeQL**                       | GitHub security analysis for JS/TS                                                      |
| **Lighthouse CI**                | Perf / a11y / SEO gates (`app/lighthouserc.cjs`)                                        |
| **Playwright**                   | Docs/README screenshot capture (`pnpm record:docs-media`)                               |

Quality is layered so problems fail early: on your laptop, on every PR, and on a weekly schedule for slower checks.

## Local gates

Run from `app/`:

| Command                             | Tool                            | Catches                                     |
| ----------------------------------- | ------------------------------- | ------------------------------------------- |
| `pnpm format` / `pnpm format:check` | **Prettier**                    | Style drift across app, docs, and workflows |
| `pnpm lint`                         | **oxlint**                      | Obvious bugs and smell in `src/`            |
| `pnpm typecheck`                    | **TypeScript** (`tsc --noEmit`) | Type errors before runtime                  |
| `pnpm knip`                         | **knip**                        | Unused files, exports, and dependencies     |
| `pnpm test`                         | **Vitest** + Testing Library    | Unit / component regressions                |
| `pnpm build`                        | `tsc` + Vite                    | Production bundle breaks                    |

```bash
cd app
pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build
```

## Pre-commit (Husky + lint-staged)

On relevant staged files (`app/`, `docs/`, or common source extensions), `.husky/pre-commit` runs:

1. **lint-staged**: **Prettier** `--write` on staged paths
2. **`pnpm format:check`**: full Prettier scope (app + root docs / GitHub YAML)
3. **`pnpm lint`** (**oxlint**) + **`pnpm typecheck`** (**TypeScript**)

So formatting and type breaks rarely wait for CI. **knip** and **Vitest** still run in CI on every PR (and you can run them locally anytime).

## CI (every PR / `main`)

The **CI & Deployment** workflow runs the same local suite:

`format:check` → `lint` → `typecheck` → **knip** → **test** → **build**

Deploy to Pages only happens after those jobs succeed on `main`.

## Security (CodeQL)

**CodeQL** analyzes JavaScript/TypeScript on push/PR to `main` and on a weekly schedule. Findings show up in GitHub’s security view.

## Performance & a11y (Lighthouse CI)

**Lighthouse CI** builds the app, serves the preview, and scores `/` and docs routes. Config: `app/lighthouserc.cjs`.

| Category       | Gate              |
| -------------- | ----------------- |
| Accessibility  | error below `0.9` |
| Best practices | warn below `0.85` |
| SEO            | warn below `0.8`  |
| Performance    | warn below `0.45` |
| PWA            | off               |

Weekly workflow uploads the report artifact; locally: `pnpm build && pnpm test:lighthouse`.

## Docs media (Playwright)

**Playwright** (gated by `RECORD_DOCS_MEDIA=1`) captures README/docs screenshots via `pnpm record:docs-media`. The weekly **Refresh derived** workflow can regenerate them with the changelog.

## Why this mix

| Tool                                       | Job                                                  |
| ------------------------------------------ | ---------------------------------------------------- |
| **Prettier** + **oxlint** + **TypeScript** | Fast feedback while editing                          |
| **knip**                                   | Keep the fork lean (dead code / deps)                |
| **Vitest**                                 | Protect behavior you care about                      |
| **Husky** + **lint-staged**                | Don’t wait for CI for the cheap checks               |
| **CodeQL**                                 | Security signal without a separate SaaS              |
| **Lighthouse CI**                          | Catch a11y/SEO/perf regressions after the UI settles |
| **Playwright**                             | Keep README screenshots honest                       |

Next: [Workflows](/docs/workflows) · [Setup](/docs/setup) · [Tech stack](/docs/tech-stack)
