# PRD F02 - Steering overview

**Slice:** 1 · **Mockup:** `steerco-exec-01-steering.png`  
**Frameworks:** EDGE invest / adapt + Periodic Value Review cadence - see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Sponsors need one screen that answers “what are we funding and how is it going?”

## Goal

Show vision, goals, bets, and statuses in a steering workspace - not a backlog. Surface stop-ready / adapt cues so leaders do not only see “green” status.

## User stories

- As a CPO, I see a short alignment summary (e.g. three bets funded, one recommended to stop).
- As a Director, I can open a bet from this view.
- As a Director, I never see YAML or entity refs here.
- As a sponsor, I notice bets that are stop-ready or due for a funding review before I dig into every row.

## Requirements

1. Header with workspace title + period label (editable later; static OK Slice 1)
2. Vision line
3. Goal grouping with bets listed beneath (title, one metric / MoS cue, status word)
4. Status vocabulary: On track / At risk / Stop (map from SteerSpec enums; treat `stop_ready` as Stop or distinct “Stop ready” - prefer elevating stop-ready in the alignment summary)
5. Nav to Goals, How work is organised, Decision notes, Export
6. Alignment summary should mention stop recommendations and (when available) next review / adapt language - not only funded count
7. Mismatch count may appear as calm summary text (not alarmist toast spam)

**Slice 1.5:** show next review from `bets[].reviewDate` / horizon when present (PVR checkpoint). Optional calm cue when funding stance mix is skewed (Integrated Backlog hint - polish later).

## Acceptance

- Sample workspace renders three bets with distinct statuses
- Clicking a bet opens F04
- Sample alignment summary calls out the stop-ready / stop recommendation bet
- Mismatch count may appear as calm summary text (not alarmist toast spam)

## XFN

A11y: status not colour-only · Performance: render &lt; 100ms after load
