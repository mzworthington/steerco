---
status: Accepted
date: 2026-08-10
deciders: ['SteerLens']
---

# 0005. Provider-synced teams are reference-only

## Context and Problem Statement

Many Backstage installs sync Groups from GitHub or Entra and never commit Group catalog files. Emitting Group YAML would duplicate entities and fight providers.

## Decision Drivers

- Never become a competing system of record for people/teams
- Keep SteerSpec as intent + references
- Safe write-back policy for Slice 2+

## Considered Options

- Option A: Always emit Backstage Group YAML for teams SteerLens knows
- Option B: Reference provider teams; deny Group write-back except explicit `catalog_file` opt-in
- Option C: Own a parallel org directory inside SteerLens only

## Decision Outcome

Chosen option: **Option B**.

- Ingest teams via Catalog API / GitHub / Entra as **references**
- Persist intent in SteerSpec (+ optional SteerLens-owned overlay kinds)
- **Deny** Group catalog write-back when `provenance` is `backstage` (provider), `github`, or `entra`
- Allow Group YAML round-trip only for `provenance: catalog_file` with explicit opt-in

### Consequences

- Good, because providers remain source of truth for membership
- Follow-up: import UX must show provenance
- Follow-up: Connections PRD must educate “we never create directory groups”
- Technical merge mock is Slice 2+, not Slice 1

## Links

- Related: [0003 Local-first](./0003-local-first-no-auth.md)
- SteerSpec: `plan/docs/STEER_SPEC.md`
