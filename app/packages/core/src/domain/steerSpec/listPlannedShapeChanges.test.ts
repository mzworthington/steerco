import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import { listPlannedShapeChanges } from './listPlannedShapeChanges';

const plannedDoc = `
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_stream
      displayName: Stream
      role: stream_aligned
      provenance: local
      members:
        - id: mem_now
          displayName: Already here
          discipline: engineering
          title: Engineer
          ftePercent: 100
        - id: mem_later
          displayName: Late Join
          discipline: product
          title: PM
          ftePercent: 50
          effectiveFrom: 2027-01-15
    - id: team_platform
      displayName: Platform
      role: platform
      provenance: local
      members: []
  relationships:
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: x_as_a_service
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: collaboration
      effectiveFrom: 2027-01-15
`;

describe('listPlannedShapeChanges', () => {
  it('lists capacity and relationship windows that start after as-of', () => {
    const parsed = parseSteerSpecYaml(plannedDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const today = listPlannedShapeChanges(parsed.value, '2026-09-04');
    expect(today.map((item) => item.id)).toEqual([
      'capacity:team_stream:mem_later',
      'relationship:team_stream::team_platform::collaboration',
    ]);
    expect(today[0]?.summary).toMatch(/Late Join/);
    expect(today[1]?.summary).toMatch(/collaboration/i);
    expect(today.every((item) => item.at === '2027-01-15')).toBe(true);
  });

  it('hides a window once as-of reaches its start date', () => {
    const parsed = parseSteerSpecYaml(plannedDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(listPlannedShapeChanges(parsed.value, '2027-01-15')).toEqual([]);
  });
});
