# Roadmap

SteerLens delivers an **investment contract** (EDGE value-driven operating model — Lean Value Tree **and** the teachings beyond it) and **topology intent** (Team Topologies) in a steering workspace — with a board pack as the shareable export. Rationale, vocabulary bridge, and detailed checklists: [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md).

## Slice 0 - Spec (this folder)

- [x] Press release, product spec, architecture, tech stack
- [x] SteerSpec schema + sample
- [x] Executive mockups
- [x] Feature PRDs
- [x] ADRs for stack, local-first, suite relationship (canonical under `docs/ADRs/`)
- [x] Operating-model alignment (EDGE + Team Topologies 2e) — [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md)

## Slice 1 - Local executive workspace (no auth)

**Goal:** A leader can open a sample or folder, edit outcomes/bets/teams, see mismatches, write a decision note, and export a board pack - fully offline.

**Operating-model bar (copy + presentation, no schema break):**

- Steering answers EDGE’s three questions in plain language: invest / work / adapt
- Outcomes present **Measures of Success** as a customer-value fitness function, not a metrics warehouse
- Decision notes and review cadence are the **Periodic Value Review (PVR)** ritual (executive: “value review”)
- Docs / glossary treat EDGE **beyond LVT** as first-class: product mindset, Tech@Core, Integrated Backlogs, six principles
- Org shape teaches the **four Team Topologies types** and **three interaction modes**, with platforms reducing cognitive load for faster flow
- Team capacity (members + FTE%) is an optional load signal — not an HR system of record
- Board pack sections map to **Invest / Work / Adapt**
- Stop-ready bets and learning cues are elevated before vanity status

| Capability               | PRD                                        |
| ------------------------ | ------------------------------------------ |
| Workspace home           | [F01](./prds/F01-workspace-home.md)        |
| Steering overview        | [F02](./prds/F02-steering-overview.md)     |
| How work is organised    | [F03](./prds/F03-how-work-is-organised.md) |
| Bet detail               | [F04](./prds/F04-bet-detail.md)            |
| Outcomes                 | [F05](./prds/F05-outcomes.md)              |
| Evidence (sample/manual) | [F06](./prds/F06-evidence.md)              |
| Decision note            | [F07](./prds/F07-decision-note.md)         |
| Export board pack        | [F08](./prds/F08-export-board-pack.md)     |
| SteerSpec persistence    | [F09](./prds/F09-steerspec-persistence.md) — pending-draft diff + Save (folder write or download) |

**Exit criteria:** Playwright critical journey green; axe clean on executive routes; schema validates sample; Invest/Work/Adapt board-pack outline present; platform overload copy references load/flow (not HR headcount).

**Status:** Slice 1 PRDs F01–F09 landed in product. Critical journey + axe: `cd app && pnpm test:e2e`. Folder handles persist in IndexedDB so Save-to-folder can survive refresh (permission re-prompt when the browser requires it).

### Slice 1 follow-ups (backlog)

- [x] **IndexedDB for File System Access handles** — persist folder handles (and optional working-copy metadata) across refresh so **Save to folder** works without re-picking the directory. SteerSpec drafts live in `sessionStorage`; directory handles live in IndexedDB (`steerlens-workspace`). Pattern reference: ArchLens IndexedDB working-copy / baseline. See [F09](./prds/F09-steerspec-persistence.md).

## Slice 1.5 - Operating model depth (additive SteerSpec)

**Goal:** Encode EDGE incremental funding and Team Topologies 2e signals in the contract without becoming a PMO or HR tool.

| Theme                 | Commitments                                                                                                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **EDGE / LVT**        | Bet ↔ MoS link (`metricIds` / `primaryMetricId`); optional `reviewDate` / horizon; `fundingStance` (`explore` \| `exploit` \| `sustain`); optional `kind` (`opportunity` \| `capability`); soft WIP mismatch for stream teams                                                                                 |
| **EDGE beyond LVT**   | MoS fitness framing; PVR = decision notes + review dates; fundingStance as Integrated Backlog mix cue; capability bets as Tech@Core revitalize signal — Product Blueprint schema deferred to Slice 3+                                                                                                          |
| **Team Topologies**   | Four types + three modes are canonical in v1alpha1; `relationships[].expectedUntil` / effective windows for collaboration/facilitation; optional member edit UX; retarget + extend mismatches (`bet_without_mos_link`, `collab_without_end`, `stream_bet_wip`, …); platform / value-stream _groupings_ (domain org) deferred to Slice 3 |
| **Capacity**          | `teams[].members[]` with `discipline` + job `title` + `ftePercent` (schema landed); richer edit/mismatch cues; **dated capacity windows** toward [F13](./prds/F13-topology-timeline.md)                                                                                                                                        |
| **Topology timeline** | Additive temporal fields for member/relationship effective windows (+ optional `topologyEvents[]`); projection “as of” date (UI in Slice 3 — [F13](./prds/F13-topology-timeline.md))                                                                                                                          |
| **Governance**        | Decision notes prefer MoS ids in `measured`; steering “next review” from bet horizons (PVR cadence)                                                                                                                                                                                                            |
| **Docs / Technical**  | Glossary stays TT-first for types/modes; EDGE beyond-LVT vocabulary (PVR, Product Blueprint, Tech@Core, Integrated Backlog, six principles) in docs + [F12](./prds/F12-technical-mode.md)                                                                                                                      |

**PRD impact:** amend F02–F07 + [STEER_SPEC.md](./STEER_SPEC.md) / schema; new mismatch rules in `@steerlens/core`. Prefer additive fields + migrate helpers; bump `apiVersion` only if needed.

**Exit criteria:** Sample workspace uses MoS links + at least one timed collaboration; core mismatch suite covers new codes; executive UI remains jargon-light.

**Status:** Slice 1.5 complete — schema + mismatches + executive edit surfaces (bet MoS/funding/review, relationship `expectedUntil`, member add/edit, decision `measuredMetricIds`, `topologyEvents[]` in contract). Timeline UI remains Slice 3 ([F13](./prds/F13-topology-timeline.md)).

## Slice 2 - Connectors & auth

- Connections settings UI ([F10](./prds/F10-connections.md))
- OAuth for GitHub / Microsoft Entra; Backstage token or session
- Import & merge teams ([F11](./prds/F11-import-merge.md))
- Write-back policy enforced (no provider Group YAML)
- Technical mode surfaces ([F12](./prds/F12-technical-mode.md)) — includes EDGE/TT vocabulary bridge for staff+

## Slice 3 - Portfolio suite links, topology groupings & timeline

- Optional ArchLens `systemRefs` on bets
- CI check action for SteerSpec mismatches (incl. Slice 1.5 codes)
- Optional Backstage overlay `SteerBet` kind docs
- [x] **Team Topologies scale layout ([F03](./prds/F03-how-work-is-organised.md)):** **streams** (flow of change) + optional **domains** (verticals); stream-aligned teams assign via `streamIds` (ideal one; multi allowed with advice); complicated subsystem in a stream (not under a team); platform groupings + `platformScope`; enabling 1→many via facilitation; flow-of-change canvas
- [x] **As-of on org view** ([F13](./prds/F13-topology-timeline.md) projection): lightweight date control on How work is organised; shared member/relationship window projection
- [ ] **Topology timeline deep-dive ([F13](./prds/F13-topology-timeline.md)):** capacity deltas + relationship spans scrubber
- [x] **Bet flow overlay ([F04](./prds/F04-bet-detail.md)):** funded teams + related interactions for a bet as of date (intent, not a Gantt)
- **EDGE:** optional `initiatives[]` under bets (thin narrative slices — never dual backlog)
- Optional WIP / relative value rank UI; capability vs opportunity / sustain **portfolio mix** hint (Integrated Backlog stance — not finance)
- Optional lightweight **Product Blueprint** linked to outcomes/bets
- **Tech@Core:** capability-bet revitalize cues; optional ArchLens `systemRefs`; optional external Tech Radar link (no radar UI)

## Explicit non-goals (all near-term slices)

- Replacing Jira planning or owning execution backlogs
- Mutating Entra membership automatically
- Dark-cyber UI as default
- Multiplayer CRDT editing
- Full BAU vs strategic finance / ROI accounting (EDGE Ch.7) — stance/mix cues only
- Tech Radar product or tech-debt inventory database (refs + capability bets only)
- Heavy Product Blueprint / requirements documentation
- Owning an Integrated Backlog execution system (never replace Jira)
- Full Team Topologies cognitive-load assessment instrument (Weis / 20+ drivers)
- Copying proprietary Team Topologies book diagrams without permission
- Prescribing one “correct” org chart for every customer

## Traceability

| Framework theme                           | Primary slices                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| EDGE LVT + MoS + incremental funding      | 1 (copy), 1.5 (schema), 3 (initiatives / rank)                           |
| EDGE beyond LVT (principles, Blueprint, Tech@Core, PVR, Integrated Backlogs) | 1 (docs/copy), 1.5 (stance/review cues), 3 (blueprint / mix / radar refs) |
| EDGE lightweight governance / PVR         | 1 (F07/F08), 1.5 (MoS-measured + review dates)                           |
| Team Topologies types + interaction modes | 1 (F03), 1.5 (time-box + capacity windows), 3 (flow-of-change + groupings + platform scope + CSS nest) |
| Cognitive load / fast flow as signals     | 1 (copy), 1.5 (mismatches + dated capacity), 3 (fractal zoom + bet flow overlay + timeline) |
| Topology evolution over time              | 1.5 (schema), 3 (F03 as-of + [F13](./prds/F13-topology-timeline.md) view) |
| Full rationale                            | [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md)           |
