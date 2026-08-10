# SteerLens

**Investment alignment for engineering leaders** — a board-pack you can interact with.

SteerLens helps Engineering Directors and non-technical executives keep **strategy, team shape, and evidence** aligned — and decide what to start, stop, or continue. It is intentionally **not** Jira, not an org directory, and not a service catalog.

| Related                               | Role                                                           |
| ------------------------------------- | -------------------------------------------------------------- |
| **SteerLens**                         | Bets, outcomes, topology _intent_, decision notes              |
| **[ArchLens](https://archlens.dev)**  | Systems architecture risk (separate product & visual language) |
| **Jira / Backstage / Entra / GitHub** | Systems of record SteerLens _references_ (never replaces)      |

This folder holds **product planning** (specs, PRDs, schema, samples). Implementation lives under `app/`; accepted architecture decisions live under [`docs/ADRs/`](../docs/ADRs/).

## Contents

| Path                                             | Purpose                                    |
| ------------------------------------------------ | ------------------------------------------ |
| [docs/PRESS_RELEASE.md](./docs/PRESS_RELEASE.md) | Positioning / launch narrative             |
| [docs/PRODUCT_SPEC.md](./docs/PRODUCT_SPEC.md)   | Domain glossary, acceptance scenarios, XFN |
| [docs/OPERATING_MODEL_ALIGNMENT.md](./docs/OPERATING_MODEL_ALIGNMENT.md) | EDGE (LVT) + Team Topologies 2e backlog & vocabulary bridge |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md)       | Stack notes (see also ADR 0002)            |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)   | Hexagonal architecture & adapters          |
| [docs/STEER_SPEC.md](./docs/STEER_SPEC.md)       | Canonical SteerSpec contract               |
| [docs/ROADMAP.md](./docs/ROADMAP.md)             | Slices and non-goals                       |
| [docs/MOCKUPS.md](./docs/MOCKUPS.md)             | Screen index                               |
| [docs/prds/](./docs/prds/)                       | Per-feature PRDs                           |
| [schemas/](./schemas/)                           | JSON Schema for SteerSpec                  |
| [samples/](./samples/)                           | Example `steertree.yaml`                   |

Executive mockups also live at repo-root [`mockups/`](../mockups/).

## ADRs

Canonical ADRs: [`docs/ADRs/`](../docs/ADRs/) (tech stack, local-first, suite relationship, provider write-back, hosting).

## Slice direction (summary)

- **Slice 1** — Local only; open a folder; edit SteerSpec; export a board pack; EDGE/TT copy & Invest/Work/Adapt pack (no schema break)
- **Slice 1.5** — Additive SteerSpec for MoS links, funding review cues, TT roles/time-boxes, richer mismatches
- **Slice 2+** — Auth and connectors (Backstage / GitHub / Entra); Technical mode vocabulary bridge
- **Slice 3** — Groupings / initiatives / suite links (ArchLens, CI)

Full roadmap: [docs/ROADMAP.md](./docs/ROADMAP.md). Framework backlog: [docs/OPERATING_MODEL_ALIGNMENT.md](./docs/OPERATING_MODEL_ALIGNMENT.md).

## One-liner

> Jira plans work. Backstage catalogs systems. Entra catalogs people. SteerLens contracts how outcomes, bets, topology intent, and evidence stay aligned — and when to stop.
