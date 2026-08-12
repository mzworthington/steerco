import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from '../steerSpec/parseSteerSpecYaml';
import {
  INTERACTION_MODE_COPY,
  INTERACTION_SHAPE_GEOMETRIES,
  TEAM_SHAPE_GEOMETRIES,
  TEAM_SIZE_GUIDANCE,
  TEAM_TOPOLOGY_TYPES,
  TOPOLOGY_LENS_COPY,
  TOPOLOGY_TYPE_COPY,
} from './vocabulary';

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
      expect(TOPOLOGY_TYPE_COPY[type].shapeTeaching.length).toBeGreaterThan(10);
    }
  });

  it('maps each topology to a distinct Team Topologies modeling shape', () => {
    const shapes = TEAM_TOPOLOGY_TYPES.map((type) => TOPOLOGY_TYPE_COPY[type].shape);
    expect(shapes).toEqual(['rounded_horizontal', 'square_dotted', 'rounded_vertical', 'octagon']);
    expect(new Set(shapes).size).toBe(TEAM_SHAPE_GEOMETRIES.length);
  });

  it('covers the three interaction modes', () => {
    expect(Object.keys(INTERACTION_MODE_COPY).sort()).toEqual([
      'collaboration',
      'facilitation',
      'x_as_a_service',
    ]);
  });

  it('maps each interaction mode to a distinct modeling shape', () => {
    expect(INTERACTION_MODE_COPY.x_as_a_service.shape).toBe('triangle');
    expect(INTERACTION_MODE_COPY.collaboration.shape).toBe('parallelogram');
    expect(INTERACTION_MODE_COPY.facilitation.shape).toBe('circle');
    const shapes = Object.values(INTERACTION_MODE_COPY).map((copy) => copy.shape);
    expect(new Set(shapes).size).toBe(INTERACTION_SHAPE_GEOMETRIES.length);
  });

  it('teaches domain / stream / team as coplanar lenses with size guidance', () => {
    expect(TOPOLOGY_LENS_COPY.domain.lens).toBe('What');
    expect(TOPOLOGY_LENS_COPY.stream.lens).toBe('Flow');
    expect(TOPOLOGY_LENS_COPY.team.lens).toBe('Who');
    expect(TOPOLOGY_LENS_COPY.domain.teaching).toMatch(/never a managerial parent/i);
    expect(TEAM_SIZE_GUIDANCE.idealAround).toBe(8);
    expect(TEAM_SIZE_GUIDANCE.oversizedThreshold).toBe(15);
    expect(TEAM_SIZE_GUIDANCE.evolutionTeaching).toMatch(/fracture|platform grouping/i);
    expect(TOPOLOGY_TYPE_COPY.stream_aligned.teaching).toMatch(/three lenses|not a hierarchy/i);
  });
});

describe('legacy SteerSpec aliases', () => {
  it('normalizes legacy team roles and interaction modes on parse', () => {
    const yaml = `
apiVersion: steerco.dev/v1alpha1
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
