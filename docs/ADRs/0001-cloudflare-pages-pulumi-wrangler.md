---
status: Accepted
date: 2026-08-07
deciders: ['SteerLens']
---

# 0001. Cloudflare Pages static hosting with Pulumi and Wrangler

## Context and Problem Statement

SteerLens needs a reproducible path from git to a public SPA with infrastructure defined in-repo, without dashboard-only Cloudflare configuration.

## Decision Drivers

- Deploy and DNS stay reviewable in git
- Minimal moving parts: one Vite production build
- Remote encrypted Pulumi state

## Considered Options

- Option A: GitHub Pages only
- Option B: Cloudflare Pages via dashboard Git integration
- Option C: Pulumi for Pages/domains + GitHub Actions + Wrangler upload

## Decision Outcome

Chosen option: **Option C**. Pulumi manages the Pages project and optional custom domains; CI builds `dist/` and runs `wrangler pages deploy`. SPA routing uses `public/_redirects`.

### Consequences

- Good, because deploy stays behind quality gates
- Good, because `*.pages.dev` works before custom DNS is ready
- Bad, because an existing active Cloudflare zone is required before attaching custom subdomains

## Links

- [Cloudflare secrets](../cloudflare-secrets.md)
- Related: [0002 Tech stack](./0002-tech-stack.md)
