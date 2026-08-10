# PRD F03 - How work is organised

**Slice:** 1 · **Mockups:** `steerlens-exec-02-org-shape.png`, `steerlens-exec-10-org-empty.png`  
**Frameworks:** Team Topologies 2e (fast flow, cognitive load, platform purpose) — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Executives confuse HR org charts with delivery topology. They need a plain-language view of how teams interact to deliver bets.

## Goal

Edit and present customer-facing teams, shared platform, and coaching support - with relationship labels in English. Teach that shape is **intent for fast flow of value**, not a reporting chart.

## User stories

- As a Director, I can add a team by display name only.
- As a Director, I can say a team “uses [platform] as a service”.
- As a sponsor, I see overload called out calmly when too many teams depend on the platform — framed as **cognitive load / flow risk**, not headcount shame.
- As a new user, I see an empty state that teaches the three purposes (customer-facing, platform, coaching/support).

## Requirements

1. Three zones matching `team.role` (Slice 1); leave room for a fourth purpose later (`complicated_subsystem` in Slice 1.5)
2. Relationships as labelled edges (`uses as a service`, `works together`, `coaching`) — map to TT X-as-a-Service / Collaboration / Facilitation in glossary only
3. Empty state CTA: Add a team; copy: purposes of teams, relationships = how work flows, platform exists to **reduce load** on customer-facing teams, shape evolves
4. Mismatch banner for `platform_overload` (threshold configurable in core, default 8) — wording references load on the platform and slower flow for dependents
5. No Backstage/GitHub/Entra labels in default UI
6. Button: Prepare decision note (deep link to F07)

**Slice 1.5+:** time-box collaboration (`expectedUntil`); optional specialist-subsystem zone; Slice 3: platform / value-stream **groupings** with fractal zoom.

## Acceptance

- Creating teams + relationship updates SteerSpec
- Empty state matches mockup intent and teaches load/flow purpose of platform
- Overload appears when dependents ≥ threshold with load/flow framing

## XFN

A11y: relationships available as list alternative to canvas · Keyboard add-team flow
