# PRD F04 - Bet detail

**Slice:** 1 · **Mockup:** `steerlens-exec-06-bet-detail.png`  
**Frameworks:** EDGE Bet (success signal + kill criteria; incremental funding later) — see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Bets need enough structure for decisions without becoming project plans.

## Goal

Edit one bet as a briefing: success signal, kill criteria, funded teams, status — enough for start/stop/continue, not a delivery plan.

## User stories

- As a Director, I update kill criteria so stop decisions are pre-agreed (supports incremental funding).
- As a Director, I assign funded teams by picking display names from the workspace.
- As a Director, I understand which outcome Measure of Success this bet is meant to move (Slice 1: show outcome metrics as context; Slice 1.5: explicit MoS link).

## Requirements

1. Fields: title, success signal, kill criteria, funded teams, status
2. Outcome shown read-only (change outcome = advanced/technical later)
3. Show outcome MoS / metrics as read-only context (“this bet should move…”)
4. Save + Back to steering
5. Validation: kill criteria required; warn if no funded teams

**Slice 1.5:** editable MoS link (`metricIds` / `primaryMetricId`); optional review date / horizon; optional funding stance (`explore` / `exploit` / `sustain`); optional opportunity vs capability kind.

## Acceptance

- Save persists to `steertree.yaml`
- Invalid empty title blocks save with plain language
- Sample bet detail shows related outcome metric context

## XFN

A11y: labelled inputs · Dirty-state warning on navigate away
