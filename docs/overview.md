# What's included

Everything below ships when you create from the template, not a backlog of “nice to haves.”

| You get             | What it is                                                                                                                                                                                                      |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Site**            | Vite + React + TypeScript SPA under `app/`, Tailwind coastal-ink UI + lightweight [`/design-system`](/design-system) showcase, routing, and `bin/init-project.sh` for brand name, slug, and origin.             |
| **Hosting**         | Cloudflare Pages: Pulumi defines the project (+ optional custom domain), CI builds on `main`, Wrangler deploys `app/dist`. `*.pages.dev` works before DNS is ready. See [Custom domains](/docs/custom-domains). |
| **Docs**            | Git-backed doc store: Markdown under `docs/` rendered in-app at `/docs`, with no separate docs framework or object storage.                                                                                     |
| **CI & quality**    | Named toolchain: **Prettier**, **oxlint**, **TypeScript**, **knip**, **Vitest**, **Husky** + **lint-staged** pre-commit, plus **CodeQL** and **Lighthouse CI**; see [Quality](/docs/quality).                   |
| **Release hygiene** | git-cliff changelog, weekly derived sync (changelog + docs screenshots), Lighthouse CI with report artifacts.                                                                                                   |
| **Agent-ready**     | Thin `AGENTS.md` → [agent-lifecycle-kit](https://github.com/mzworthington/agent-lifecycle-kit).                                                                                                                 |

```text
Browser  →  React site (+ /docs)  →  Cloudflare Pages
Git      →  docs/*.md (source of truth)
GitHub   →  CI quality gates → wrangler pages deploy
Pulumi   →  Pages project + optional custom domain
```

Next: [Setup](/docs/setup) · [Custom domains](/docs/custom-domains) · [Design system](/docs/design-system) · [Design pack](/docs/design-pack) · [Quality](/docs/quality) · [Workflows](/docs/workflows) · [Architecture](/docs/architecture)
