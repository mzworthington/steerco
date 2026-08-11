# PRD F05 - Outcomes

**Slice:** 1 · **Mockup:** `steerco-exec-04-outcomes.png`  
**Frameworks:** EDGE Goals + Measures of Success (customer-value fitness function) - see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Leaders need the headline outcome narrative, not a metrics warehouse.

## Goal

Present one primary outcome with large **Measures of Success** and funded bets as quiet rows. MoS are the customer-value fitness function - they define what the organisation is willing to pay for and shape work; they are not vanity KPIs or industrial cost/schedule scores.

## User stories

- As a CTO, I see whether the outcome is being achieved in one glance.
- As a Director, I can jump to a bet row for details.
- As a sponsor, I read a short cue that these measures guide funding decisions.

## Requirements

1. Primary outcome hero metric(s) / MoS from SteerSpec
2. Short interpretation sentence (from metric.interpretation or generated summary)
3. Quiet framing line (or eyebrow): measures of success for this outcome - not a status dashboard
4. Bet rows with simple progress cue
5. Manual edit of metric current/target in Slice 1 (inline or secondary form)

**Slice 1.5:** prefer ≥1 MoS per outcome in validation; show which bets claim each MoS (`metricIds` / `primaryMetricId`) on the Outcomes page.

## Acceptance

- Sample shows delivery / promise-hit hero MoS and three bet rows
- Editing a metric updates SteerSpec

## XFN

A11y: numeric text alternatives · No colour-only trend
