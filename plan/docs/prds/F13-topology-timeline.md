# PRD F13 - Topology timeline

**Slice:** 1.5 (schema) → 3 (timeline view + org as-of)  
**Frameworks:** Team Topologies (shape evolves; collaboration is time-boxed; cognitive load changes with capacity and interaction modes; flow-of-change is a snapshot in time) — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md) · [key concepts](https://teamtopologies.com/key-concepts)

## Problem

Leaders see today’s topology snapshot but cannot answer: _when did capacity grow or shrink, when did interactions change, and did load get better or worse?_ Without a timeline — and without an **as-of** control on the team view — stop/start decisions lack the “before / after” evidence that Team Topologies assumes when shape evolves.

## Goal

Record and visualise **capacity changes** (members / FTE%) and **relationship changes** (mode start/end, including Collaboration and Facilitation windows) so directors can scrub steering periods. The **org view** carries a lightweight as-of projection; the **timeline** is the deep-dive history surface.

## User stories

- As a Director, I see when a team’s FTE rose or fell (hires, allocations, departures) without opening an HR system.
- As a Director, I see when X-as-a-Service, Collaboration, or Facilitation edges started, ended, or changed mode.
- As a sponsor, I scrub a timeline and understand whether platform dependents or stream capacity moved with the decision we made.
- As a coach, I confirm Collaboration was time-boxed (not an open-ended “works together forever”).
- As a Director, I set an as-of date on **How work is organised** and see the projected flow-of-change shape without opening the full timeline.
- As a sponsor, I open a bet and see which teams were on that bet’s flow **as of** a date ([F04](./F04-bet-detail.md)).

## Requirements

### Schema (Slice 1.5 — additive) — landed

1. Member effective windows: `teams[].members[]` gain optional `effectiveFrom` / `effectiveUntil` (ISO date) and optional `ftePercent` changes via dated events **or** multiple member records with windows (prefer dated `capacityEvents` if clearer in design).
2. Relationship windows: `relationships[]` gain optional `effectiveFrom` / `effectiveUntil` (extends `expectedUntil` for Collaboration/Facilitation; applies to all modes for history).
3. Optional `topologyEvents[]` ledger (append-only friendly) for narrative-friendly diffs: capacity up/down, relationship added/ended/mode-changed, team type change — with `at`, `teamIds`, `relationshipRef`, `summary`.
4. Current org view remains the **as-of today** (or selected date) projection of the ledger + windows.
5. No HR identity sync required — display names and FTE% only.

### Org view as-of (Slice 3 — with [F03](./F03-how-work-is-organised.md))

1. Date control on How work is organised: org shape + mismatches recompute **as of** selected date (default today).
2. Projection includes groupings membership, platform scope, CSS `within` nest, and enabling fan-out when those fields exist.
3. Teaching copy: “This map is a point in time — relationships will change as goals change.”

### Timeline view (Slice 3 — UI)

1. New surface (or F03 mode): **Topology timeline** — horizontal time axis over the steering period (and prior periods if recorded).
2. Lanes (or swimlanes) per value stream / team type zone or per team; markers for capacity deltas and relationship spans.
3. Relationship spans drawn as bands/edges with mode colour + label (X-as-a-Service / Collaboration / Facilitation).
4. Capacity increases/decreases as signed markers or step chart of total FTE per team.
5. Scrubber / date picker: org shape + mismatches recompute **as of** selected date (same projection as F03 as-of).
6. Deep link from a decision note’s “what changed” to the timeline range.
7. A11y: timeline has a list/table alternative (dated events); not colour-only for mode.

## Out of scope

- Live Entra/HR headcount sync as system of record
- Animating proprietary Team Topologies book diagrams
- Project Gantt / Jira roadmap replacement
- Predicting future capacity (manual planned events only if explicitly entered)

## Acceptance

- Schema round-trips capacity and relationship windows without breaking snapshot-only workspaces
- Sample includes at least one capacity change and one time-bounded Collaboration or Facilitation
- Org view as-of changes the projected org shape and mismatches without leaving F03
- Timeline view shows both capacity deltas and relationship spans; as-of date matches the same projection rules as F03
- List alternative enumerates the same events for accessibility

## XFN

A11y: list alternative · Performance: project as-of without full O(n²) re-layout on scrub · Security: no employee IDs/PII beyond display names already in SteerSpec
