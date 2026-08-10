import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from '../steerSpec/parseSteerSpecYaml';
import { INTERACTION_MODE_COPY, TEAM_TOPOLOGY_TYPES, TOPOLOGY_TYPE_COPY } from './vocabulary';

describe('Team Topologies vocabulary', () => {
  it('covers all four fundamental topologies', () => {
    expect(TEAM_TOPOLOGY_TYPES).toEqual([
      'stream_aligned',
      'platform',
      'enabling',
      'complicated_subsystem',
    ]);
    for (const type of TEAM_TOPOLOGY_TYPES) {
      expect(TOPOLOGY_TYPE_COPY[type].topologyName.length).toBeGreaterThan(0);
      expect(TOPOLOGY_TYPE_COPY[type].purpose.length).toBeGreaterThan(20);
      expect(TOPOLOGY_TYPE_COPY[type].teaching.length).toBeGreaterThan(20);
    }
  });

  it('covers the three interaction modes', () => {
    expect(Object.keys(INTERACTION_MODE_COPY).sort()).toEqual([
      'collaboration',
      'facilitation',
      'x_as_a_service',
    ]);
  });
});

describe('legacy SteerSpec aliases', () => {
  it('normalizes legacy team roles and interaction modes on parse', () => {
    const yaml = `
apiVersion: steerlens.dev/v1alpha1
kind: SteerTree
metadata:
  name: legacy-roles
spec:
  vision: Keep flow moving
  outcomes:
    - id: out_1
      title: Outcome
      status: on_track
  bets:
    - id: bet_1
      outcomeId: out_1
      title: Bet
      successSignal: Ships
      killCriteria: Stops
      status: on_track
      fundedTeamIds: [team_a]
  teams:
    - id: team_a
      displayName: Stream
      role: customer_facing
      provenance: local
    - id: team_b
      displayName: Platform
      role: shared_platform
      provenance: local
    - id: team_c
      displayName: Enable
      role: coaching_support
      provenance: local
  relationships:
    - fromTeamId: team_a
      toTeamId: team_b
      mode: uses_as_service
    - fromTeamId: team_a
      toTeamId: team_c
      mode: works_together
    - fromTeamId: team_c
      toTeamId: team_a
      mode: coaching
`;
    const parsed = parseSteerSpecYaml(yaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.spec.teams.map((team) => team.role)).toEqual([
      'stream_aligned',
      'platform',
      'enabling',
    ]);
    expect(parsed.value.spec.relationships.map((relationship) => relationship.mode)).toEqual([
      'x_as_a_service',
      'collaboration',
      'facilitation',
    ]);
  });
});
