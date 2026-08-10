# Tech stack

| Layer           | Choice                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------ |
| UI              | React 19 + TypeScript under `app/`                                                               |
| Bundler         | Vite 8                                                                                           |
| Styling         | Tailwind CSS 4 coastal-ink tokens + recipes in `app/src/index.css`; showcase at `/design-system` |
| Routing         | wouter                                                                                           |
| Docs            | Markdown under `docs/`, rendered in-app with `react-markdown`                                    |
| Package manager | pnpm 11 (`app/package.json`)                                                                     |
| Toolchain       | Mise                                                                                             |
| Tests           | Vitest + Testing Library                                                                         |
| Unused code     | knip                                                                                             |
| Lint / format   | oxlint + Prettier                                                                                |
| Security        | CodeQL                                                                                           |
| Perf / a11y     | Lighthouse CI (`app/lighthouserc.cjs`)                                                           |
| Hosting         | Cloudflare Pages (Wrangler deploy)                                                               |
| IaC             | Pulumi (`infra/cloudflare`)                                                                      |
| Changelog       | git-cliff + day-bucketed renderer                                                                |

## Agent / Cloud

Cursor Cloud agents bootstrap via `.cursor/environment.json` → `bin/setup-dev-env.sh`, which installs mise tools and `app/` dependencies and optionally clones [agent-lifecycle-kit](https://github.com/mzworthington/agent-lifecycle-kit).
