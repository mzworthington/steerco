# PRD F07 - Decision note

**Slice:** 1 · **Mockup:** `steerco-exec-03-decision-note.png`  
**Frameworks:** EDGE Periodic Value Review (PVR) / lightweight governance - see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Steering committees need a one-page recommendation, not a slide archaeology dig.

## Goal

Author start / continue / stop / re-scope notes with why, measured, who is affected, next step - the **Periodic Value Review** artifact that closes the invest/adapt loop (double down or defund without stage-gate theatre).

## User stories

- As a Director, I recommend stopping a bet with evidence attached.
- As a sponsor, I can export or navigate to board pack including this note.
- As a Director, I can cite Measures of Success in “what we measured” (free text Slice 1; structured MoS refs Slice 1.5).

## Requirements

1. Recommendation enum in plain labels
2. Sections: Why, What we measured, Who is affected, Next step
3. Link optional bet
4. Persist under `spec.decisionNotes`
5. Actions: Save, Export PDF (F08), Share with board (same as export Slice 1)
6. Helper copy: measured lines should prefer goal MoS / evidence language over activity counts; frame the note as a value review decision (Technical mode may say PVR)

**Slice 1.5:** optional structured MoS / metric id references in `measured` (keep free-text bullets for narrative).

## Acceptance

- Creating a stop note for the Loyalty ledger sample persists and lists on steering summary
- Measured lines accept free text bullets

## XFN

A11y: heading structure for memo · Print-friendly CSS
