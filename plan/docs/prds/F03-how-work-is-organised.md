# PRD F03 - How work is organised

**Slice:** 1 · **Mockups:** `steerlens-exec-02-org-shape.png`, `steerlens-exec-10-org-empty.png`  
**Frameworks:** [Team Topologies key concepts](https://teamtopologies.com/key-concepts) (four topologies, three interaction modes, cognitive load, fast flow) — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Executives confuse HR org charts with delivery topology. They need a view of how teams interact to deliver bets that is grounded in Team Topologies — not invented department types.

## Goal

Edit and present the **four fundamental team types** and **three interaction modes**, with capacity (members + FTE%) as a load signal. Teach that shape is **intent for fast flow of value**, not a reporting chart.

## User stories

- As a Director, I can add a team by display name and Team Topologies type.
- As a Director, I can say a team uses another **as a service**, **collaborates**, or **facilitates**.
- As a sponsor, I see overload called out calmly when too many teams depend on the platform — framed as **cognitive load / flow risk**, not headcount shame.
- As a new user, I see empty zones that teach all four purposes (stream-aligned, platform, enabling, complicated subsystem).
- As a Director, I can see member count and FTE allocation per team as capacity context (not an HR roster).

## Requirements

1. Four zones matching `team.role`: `stream_aligned` | `platform` | `enabling` | `complicated_subsystem`
2. Relationships as labelled edges using TT modes: `x_as_a_service` | `collaboration` | `facilitation` (plain-language sentences in UI)
3. Empty state CTA: Add a team; copy teaches four types + three modes; platform exists to **reduce load** on stream-aligned teams; shape evolves
4. Optional `teams[].members[]` with `displayName`, `discipline`, job `title`, `ftePercent` (0–100); show member count + FTE total on team cards
5. Mismatch banner for `platform_overload` (threshold configurable in core, default 8) — wording references load on the platform and slower flow for dependents
6. No Backstage/GitHub/Entra labels in default UI
7. Button: Prepare decision note (deep link to F07)

**Slice 1.5+:** time-box collaboration/facilitation (`expectedUntil` / effective windows); member edit UI; dated capacity toward [F13](./F13-topology-timeline.md).  
**Slice 3:** **value stream** and **platform** **groupings** ([TT 2e](https://teamtopologies.com/key-concepts-content/groupings)) so teams sit under a shared business domain / value stream or platform purpose, with fractal zoom; **topology timeline** view ([F13](./F13-topology-timeline.md)).

## Acceptance

- Creating teams + relationship updates SteerSpec with TT-canonical roles/modes
- Empty state teaches four topologies and three interaction modes
- Sample shows member/FTE capacity on stream-aligned and platform teams
- Overload appears when X-as-a-Service dependents ≥ threshold with load/flow framing

## XFN

A11y: relationships available as list alternative to canvas · Keyboard add-team flow
