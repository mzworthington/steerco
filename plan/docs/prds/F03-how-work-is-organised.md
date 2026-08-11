# PRD F03 - How work is organised

**Slice:** 1 · **Mockups:** `steerlens-exec-02-org-shape.png`, `steerlens-exec-10-org-empty.png`  
**Frameworks:** [Team Topologies key concepts](https://teamtopologies.com/key-concepts) (four topologies, three interaction modes, cognitive load, fast flow, flow of change) — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Executives confuse HR org charts with delivery topology. Flat “four type zones” teach vocabulary but do not scale when ~20 teams span many domains. Leaders need a view of how change flows through stream-aligned teams — with platforms, enabling, and complicated-subsystem teams scoped as support — grounded in Team Topologies, not invented department types.

## Goal

Edit and present **topology intent for fast flow of value**: four fundamental team types, three interaction modes, and (at scale) a **flow-of-change** layout with value-stream / platform groupings. Capacity (members + FTE%) is a load signal. Shape is **point-in-time intent**, not a reporting chart.

## User stories

- As a Director, I can add a team by display name and Team Topologies type.
- As a Director, I can say a team uses another **as a service**, **collaborates**, or **facilitates**.
- As a sponsor, I see overload called out calmly when too many teams depend on the platform — framed as **cognitive load / flow risk**, not headcount shame.
- As a new user, I see empty zones that teach all four purposes (stream-aligned, platform, enabling, complicated subsystem).
- As a Director, I can see member count and FTE allocation per team as capacity context (not an HR roster).
- As a Director (Slice 3), I organise teams under **value streams** and **platform groupings**, with stream-aligned teams as the spine of the map.
- As a Director (Slice 3), I set a platform’s **scope** (organisation / vertical / single team) so layout and load cues match who it accelerates.
- As a Director (Slice 3), I nest a **complicated subsystem** inside a stream as a team-within-a-team.
- As a coach (Slice 3), I see one **enabling** team facilitating multiple streams without treating that fan-out as an error.
- As a sponsor (Slice 3), I pick an **as-of date** on the org view and see the projected shape and mismatches for that day.

## Requirements

### Slice 1 (landed)

1. Four zones matching `team.role`: `stream_aligned` | `platform` | `enabling` | `complicated_subsystem`
2. Relationships as labelled edges using TT modes: `x_as_a_service` | `collaboration` | `facilitation` (plain-language sentences in UI)
3. Empty state CTA: Add a team; copy teaches four types + three modes; platform exists to **reduce load** on stream-aligned teams; shape evolves
4. Optional `teams[].members[]` with `displayName`, `discipline`, job `title`, `ftePercent` (0–100); show member count + FTE total on team cards
5. Mismatch banner for `platform_overload` (threshold configurable in core, default 8) — wording references load on the platform and slower flow for dependents
6. No Backstage/GitHub/Entra labels in default UI
7. Button: Prepare decision note (deep link to F07)

**Slice 1.5+:** time-box collaboration/facilitation (`expectedUntil` / effective windows); member edit UI; dated capacity toward [F13](./F13-topology-timeline.md).

### Slice 3 (scale layout)

8. SteerSpec `groupings[]` (`platform` | `value_stream`) with kinded team `members[]`; fractal membership
9. `platformScope`: `organisation` | `vertical` | `team` on platform teams and platform groupings
10. Complicated-subsystem nest via optional `within` (stream-aligned team ref) and/or value-stream grouping membership — draw as team-within-team
11. Default populated layout: **flow-of-change canvas** (change toward customer; streams as primary bands; platforms by scope; enabling beside dependents). Four type zones remain teaching / filter / empty-state, not the only scale layout
12. **As-of date** control on this view: project teams, members, relationships, and mismatches as of the selected date (default today). Timeline deep-dive stays [F13](./F13-topology-timeline.md)
13. Derived visual may be exported for board pack Work section — use SteerLens shapes, never proprietary TT book diagrams
14. Enabling one-to-many facilitation is expected; sole delivery ownership of a bet remains a mismatch (`enabling_owns_delivery`)

## Acceptance

- Creating teams + relationship updates SteerSpec with TT-canonical roles/modes
- Empty state teaches four topologies and three interaction modes
- Sample shows member/FTE capacity on stream-aligned and platform teams
- Overload appears when X-as-a-Service dependents ≥ threshold with load/flow framing
- Slice 3: sample with ≥2 value streams, a scoped platform, nested CSS, and multi-team enabling renders as flow-of-change (not only four flat zones)
- Slice 3: changing as-of date updates projected org shape and mismatches without leaving the page

## XFN

A11y: relationships available as list alternative to canvas · Keyboard add-team flow · As-of control labelled; list alternative for projected relationships
