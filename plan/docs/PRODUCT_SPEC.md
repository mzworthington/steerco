# SteerCo - product specification

**Status:** Draft (pre-implementation)  
**Audience:** Product, design, engineering  
**Slice 1:** Local-only, no authentication

## 1. Problem

Product owners, product executives, and Engineering Directors must align **goals**, **funded bets**, and **team shape**, then act on evidence. Today that alignment lives in slide decks. Jira holds work; Backstage holds services; Entra/GitHub hold people. Nothing holds the investment contract - so steering meetings re-litigate priorities without a shared, versionable source of truth.

## 2. Product thesis

SteerCo is a **steering workspace**: edit strategy and topology intent in plain language, persist a canonical **SteerSpec**, leave with decision notes, and export a board pack when you need to share. It reads and later writes _around_ existing systems of record; it does not become one.

It operationalises two complementary models without becoming a PMO or HR tool:

- **EDGE** - holistic value-driven operating model: Lean Value Tree **plus** product mindset / Product brief, Tech@Core, Periodic Value Review (PVR), Integrated Backlogs, Measures of Success, and six core principles (vision → goals/MoS → bets → optional initiatives)
- **Team Topologies** (2e) - topology _intent_ for fast flow of value (team purposes, interaction modes, cognitive load as a signal)

See [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md) and slice commitments in [ROADMAP.md](./ROADMAP.md).

## 3. Target users

| Persona                                 | Need                                                             |
| --------------------------------------- | ---------------------------------------------------------------- |
| Product Owner / CPO / Head of Product   | Own goals and funded bets; decide start/stop/continue         |
| Engineering Director / Head of Platform | Align team shape to bets; partner on start/stop/continue         |
| CTO / transformation sponsor            | Readable steering view; decision notes without tooling jargon    |
| Staff+/principal (secondary)            | Technical mode: refs, imports, overlays, CI validation           |
| Platform engineer (later)               | Connect Catalog API; enforce write-back policy                   |

**Non-users (default):** squad members planning sprints - they stay in Jira.

## 4. Bounded contexts

| Context                            | Responsibility                                                           |
| ---------------------------------- | ------------------------------------------------------------------------ |
| **Investment alignment**           | Goals, MoS, bets, kill criteria, decision notes / PVR (EDGE toolkit)  |
| **Product & tech fitness**         | Product mindset cues; Tech@Core capability bets (not a radar or debt DB) |
| **Topology intent**                | How teams relate for fast flow (Team Topologies; not HR reporting lines) |
| **Evidence**                       | Leading indicators / learning attached to goals/bets (sample Slice 1) |
| **Identity & directories** (later) | External team refs only - owned by Entra/GitHub/Backstage                |
| **Work execution** (external)      | Jira - link/annotate later, never dual / owned integrated backlog        |
| **System architecture** (external) | ArchLens - optional bet → system refs later (Tech@Core evidence)         |

## 5. Domain glossary

| Term                         | Definition                                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**                  | Measurable change the organisation wants (LVT / EDGE Goal); carries Measures of Success. SteerSpec stores these under `outcomes[]` until a schema rename                                                                                                 |
| **Measure of Success (MoS)** | Leading (and validating lagging) indicator in the customer-value fitness function - shapes and funds work toward a Goal (not a vanity KPI or cost/schedule score)                                                                                    |
| **Bet**                      | Time-boxed investment intended to move a Goal; has success signal and stop rule (EDGE Bet); may be opportunity or capability (Tech@Core)                                                                                                              |
| **Initiative**               | Optional thin value slice under a bet (EDGE Initiative) - narrative only; never a dual backlog                                                                                                                                                            |
| **Product brief**        | Lightweight EDGE product definition: customer problems, core elements, and LVT links - without heavy upfront requirements; supports product mindset over project mindset                                                                                  |
| **Tech@Core**                | EDGE stance that technology is the business engine; strategic tech debt and trend sensing (e.g. Tech Radar refs) are investment concerns - not a back-office cost centre                                                                                |
| **Periodic Value Review (PVR)** | EDGE lightweight governance ritual: frequent, data-informed portfolio rebalancing (double down or defund) instead of annual stage-gate theatre; SteerCo decision notes are the PVR artifact                                                          |
| **Integrated Backlog**       | EDGE model for cross-prioritising strategic (LVT) work with BAU, maintenance, and capability building via relative value/effort - SteerCo shows mix/stance cues and never owns the execution backlog                                                  |
| **Kill criteria**            | Pre-agreed condition that triggers stop or re-scope (supports incremental funding / PVR)                                                                                                                                                                  |
| **EDGE principles**          | Six cultural OS principles: outcome-based strategy; value-based prioritization; lightweight planning/governance; adaptive learning culture; autonomous teams; self-sufficient collaborative decisions                                                   |
| **Team**                     | Delivery group referenced by display name (Slice 1) and optional external ref (later)                                                                                                                                                                     |
| **Topology intent**          | Desired interaction shape for fast flow ([Team Topologies](https://teamtopologies.com/key-concepts)): stream-aligned (spine), platform (scoped org / vertical / team), enabling, complicated subsystem (may nest in a stream); modes X-as-a-Service / Collaboration / Facilitation; value-stream / platform groupings; optional members with `discipline` + FTE% as capacity / mix; point-in-time as-of projection |
| **Mismatch**                 | Detectable conflict (portfolio or topology smell - e.g. unfunded bet; platform overload / cognitive-load proxy)                                                                                                                                           |
| **Decision note**            | One-page start/stop/continue/rescope recommendation with rationale and evidence (PVR / lightweight governance)                                                                                                                                            |
| **SteerSpec**                | Canonical YAML/JSON document for a workspace (`steertree.yaml`)                                                                                                                                                                                           |
| **Workspace**                | Local folder containing SteerSpec (+ optional exports)                                                                                                                                                                                                    |
| **Overlay** (later)          | Git-managed Backstage entities SteerCo owns - never replacement Groups for provider sync                                                                                                                                                                |
| **Board pack**               | PDF/export for leadership distribution                                                                                                                                                                                                                    |

**Aggregate roots:** `Workspace` (contains SteerSpec document), `DecisionNote`.

## 6. Principles

1. **Executive surface first** - no YAML, entity refs, or provider names in default UI.
2. **Reference, don’t replace** - never emit competing Group catalog files for provider-synced teams.
3. **Local-first Slice 1** - full value offline; auth only when connectors need it.
4. **Vastly different from ArchLens** - suite link in data, not in chrome.
5. **Git-friendly contract** - SteerSpec is diffable and reviewable even before CI exists.

### Foundational frameworks

SteerCo builds on two operating-model sources (full backlog and vocabulary bridge in [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md)):

| Source                                  | Role in SteerCo                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **EDGE** (Highsmith / Luu / Robinson)   | Holistic operating model: LVT (vision → goals + MoS → bets → optional initiatives) **plus** product mindset/brief, Tech@Core, PVR, Integrated Backlogs, MoS fitness function, and six principles |
| **Team Topologies** 2e (Skelton / Pais) | Topology _intent_ for fast flow: stream-aligned, platform _groupings_, enabling, complicated subsystem; three interaction modes; cognitive load as a design signal |

Executive UI uses Team Topologies names for team types and interaction modes (with plain-language teaching). EDGE terms stay Goal / Bet / Measure of Success / value review in the default views; Product brief, Tech@Core, PVR, Integrated Backlog, and the six principles appear in glossary, product guide, and Technical mode.

## 7. Acceptance scenarios (Gherkin)

### Feature: Local workspace

```gherkin
Feature: Open a local workspace
  Scenario: Start from sample
    Given the leader has no prior workspace
    When they choose "Start from sample"
    Then they see a steering overview with example goals and bets
    And no account or sign-in is required

  Scenario: Open existing folder
    Given a folder containing a valid steertree.yaml
    When the leader opens that folder
    Then SteerCo loads the SteerSpec into steering and org views

  Scenario: Invalid SteerSpec
    Given a folder with an invalid steertree.yaml
    When the leader opens that folder
    Then they see a plain-language explanation of what is wrong
    And they can cancel without corrupting the file
```

### Feature: Steering and bets

```gherkin
Feature: Steering overview
  Scenario: View alignment
    Given a workspace with three bets
    When the leader opens Steering
    Then they see goals, bets, status, and a short alignment summary

  Scenario: Edit a bet
    Given a bet on the steering view
    When the leader opens the bet and changes kill criteria
    Then the workspace SteerSpec is updated
    And the steering view reflects the change
```

### Feature: How work is organised

```gherkin
Feature: Topology intent
  Scenario: Shape teams in plain language
    Given a workspace
    When the leader adds stream-aligned and platform teams
    And sets a "uses as a service" relationship
    Then the org-shape view shows the relationship without technical identifiers

  Scenario: Surface overload mismatch
    Given a shared platform team with many dependents
    When the leader opens How work is organised
    Then they see a calm mismatch message about platform load and slower flow

  Scenario: Interaction graph at scale (Slice 3)
    Given many teams across value streams with a nested complicated subsystem and an enabling team
    When the leader opens How work is organised
    Then stream-aligned teams appear on the capacity board and interaction graph
    And platforms appear by audience scope
    And the complicated subsystem appears nested in its stream

  Scenario: Point in time on the team view (Slice 3)
    Given capacity and relationship windows recorded over a steering period
    When the leader chooses an as-of date on How work is organised
    Then the projected shape and mismatches match that date
```

### Feature: Decision and export

```gherkin
Feature: Decision note and board pack
  Scenario: Recommend stop
    Given evidence that a bet is not moving its goal
    When the leader creates a decision note recommending Stop
    Then the note includes why, what was measured, who is affected, and next step

  Scenario: Export board pack
    Given decision notes and an org shape
    When the leader exports a board pack
    Then they receive a PDF suitable for steering distribution
    And sections are grouped for invest, work, and adapt
    And technical exports remain behind an advanced action
```

## 8. Cross-functional acceptance (Slice 1)

| Concern           | Criteria                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Accessibility     | WCAG 2.2 AA for executive flows; keyboard reachable primary actions; sufficient contrast on light editorial theme         |
| Privacy           | No network calls required for core flows; no PII beyond team display names the user types                                 |
| Performance       | Open sample workspace &lt; 2s on mid-tier laptop; steering interaction feels instant (&lt; 100ms for local state updates) |
| Resilience        | Autosave or explicit save with clear dirty state; never silently overwrite invalid files                                  |
| Security          | No auth Slice 1; no secrets storage; later connectors use OS/browser OAuth - out of scope here                            |
| Critical journeys | Open sample → edit bet → view org shape → create decision note → export PDF                                               |

## 9. Behaviour catalog notes (pre-code)

Greenfield - no existing tests. Design phase should add:

- Unit: SteerSpec parse/validate/migrate; mismatch rules; merge of team display names
- Component: steering, org-shape, decision note forms
- Browser E2E: critical journey above with sample fixture
- A11y: axe on executive routes
- Visual: optional Playwright screenshots vs mockups (non-blocking Slice 1)

## 10. Out of scope (product)

- Sprint boards, OKR social check-ins, employee directory
- Auto-mutating Entra or GitHub team membership
- Replacing ArchLens canvas or ChaosLens
- Multi-user realtime collaboration (revisit after auth)
- Full BAU vs strategic finance accounting; Tech Radar product; tech-debt inventory DB; heavy Product brief / requirements docs; full cognitive-load assessment instruments
- Proprietary Team Topologies diagram artwork without permission
- Owning an Integrated Backlog execution system (Jira remains the work SoR)
