# SteerSpec

Canonical contract for a SteerLens workspace. Stored as `steertree.yaml` at the workspace root.

Executive UI never shows this document by default; Technical mode and git reviews do.

## Design rules

1. **Display names are enough for Slice 1** - external refs optional.
2. **Stable ids** (`out_…`, `bet_…`, `team_…`, `mem_…`) for diff-friendly edits.
3. **Provenance** on teams drives write-back policy later.
4. **No secrets** in SteerSpec.
5. Versioned with `apiVersion` + `kind` for migrations.
6. **Team Topologies is canonical** for team types and interaction modes ([key concepts](https://teamtopologies.com/key-concepts)).

Operating-model evolution (EDGE LVT fields, platform groupings, new mismatch codes): [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md).

## Team Topologies in SteerSpec

| SteerSpec                           | Team Topologies                                    |
| ----------------------------------- | -------------------------------------------------- |
| `team.role: stream_aligned`         | Stream-aligned team                                |
| `team.role: platform`               | Platform team (may later be a _grouping_)          |
| `team.role: enabling`               | Enabling team                                      |
| `team.role: complicated_subsystem`  | Complicated-subsystem team                         |
| `relationship.mode: x_as_a_service` | X-as-a-Service                                     |
| `relationship.mode: collaboration`  | Collaboration (time-boxed via `expectedUntil`)     |
| `relationship.mode: facilitation`   | Facilitation (time-boxed via `expectedUntil`)      |

Legacy aliases (`customer_facing`, `shared_platform`, `coaching_support`, `uses_as_service`, `works_together`, `coaching`) are accepted on parse and normalized to the canonical ids above.

Optional `teams[].members[]` records display name, `discipline` (engineering | design | product | quality | leadership | other), free-text job `title`, and `ftePercent` (0–100) as a **capacity / mix signal** — not an HR directory.

## Document shape (v1alpha1)

```yaml
apiVersion: steerlens.dev/v1alpha1
kind: SteerTree
metadata:
  name: northwind-q3-alignment
  title: Northwind Q3 alignment
  description: Synthetic demo workspace — fictional retailer
spec:
  vision: Ship customer promises in days, not weeks, without burning out store and digital teams
  outcomes:
    - id: out_promise
      title: Reliable customer promises
      summary: Customers receive accurate delivery and pickup estimates they can trust
      status: on_track # on_track | at_risk | achieved | abandoned
      metrics:
        - id: met_promise_hit
          title: Promise hit rate
          unit: percent
          current: 91
          baseline: 74
          target: 95
          interpretation: Climbing, still short of the target band
  bets:
    - id: bet_fulfilil
      outcomeId: out_promise
      title: Shared fulfilment spine
      successSignal: New channels reuse one fulfilment path within two weeks of launch
      killCriteria: Fewer than two channels adopt the spine after two quarters
      status: on_track # proposed | on_track | at_risk | stop_ready | stopped | done
      fundedTeamIds: [team_fulfilil, team_storefront]
      metricIds: [met_cycle_days] # MoS links — Slice 1.5, optional, default []
      primaryMetricId: met_cycle_days # optional headline metric, nullable
      reviewDate: 2026-10-15 # optional ISO date for next funding review
      horizon: Q3 review # optional free text
      fundingStance: explore # explore | exploit | sustain, optional
      kind: capability # opportunity | capability, optional
  teams:
    - id: team_storefront
      displayName: Storefront experience
      role: stream_aligned # stream_aligned | platform | enabling | complicated_subsystem
      provenance: local # local | backstage | github | entra | catalog_file
      externalRefs: []
      members:
        - id: mem_storefront_em
          displayName: Priya Nair
          discipline: leadership # engineering | design | product | quality | leadership | other
          title: Engineering Manager
          ftePercent: 100
          effectiveFrom: 2026-01-01 # optional ISO date capacity window; omit effectiveUntil while ongoing
    - id: team_fulfilil
      displayName: Fulfilment platform
      role: platform
      provenance: local
      externalRefs: []
      members: []
  relationships:
    - fromTeamId: team_storefront
      toTeamId: team_fulfilil
      mode: x_as_a_service # x_as_a_service | collaboration | facilitation
    - fromTeamId: team_enablement
      toTeamId: team_storefront
      mode: facilitation
      expectedUntil: 2026-12-31 # required to avoid collab_without_end for collaboration/facilitation
  decisionNotes:
    - id: dec_loyalty_stop
      betId: bet_loyalty
      recommendation: stop # start | continue | stop | rescope
      title: Stop Loyalty ledger unification?
      why: Coordination cost rose without improving promise hit rate
      measured: []
      measuredMetricIds: [met_promise_hit] # structured MoS refs — Slice 1.5, optional, default []
      affectedTeamIds: [team_fulfilil]
      nextStep: Pause rollout; keep the existing ledger for two quarters
  evidence:
    - id: ev_1
      metricId: met_promise_hit
      source: sample # sample | manual | github | other
      note: Synthetic sample data for Slice 1 demos
  topologyEvents: # Slice 1.5, optional, default []
    - id: evt_1
      at: 2026-07-01
      kind: relationship_added # capacity_up | capacity_down | relationship_added | relationship_ended | relationship_mode_changed | other
      summary: Ways of working started a time-boxed facilitation partnership with Storefront
      teamIds: [team_enablement, team_storefront]
      relationshipKey: team_enablement::team_storefront # fromTeamId::toTeamId, optional
```

## JSON Schema

Machine-readable schema: [`../schemas/steertree.schema.json`](../schemas/steertree.schema.json)

Sample: [`../samples/steertree.sample.yaml`](../samples/steertree.sample.yaml)

## Mismatch rules (core)

| Code                        | When                                                                                                      | Slice |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | ----- |
| `bet_without_team`          | Bet has empty `fundedTeamIds`                                                                             | 1     |
| `bet_without_kill_criteria` | Missing kill criteria                                                                                     | 1     |
| `platform_overload`         | Platform has X-as-a-Service dependents above threshold (default 8); surface as cognitive-load / flow risk | 1     |
| `team_without_bet`          | Stream-aligned team funds zero bets (warning)                                                             | 1     |
| `orphan_outcome`            | Outcome with zero bets                                                                                    | 1     |
| `bet_without_mos_link`      | Bet status `on_track`/`at_risk`/`stop_ready` with empty `metricIds` and no `primaryMetricId` (warning)    | 1.5   |
| `collab_without_end`        | Relationship `mode: collaboration` or `facilitation` with no `expectedUntil` (warning)                    | 1.5   |
| `stream_bet_wip`            | Stream-aligned team funded on more than 2 active bets (`proposed`/`on_track`/`at_risk`/`stop_ready`, warning) | 1.5   |
| `enabling_owns_delivery`    | Enabling team is the *only* funded team on a bet with status `on_track`/`at_risk`/`stop_ready` (warning)  | 1.5   |
| `stream_missing_product`    | Stream-aligned team has members recorded but no `product` discipline FTE (warning)                       | 1.5   |

Landed Slice 1.5 additive fields: `bets[].metricIds`/`primaryMetricId` (MoS links), `bets[].reviewDate`/`horizon` (review cadence), `bets[].fundingStance`/`kind`, `relationships[].expectedUntil`/`effectiveFrom`/`effectiveUntil`, `teams[].members[].discipline` (mix signal), `teams[].members[].effectiveFrom`/`effectiveUntil`, `decisionNotes[].measuredMetricIds`, and `spec.topologyEvents[]` ([F13](./prds/F13-topology-timeline.md)). `discipline` is required when a member is listed; temporal windows and MoS links remain optional with empty/undefined defaults so older Slice 1 fixtures still parse after migration.

Planned additive fields (Slice 3): `groupings[]` (`kind: platform | value_stream`, kinded team `members[]`); `platformScope` (`organisation | vertical | team`) on platform teams / platform groupings; optional complicated-subsystem `within` (stream-aligned team ref) for team-within-team nest; optional `initiatives[]`. UI: flow-of-change org layout, as-of projection on F03, bet flow overlay, F13 timeline. Details: [OPERATING_MODEL_ALIGNMENT.md](./OPERATING_MODEL_ALIGNMENT.md) · [ROADMAP.md](./ROADMAP.md) · [F03](./prds/F03-how-work-is-organised.md).

## Mapping to foreign shapes (later)

| Foreign              | Direction | Notes                                                           |
| -------------------- | --------- | --------------------------------------------------------------- |
| Backstage `Group`    | In        | Map to `teams[]` + `externalRefs`; set `provenance`             |
| Backstage Group YAML | Out       | **Only** if `provenance: catalog_file` and user opts in         |
| SteerBet overlay     | Out       | Always OK - SteerLens-owned kind                                |
| GitHub team          | In        | `externalRefs: [{ system: github, id: org/team }]`              |
| Entra group          | In        | `externalRefs: [{ system: entra, id: objectId }]`               |
| ArchLens entityRef   | Out/In    | Optional `bets[].systemRefs[]` (field reserved, unused Slice 1) |
