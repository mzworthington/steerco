# PRD F06 - Evidence

**Slice:** 1 · **Mockup:** `steerco-exec-07-evidence.png`  
**Frameworks:** EDGE adapt / learn loop - see [operating-model-alignment.md](../operating-model-alignment.md)

## Problem

Decision notes need numbers, but Slice 1 has no live connectors.

## Goal

Show plain-language metric stories from sample/manual evidence; set expectations that live systems come later. Lead with **what we learned**, not only the figure.

## User stories

- As a Director, I review a few metrics that matter before writing a decision note.
- As a Director, I understand data may be sample until connections exist.
- As a Director, I can carry learning + numbers into a decision note.

## Requirements

1. List metrics with large figures + one-line interpretation (learning cue first where both exist)
2. Badge/copy: “Sample data · connect systems later”
3. CTA: Use in decision note (pre-fills `measured[]` with MoS title + interpretation where possible)
4. Allow manual override of values
5. CTA: **Add evidence** - create a measure on a goal plus a manual `evidence[]` provenance row (title, current/target, learning cue, optional note)

## Acceptance

- Sample evidence visible for delivery metrics
- “Use in decision note” navigates to F07 with measured lines populated
- “Add evidence” creates a MoS on the chosen goal and shows it on the Evidence page without leaving the app

## XFN

Privacy: no external fetches Slice 1
