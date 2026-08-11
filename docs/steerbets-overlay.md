# SteerBet overlay (Backstage)

SteerLens can emit an optional **SteerBet** catalog overlay for Backstage. This documents the mapping from SteerSpec bets - it does **not** create or mutate directory `Group` entities.

Provider-synced teams remain reference-only ([ADR 0005](/docs/adrs/0005-provider-teams-reference-only)). Import and write-back policy never propose Group YAML for Backstage / GitHub / Entra provenance.

## Mapping from SteerSpec

| SteerSpec field             | Overlay field                             | Notes                                     |
| --------------------------- | ----------------------------------------- | ----------------------------------------- |
| `bets[].id`                 | `metadata.name`                           | Stable id; kebab or snake as stored       |
| `bets[].title`              | `metadata.title`                          | Human label                               |
| `bets[].outcomeId`          | `spec.outcomeRef`                         | Soft link to outcome id in SteerSpec      |
| `bets[].successSignal`      | `spec.successSignal`                      | What “good” looks like                    |
| `bets[].killCriteria`       | `spec.killCriteria`                       | Pre-agreed stop condition                 |
| `bets[].status`             | `spec.status`                             | SteerSpec enum as-is                      |
| `bets[].fundedTeamIds`      | `spec.fundedTeamRefs`                     | SteerSpec team ids, not Group entity refs |
| `bets[].systemRefs`         | `spec.systemRefs`                         | Optional ArchLens entityRefs              |
| `bets[].fundingStance`      | `spec.fundingStance`                      | explore / exploit / sustain               |
| `bets[].kind`               | `spec.kind`                               | opportunity / capability                  |
| `bets[].valueRank`          | `spec.valueRank`                          | Relative portfolio rank (lower = higher)  |
| `metadata.name` (SteerTree) | `metadata.annotations.steerlens.dev/tree` | Workspace identity                        |

## Example

```yaml
apiVersion: steerlens.dev/v1alpha1
kind: SteerBet
metadata:
  name: bet-fulfilil
  title: Shared fulfilment spine
  annotations:
    steerlens.dev/tree: northwind-q3-alignment
spec:
  outcomeRef: out_promise
  successSignal: New channels reuse one fulfilment path within two weeks of launch
  killCriteria: Fewer than two channels adopt the spine after two quarters
  status: at_risk
  fundedTeamRefs:
    - team_fulfilil
    - team_warehouse
  systemRefs:
    - component:default/fulfilil-spine
    - system:default/commerce-platform
  fundingStance: explore
  kind: capability
  valueRank: 2
```

## Never emit Group

- Do **not** generate `kind: Group` from SteerLens imports or overlays.
- Team links stay as SteerSpec `teams[]` ids plus optional `externalRefs` to existing Groups.
- Catalog import sets `proposesGroupYaml: false` and keeps provider Groups as the directory source of truth.

See also: [Product guide](/docs/product-guide) · Technical mode → Catalog import · [ADR 0005](/docs/adrs/0005-provider-teams-reference-only).
