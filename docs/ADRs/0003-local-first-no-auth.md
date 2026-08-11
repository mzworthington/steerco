---
status: Accepted
date: 2026-08-10
deciders: ['SteerLens']
---

# 0003. Local-first, no auth in Slice 1

## Context and Problem Statement

Connectors (Backstage, GitHub, Entra) require identity. Shipping auth before the executive workflow is proven risks building login for an unused product. Leaders also need an air-gappable demo for diligence and steering narratives.

## Decision Drivers

- Prove SteerSpec and executive UX before OAuth cost
- Offline / diligence-friendly demos
- Avoid premature trust-boundary surface

## Considered Options

- Option A: Accounts + cloud sync from day one
- Option B: Local-only Slice 1; auth arrives with the first live connector
- Option C: Anonymous cloud workspaces without IdP

## Decision Outcome

Chosen option: **Option B**. Slice 1 is **local only**:

- Open folder / sample workspace
- Persist `steertree.yaml` on disk
- No accounts, no cloud sync, no mandatory network

Auth arrives in Slice 2 **with** the first live connector - not before.

### Consequences

- Good, because feedback on UX and SteerSpec is faster
- Good, because PDF/export and mismatch rules must work on sample/manual data
- Follow-up: FS Access API fallback (download/upload) for Safari gaps
- Follow-up: OAuth security review before Slice 2 release

## Links

- Roadmap Slice 1: `plan/docs/ROADMAP.md`
- Related: [0005 Provider teams reference-only](./0005-provider-teams-reference-only.md)
