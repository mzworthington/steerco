# Agent Handshake

Standards and lifecycle agents live in `~/.agents` ([Waykit](https://github.com/mzworthington/waykit)).

Start from `~/.agents/AGENTS.md` (thin index). **Do not** bulk-read philosophy, SOPs, or skills up front.

| Situation                       | Load                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| Any task                        | `~/.agents/AGENTS.md` invariants + phase table                     |
| Architecture / new structure    | `CODING_PHILOSOPHY.md` (or kit-knowledge `get_philosophy_section`) |
| Feature lifecycle               | `skills/agent-orchestrator`                                        |
| Bug / CI / live symptom         | `skills/agent-debug`                                               |
| Cloudflare Pages / RUM / beacon | `skills/agent-cloudflare-ops` (`wk mcp cloudflare-ops --project`)  |
| Sparse ADRs                     | `skills/agent-adr` (`docs/ADRs/` only)                             |
| Handshake / kit bootstrap       | `wk align .`. Community files: `wk doctor .`                       |
| SOP / handover lookup           | kit-knowledge MCP                                                  |
| Durable project facts           | memory MCP (glossary, SLOs, prefs — never secrets)                 |

Phase handovers: `~/.agents/handover/steerlens/`.

For bugs and failed jobs, use `agent-debug`. Do not open the full feature lifecycle unless RCA needs a new capability.

For non-trivial feature work, before coding: inventory tests (functional + XFN), complete an XFN apply/skip matrix, then orchestrator routing (grill if unsettled → spec → TDD → XFN → audit → release).

## SteerLens notes

- Planning: `docs/` (PRDs in `docs/prds/`), schema in `schemas/`, sample in `samples/`, mockups in `mockups/`.
- App workspace: `cd app && pnpm …` (`@steerco/app` + `packages/core` → `@steerco/core`).
- Tailwind executive theme (stone + ocean): `app/src/index.css`, showcase at `/docs/design-system`, assets in `design-pack/`.
- Docs are Markdown under `docs/`, rendered in-app.
- Hosting: Cloudflare Pages via Pulumi + Wrangler (no R2/catalog).

## Toolchain

Declared in `mise.toml` (Node, pnpm; optional ffmpeg). Cloud: `.cursor/environment.json` → `bin/setup-dev-env.sh`. Set `SKIP_LIFECYCLE_KIT=1` to skip cloning Waykit.

MCP: kit `default` in `.cursor/mcp.json`. Do not stack Cloudflare onto that file. For live CF work, `wk mcp cloudflare-ops --project`, then restore `wk mcp default --project`.

Before handover: `cd app && pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build`.
