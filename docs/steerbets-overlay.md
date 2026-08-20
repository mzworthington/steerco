# SteerBet overlay (Backstage)

SteerCo can emit an optional **SteerBet** catalog overlay for Backstage. This documents the mapping from SteerSpec bets - it does **not** create or mutate directory `Group` entities.

Provider-synced teams support Group export and write-back to contribute back to the Backstage graph ([ADR 0010](/docs/ADRs/0010-backstage-group-export-writeback.md)). Import and write-back policy allows proposing and exporting Group definitions.

## Mapping from SteerSpec

| SteerSpec field             | Overlay field                           | Notes                                     |
| --------------------------- | --------------------------------------- | ----------------------------------------- |
| `bets[].id`                 | `metadata.name`                         | Stable id; kebab or snake as stored       |
| `bets[].title`              | `metadata.title`                        | Human label                               |
| `bets[].outcomeId`          | `spec.outcomeRef`                       | Soft link to goal id in SteerSpec         |
| `bets[].successSignal`      | `spec.successSignal`                    | What “good” looks like                    |
| `bets[].killCriteria`       | `spec.killCriteria`                     | Pre-agreed stop condition                 |
| `bets[].status`             | `spec.status`                           | SteerSpec enum as-is                      |
| `bets[].fundedTeamIds`      | `spec.fundedTeamRefs`                   | SteerSpec team ids, not Group entity refs |
| `bets[].fundingStance`      | `spec.fundingStance`                    | explore / exploit / sustain               |
| `bets[].kind`               | `spec.kind`                             | opportunity / capability                  |
| `bets[].valueRank`          | `spec.valueRank`                        | Dense portfolio stack rank (1 = highest)  |
| `metadata.name` (SteerTree) | `metadata.annotations.steerco.dev/tree` | Workspace identity                        |

## Example

```yaml
apiVersion: steerco.dev/v1alpha1
kind: SteerBet
metadata:
  name: bet-fulfilil
  title: Shared fulfilment spine
  annotations:
    steerco.dev/tree: northwind-q3-alignment
spec:
  outcomeRef: out_promise
  successSignal: New channels reuse one fulfilment path within two weeks of launch
  killCriteria: Fewer than two channels adopt the spine after two quarters
  status: at_risk
  fundedTeamRefs:
    - team_fulfilil
    - team_warehouse
  fundingStance: explore
  kind: capability
  valueRank: 2
```

## Export and write-back Group definitions

- Enable generating and exporting `kind: Group` catalog definitions from SteerCo imports or overlays to Backstage.
- Team links map directly to Backstage Group structures, allowing graph contributions.
- Catalog export enables publishing Group definitions back to the provider graph.

See also: [Product guide](/docs/product-guide) · Technical mode → Catalog import · [ADR 0010](/docs/ADRs/0010-backstage-group-export-writeback.md).
