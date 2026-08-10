# SteerLens

SteerLens is an interactive board pack for Engineering Directors and executive sponsors: align **outcomes**, **funded bets**, and **team shape**, then leave with a decision note — not another backlog.

## Problem

Jira holds work, Backstage holds services, and directories hold people. Nothing holds the **investment contract**, so steering meetings re-litigate priorities in slide decks.

## What you get today

| Area             | Status                                                                    |
| ---------------- | ------------------------------------------------------------------------- |
| **Product plan** | Specs, PRDs, SteerSpec schema, and executive mockups under `plan/`        |
| **Domain core**  | `@steerlens/core` — parse, validate, and serialize SteerSpec (YAML)       |
| **Site**         | Vite + React SPA with Coming Soon gate, in-app docs, and `/design-system` |
| **Design**       | Executive stone + ocean theme (distinct from ArchLens)                    |
| **ADRs**         | Accepted decisions under [`docs/ADRs/`](/docs/adrs)                       |
| **Hosting**      | Cloudflare Pages via Pulumi + Wrangler                                    |

Slice 1 (local executive workspace: open sample/folder, steer, decide, export) is the next product vertical — see `plan/docs/ROADMAP.md`.

## Principles

1. **Executive surface first** — no YAML or provider jargon in the default UI.
2. **Reference, don’t replace** — never invent competing IdP/catalog Groups.
3. **Local-first** — full value offline before connectors.
4. **Git-friendly contract** — SteerSpec is diffable YAML.

## Architecture sketch

```text
Browser  →  React app (+ /docs, /design-system)
             └─ @steerlens/core (SteerSpec)
Git      →  docs/*.md · plan/ product specs
GitHub   →  CI quality gates → Cloudflare Pages
Pulumi   →  Pages project + optional custom domain
```

Next: [Setup](/docs/setup) · [Architecture](/docs/architecture) · [Design system](/design-system) · [Tech stack](/docs/tech-stack) · [Quality](/docs/quality) · [Workflows](/docs/workflows)
