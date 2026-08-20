# PRD F12 - Technical mode

**Slice:** 2+ · **Mockups:** `technical/steerco-01-steer-tree.png`, `technical/steerco-02-topology-fitness.png`  
**Frameworks:** EDGE + Domain-Driven Design (Eric Evans) + Team Topologies vocabulary bridge for staff+ - see [operating-model-alignment.md](../operating-model-alignment.md)

## Problem

Staff+ engineers need refs, provenance, and write-back policy without forcing executives through that density.

## Goal

Secondary surface for SteerSpec detail, topology fitness with policy panel, and advanced exports - including explicit Goal / MoS / stream-aligned / platform grouping aliases, **DDD bounded-context / ubiquitous-language / fracture-plane terms**, **and** EDGE-beyond-LVT terms (PVR, Product brief, Tech@Core, Integrated Backlog, six principles) without changing executive chrome.

## User stories

- As a principal engineer, I inspect external refs and provenance.
- As a platform engineer, I configure Group YAML write-back and export settings for Backstage-backed teams.
- As a staff engineer, I see how SteerSpec fields map to the full EDGE toolkit (not LVT alone), Eric Evans’ DDD, and Team Topologies types/modes.

## Requirements

1. Feature flag / nav entry “Technical” not shown in Slice 1 (or clearly disabled)
2. Steer tree with ids/refs
3. Write-back policy panel (readouts)
4. Does not replace executive screens; deep-link back
5. Compact vocabulary bridge:
   - LVT: Goal (schema `outcomes[]`), MoS≈metrics, Initiative reserved
   - Beyond LVT: PVR≈decision notes + review dates; Product brief (`products[]`); Tech@Core≈capability bets + optional radar link; Integrated Backlog≈fundingStance / mix cues; six EDGE principles listed
   - DDD: bounded context≈`domains[]`; ubiquitous language; fracture planes; leadership outside the stream
   - TT: stream-aligned≈customer-facing legacy, platform grouping note, interaction mode aliases; domain/stream/team lenses
6. Topology fitness view highlights mismatches including load/flow and (from Slice 1.5) MoS-link / collab time-box codes

## Acceptance

- Policy panel matches ADR 0010 / provider write-back rules

- Vocabulary bridge visible without becoming default executive theme
- Visual density may increase but must not become default theme

## XFN

A11y still required · Do not share ArchLens component theme tokens
