---
status: Accepted
date: 2026-08-10
deciders: ['SteerLens']
---

# 0004. Suite relationship with ArchLens

## Context and Problem Statement

SteerLens and ArchLens both serve engineering leadership concerns but different jobs: investment alignment vs architecture risk. Combining UIs would expose executives to C4/YAML and dilute ArchLens focus.

## Decision Drivers

- Keep executive chrome free of builder tooling
- Allow a narrow data link later without shared UI
- Preserve distinct visual languages

## Considered Options

- Option A: One combined “Lens” app with shared chrome
- Option B: Same portfolio, separate products and themes; optional `systemRefs` later
- Option C: No relationship at all

## Decision Outcome

Chosen option: **Option B**.

- Same portfolio, separate products and visual languages
- Optional data link later: `bets[].systemRefs` → ArchLens entityRefs
- No shared UI component library requirement
- Marketing may say “Lens family”; apps do not share chrome

### Consequences

- Good, because sponsors stay in a board-pack surface
- Bad, because some Vite/Zod/Cloudflare patterns are duplicated (accepted)
- Follow-up: deep links out of SteerLens for architecture detail

## Links

- Related: [0002 Tech stack](./0002-tech-stack.md)
