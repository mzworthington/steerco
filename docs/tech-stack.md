# Tech stack

| Layer           | Choice                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| Domain          | `@steerco/core` - TypeScript + Zod + YAML (SteerSpec)                                                               |
| UI              | React 19 + TypeScript under `app/` (`@steerco/app`)                                                                 |
| Bundler         | Vite 8 + vite-plugin-pwa (installable app shell)                                                                    |
| Styling         | Tailwind CSS 4 executive tokens (stone + ocean) + recipes in `app/src/index.css`; showcase at `/docs/design-system` |
| Routing         | wouter                                                                                                              |
| Docs            | Markdown under `docs/`, rendered in-app with `react-markdown`                                                       |
| Product plan    | Specs / PRDs / schema under `plan/`                                                                                 |
| Package manager | pnpm 11 workspace (`app/` + `packages/*`)                                                                           |
| Toolchain       | Mise                                                                                                                |
| Tests           | Vitest + Testing Library                                                                                            |
| Unused code     | knip                                                                                                                |
| Lint / format   | oxlint + Prettier                                                                                                   |
| Security        | CodeQL                                                                                                              |
| Perf / a11y     | Lighthouse CI (`app/lighthouserc.cjs`)                                                                              |
| Hosting         | Cloudflare Pages (Wrangler deploy)                                                                                  |
| IaC             | Pulumi (`infra/cloudflare`)                                                                                         |
| Changelog       | git-cliff + day-bucketed renderer                                                                                   |

ADRs: [0002 Tech stack](./ADRs/0002-tech-stack.md) · [0003 Local-first](./ADRs/0003-local-first-no-auth.md) · [0001 Hosting](./ADRs/0001-cloudflare-pages-pulumi-wrangler.md).

## Agent / Cloud

Cursor Cloud agents bootstrap via `.cursor/environment.json` → `bin/setup-dev-env.sh`, which installs mise tools and `app/` dependencies and optionally clones [Waykit](https://github.com/mzworthington/waykit).
