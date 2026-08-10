# PRD F12 - Technical mode

**Slice:** 2+ · **Mockups:** `technical/steerlens-01-steer-tree.png`, `technical/steerlens-02-topology-fitness.png`  
**Frameworks:** EDGE + Team Topologies vocabulary bridge for staff+ — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Staff+ engineers need refs, provenance, and write-back policy without forcing executives through that density.

## Goal

Secondary surface for SteerSpec detail, topology fitness with policy panel, and advanced exports — including explicit Goal / MoS / stream-aligned / platform grouping aliases without changing executive chrome.

## User stories

- As a principal engineer, I inspect external refs and provenance.
- As a platform engineer, I confirm Group YAML write-back is blocked for Entra-backed teams.
- As a staff engineer, I see how SteerSpec fields map to EDGE LVT and Team Topologies types/modes.

## Requirements

1. Feature flag / nav entry “Technical” not shown in Slice 1 (or clearly disabled)
2. Steer tree with ids/refs
3. Write-back policy panel (readouts)
4. Does not replace executive screens; deep-link back
5. Compact vocabulary bridge (Goal≈Outcome, MoS≈metrics, stream-aligned≈customer-facing, platform grouping note, interaction mode aliases)
6. Topology fitness view highlights mismatches including load/flow and (from Slice 1.5) MoS-link / collab time-box codes

## Acceptance

- Policy panel matches ADR 0005 / provider write-back rules
- Vocabulary bridge visible without becoming default executive theme
- Visual density may increase but must not become default theme

## XFN

A11y still required · Do not share ArchLens component theme tokens
