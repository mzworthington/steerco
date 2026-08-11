# PRD F04 - Bet detail

**Slice:** 1 · **Mockup:** `steerco-exec-06-bet-detail.png`  
**Frameworks:** EDGE Bet (success signal + kill criteria; incremental funding / PVR; funding stance = Integrated Backlog mix; capability = Tech@Core) - see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Bets need enough structure for decisions without becoming project plans.

## Goal

Edit one bet as a briefing: success signal, kill criteria, funded teams, status - enough for start/stop/continue, not a delivery plan.

## User stories

- As a Director, I update kill criteria so stop decisions are pre-agreed (supports incremental funding).
- As a Director, I assign funded teams by picking display names from the workspace.
- As a Director, I understand which goal Measure of Success this bet is meant to move (Slice 1: show goal metrics as context; Slice 1.5: explicit MoS link).
- As a Director (Slice 3), I see which teams are on this bet’s **flow of change** as of a date - funded streams plus scoped platform / enabling / complicated-subsystem involvement - without opening a project plan.

## Requirements

1. Fields: title, success signal, kill criteria, funded teams, status
2. Goal shown read-only (change goal = advanced/technical later)
3. Show goal MoS / metrics as read-only context (“this bet should move…”)
4. Save + Back to steering
5. Validation: kill criteria required; warn if no funded teams

**Slice 1.5:** editable MoS link (`metricIds` / `primaryMetricId`); optional review date / horizon (PVR checkpoint); optional funding stance (`explore` / `exploit` / `sustain` - Integrated Backlog mix cue); optional opportunity vs capability kind (Tech@Core revitalize when capability).

**Slice 3:** optional **flow overlay** - which teams sit on this bet’s path of change as of a date (funded stream-aligned teams plus related platform / complicated-subsystem / enabling interactions). Intent for steering, not a delivery plan or Gantt. Shares as-of projection with [F03](./F03-how-work-is-organised.md) / [F13](./F13-topology-timeline.md).

## Acceptance

- Save persists to `steertree.yaml`
- Invalid empty title blocks save with plain language
- Sample bet detail shows related goal metric context
- Slice 3: flow overlay lists funded streams and related interactions for the selected as-of date

## XFN

A11y: labelled inputs · Dirty-state warning on navigate away
