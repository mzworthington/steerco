# Product guide

How to use SteerCo as a **steering workspace**: open a session, align investment and team shape, write a decision, and export a board pack - without signing in or touching YAML.

Everything in Slice 1 stays on this device until you choose to connect systems later.

## Who it is for

| Role                                    | What you do here                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Product Owner / CPO / Head of Product   | Own goals and funded bets; decide start / stop / continue with evidence                          |
| Engineering Director / Head of Platform | Align team shape to bets; partner on start / stop / continue with evidence                       |
| CTO or transformation sponsor           | Read a steering view and take a decision note - no tooling jargon                                |
| Staff+ (optional)                       | **Technical** mode for refs, fitness, vocabulary, and catalog import; default UI stays executive |

Squad sprint planning stays in Jira. Directories stay in Entra / GitHub. Architecture diagrams stay in ArchLens. SteerCo holds the **investment contract**.

## Open a workspace

1. Go to [Workspace](/workspace).
2. Choose **Open folder** for an existing SteerSpec, **Create new file** for a blank `steertree.yaml`, or **Start from sample** to explore with example goals and bets.
3. You land on **Steering overview**. No account is required.

Recent workspaces appear on the home screen for quick return. Edits live in the browser until you **Save** (write back to the folder when the browser allows it, otherwise download).

## The three questions

SteerCo is organised around how leadership already steers (EDGE’s invest / work / adapt loop):

| Question   | Where in the app          | Intent                                                                   |
| ---------- | ------------------------- | ------------------------------------------------------------------------ |
| **Invest** | Steering, Goals, Evidence | Are we funding the right bets for the goals we care about?               |
| **Work**   | How work is organised     | Is team shape set up for fast flow of value?                             |
| **Adapt**  | Decision notes, Export    | What should we start, stop, continue, or re-scope - and can we share it? |

## EDGE beyond the Lean Value Tree

The Lean Value Tree (vision → goals + Measures of Success → bets) is the spine. EDGE also expects:

| Teaching                        | In SteerCo                                                                                                                                                                                               |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product mindset**             | Long-lived teams fund continuous value - not temporary project theatre. Product briefs page holds lightweight briefs (problem + linked goals/bets); Goals shows only briefs linked to the selected goal. |
| **Tech@Core**                   | Capability bets and an optional Tech Radar URL treat core systems as business investments, not a cost centre.                                                                                            |
| **Periodic Value Review (PVR)** | Decision notes + bet review dates: look at the data, double down or defund - no stage-gate bureaucracy. Executives see “value review”; staff+ may see PVR.                                               |
| **Integrated Backlogs**         | Funding stance (explore / exploit / sustain), portfolio stack rank, and portfolio mix cues cross-prioritise strategic work with BAU and capability - without SteerCo owning Jira.                        |
| **Measures of Success**         | Customer-value fitness function tied to goals and bets - leading indicators that fund work, not vanity dashboards.                                                                                       |
| **Six principles**              | Outcome-based strategy; value-based prioritization; lightweight governance; adaptive learning; autonomous teams; decisions close to the work.                                                            |

Full framework backlog: [Operating model alignment](./operating-model-alignment.md).

## Domain-Driven Design (Eric Evans)

SteerCo utilises and aligns to Eric Evans’ Domain-Driven Design for **problem-space** boundaries - not as a tactical modeling CAD (that stays in code / ArchLens).

| DDD teaching                | In SteerCo                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bounded context**         | A **domain** is the fence around a slice of the business (concepts + rules). Domains label related streams for filters - they are not managers. |
| **Ubiquitous language**     | Prefer business words in domain, stream, goal, and bet titles - not “Squad 4” org-chart labels.                                                 |
| **Fracture planes**         | When a context overloads a team, split into peer sub-domains each with its own stream-aligned team - do not stack teams under a domain boss.    |
| **Join to Team Topologies** | Stream-aligned teams own a context slice end-to-end; platforms and enablers sit beside them as services, not above them.                        |

## Leadership outside the stream

Engineering Directors and VPs still own line management, budget, and careers. That **HR structure is separate** from the delivery topology on How work is organised. In SteerCo, leaders:

- Keep **strategy, team shape, and evidence** aligned
- Sense cognitive load and find **fracture planes**
- Sponsor platform and enabling teams when many streams share the same drag
- Drive the **Inverse Conway Maneuver** - reshape teams and interaction modes so the desired architecture can emerge

They do not appear as a topology type on the canvas, and they do not hand work down a domain → stream → team reporting chain.

## Screen by screen

### Steering overview

Portfolio view of **goals** and the **bets** funded against them: status, alignment cues, portfolio mix (kind + funding stance), calm topology cues, a drag-to-reorder value stack, and links into detail. Use it to see the whole contract at a glance before drilling in.

### Goals

Asks “are we getting the goal?” Select a node in the Lean Value Tree; the page below shows rich detail for that node. A selected **goal** carries **Measures of Success** (leading indicators that shape funding - not a metrics warehouse), the bets meant to move them, and only the **Product briefs** linked to that goal.

Grow the tree in place with the same **Add** pattern everywhere: **Add goal** on the Goals page header or under Vision, **Add bet** on a selected goal, and **Add initiative** on a selected bet (also available inside bet edit). New goals start empty of measures; new bets start as **proposed** until you fund teams and link Measures of Success.

### Product briefs

Lightweight product definitions: customer problem, customers, non-goals, and links to goals/bets - without becoming requirements docs. Briefs linked to a goal appear under that goal on the Goals page.

### Bet detail

Open a bet to edit success signal, kill criteria, linked measures, and which teams carry the work. Kill criteria are the pre-agreed stop or re-scope conditions that keep funding incremental. Capability bets show Tech@Core revitalize copy; you can attach thin initiatives and follow an optional Tech Radar link.

### Evidence

Sample or manually entered signals attached to goals and bets. Use **Add evidence** to record a new measure on a goal, or override values on existing cards. Use this to ground a decision note in what was measured - not to replace your BI stack.

### How work is organised

Topology **intent** for fast flow ([Team Topologies](https://teamtopologies.com/key-concepts) + [Domain-Driven Design](https://www.domainlanguage.com/ddd/)):

- **Four team types** - stream-aligned (the delivery spine), platform, enabling, complicated subsystem
- **Three interaction modes** - X-as-a-Service, Collaboration, Facilitation
- **Three lenses** - domain / bounded context (what), stream (flow), stream-aligned team (who) on the same slice of value - not a reporting hierarchy

Platforms exist to reduce cognitive load so stream-aligned teams can go faster - treat stream-aligned teams as the **customers** of platform and enabling teams. At scale, the map is a **flow of change** across value streams - not four flat department columns - with platforms scoped to the organisation, a vertical, or a single team; complicated subsystems in streams; and enabling teams supporting many streams. Ideal is one stream-aligned team per stream per bounded-context slice; when load or size is too high, fracture into peer sub-domains rather than stacking teams under a “domain manager.” Mismatch cues (platform overload, oversized team, shared stream) are calm prompts about flow - not HR headcount. The shape is a **point in time**; use as-of when reviewing a past steering period. Open the **Timeline** view for capacity deltas and interaction spans over the steering period.

### Technical mode

Staff+ surface under **Technical** in the workspace nav: Steer tree (ids / provenance / refs), topology fitness with write-back policy, EDGE/TT vocabulary bridge, and catalog-file import (no OAuth). Executive chrome stays plain language; Technical deep-links back to steering, goals, and organisation when useful. Optional [SteerBet overlay](/docs/steerbets-overlay) docs explain Backstage mapping and Group definition exports.

### Decision notes

One-page recommendations: start / stop / continue / re-scope, with why, what was measured, who is affected, and the next step. This is **Periodic Value Review** in practice - lightweight governance to rebalance the portfolio, not a PMO ticket.

### Export

Build a **board pack** for leadership distribution. Sections group under Invest / Work / Adapt. Preview, then print or save as PDF from the browser.

### Save and pending changes

The sidebar shows whether the draft differs from what you opened. Review the diff, then save to the folder or download. SteerCo will not silently overwrite an invalid file.

## Plain-language glossary

| Term                         | Meaning                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Goal**                     | Measurable change the organisation wants (LVT); SteerSpec field `outcomes[]`                             |
| **Measure of Success**       | Leading indicator in the customer-value fitness function - shapes and funds work                         |
| **Bet**                      | Time-boxed investment intended to move a Goal                                                            |
| **Kill criteria**            | Pre-agreed condition that triggers stop or re-scope                                                      |
| **Value review (PVR)**       | Frequent, data-informed start / stop / continue decision - not annual stage-gate                         |
| **Product mindset**          | Long-lived teams delivering continuous value (vs temporary project teams)                                |
| **Tech@Core**                | Technology as the business engine; tech debt is an investment concern                                    |
| **Integrated backlog**       | Cross-prioritising strategic, BAU, and capability work - SteerCo cues the mix                            |
| **Domain / bounded context** | Problem-space fence (DDD); SteerSpec `domains[]` - not a management tier                                 |
| **Ubiquitous language**      | Shared business vocabulary in titles and glossary                                                        |
| **Topology intent**          | Desired team types, lenses (domain / stream / team), and interaction modes for fast flow (point-in-time) |
| **Decision note**            | Start / stop / continue / re-scope recommendation with rationale                                         |
| **SteerSpec**                | The versionable document behind the workspace (`steertree.yaml`)                                         |
| **Board pack**               | Export for steering distribution                                                                         |

## What SteerCo is not

- A sprint board, OKR check-in tool, or employee directory
- A replacement for Jira, Backstage, Entra, or ArchLens
- A place that invents competing identity or catalog groups

## Suggested first path

1. [Start from sample](/workspace)
2. Skim **Steering overview**, then open one bet
3. Check **How work is organised** for load / flow cues
4. Capture a **Decision note**
5. **Export** a board pack and share it

Next: [Overview](/docs) · [Open workspace](/workspace)
