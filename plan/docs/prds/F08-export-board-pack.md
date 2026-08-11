# PRD F08 - Export board pack

**Slice:** 1 · **Mockup:** `steerco-exec-08-export.png`  
**Frameworks:** EDGE three questions (Invest / Work / Adapt) - see [OPERATING_MODEL_ALIGNMENT.md](../OPERATING_MODEL_ALIGNMENT.md)

## Problem

Distribution to leadership must not require giving everyone SteerCo access (especially pre-auth).

## Goal

Download a PDF (or print-to-PDF) board pack with selected sections, structured so a steering committee can answer: how we invest, how we work, how we adapt.

## User stories

- As a Director, I choose sections (Steering / Invest, Org shape / Work, Outcomes, Decision notes / Adapt).
- As a Director, I download a pack that looks like the mockup’s calm memo style.
- As a technical user, I can find advanced exports later without cluttering the default.

## Requirements

1. Section checklist grouped (labels may stay familiar; grouping reflects Invest / Work / Adapt):
   - **Invest:** Steering overview, Outcomes (MoS)
   - **Work:** How work is organised (topology intent)
   - **Adapt:** Decision notes, Evidence (optional)
2. Preview thumbnail/panel
3. Download PDF via print CSS (Slice 1)
4. Small link: Technical exports… (disabled or hidden until Slice 2)
5. Filenames: `steerco-board-pack-<workspace>-<date>.pdf`
6. Optional short cover blurb: three questions in plain English (no framework name-dropping required)

**Slice 3:** Work section may include grouping / load signals when schema supports them.

## Acceptance

- With all sections checked, print preview includes sample decision note
- Unchecking Org shape omits that section
- Checklist (or preview headings) makes Invest / Work / Adapt grouping visible

## XFN

Performance: generate preview &lt; 2s for sample · A11y: checklist labels
