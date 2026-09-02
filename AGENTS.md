# Agent Handshake

Standards and lifecycle agents live in `~/.agents` ([Waykit](https://github.com/mzworthington/waykit)).

Before starting work, read:

- `~/.agents/AGENTS.md`: bootstrap and lifecycle routing
- `~/.agents/CODING_PHILOSOPHY.md`: hexagonal architecture, DDD, vertical slices, clean code
- `~/.agents/SOPs/behavior-catalog-and-xfn.md`: tests as behavior catalog; XFN matrix
- `~/.agents/skills/agent-adr/SKILL.md`: sparse ADRs in `docs/ADRs/`

## Toolchain

- Declared in `mise.toml` (Node, pnpm; optional ffmpeg for docs media).
- Cursor Cloud: `.cursor/environment.json` → `bin/setup-dev-env.sh`.
- Set `SKIP_LIFECYCLE_KIT=1` to skip cloning the lifecycle kit.

## Project notes

- Product planning: `docs/` (specs, PRDs in `docs/prds/`), schema in `schemas/`, sample in `samples/`. Mockups: `mockups/`.
- ADRs live only under `docs/ADRs/`.
- App code and pnpm workspace live under `app/` - run `cd app && pnpm …` (`@steerco/app` + `packages/core` → `@steerco/core`).
- Tailwind executive theme (stone + ocean): tokens + recipes in `app/src/index.css`, showcase at `/docs/design-system`, assets in `design-pack/`.
- Docs are Markdown under `docs/`, rendered in-app (not a separate docs framework).
- Hosting is Cloudflare Pages via Pulumi + Wrangler (no R2/catalog).
- Before handover: run pre-commit checks (`cd app && pnpm format:check && pnpm lint && pnpm typecheck && pnpm knip && pnpm test && pnpm build`).
