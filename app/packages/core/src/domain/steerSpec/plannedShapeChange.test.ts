import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import {
  calendarTodayIsoDate,
  isFutureIsoDate,
  listPlannedShapeChanges,
  parsePlannedShapeChangeId,
  plannedChangeIdForMember,
  plannedChangeIdForRelationship,
  plannedShapeChangeCue,
} from './plannedShapeChange';

const fixture = `
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: planned-shape
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
          displayName: Today Person
          discipline: engineering
          title: Engineer
          ftePercent: 100
          effectiveFrom: 2026-01-01
        - id: mem_future
          displayName: Future Hire
          discipline: product
          title: PM
          ftePercent: 100
          effectiveFrom: 2026-12-01
    - id: team_platform
      displayName: Shared platform
      role: platform
      provenance: local
      members: []
  relationships:
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: x_as_a_service
      effectiveFrom: 2026-01-01
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: collaboration
      effectiveFrom: 2027-01-15
`;

function loadFixture() {
  const parsed = parseSteerSpecYaml(fixture);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe('plannedShapeChange', () => {
  it('lists only future-dated capacity and relationship windows', () => {
    const planned = listPlannedShapeChanges(loadFixture(), '2026-09-04');
    expect(planned).toEqual([
      expect.objectContaining({
        id: plannedChangeIdForMember('mem_future'),
        kind: 'capacity',
        at: '2026-12-01',
        summary: 'Future Hire joins Stream on 2026-12-01',
        memberId: 'mem_future',
      }),
      expect.objectContaining({
        id: plannedChangeIdForRelationship('team_stream', 'team_platform', 'collaboration'),
        kind: 'relationship',
        at: '2027-01-15',
        fromTeamId: 'team_stream',
        toTeamId: 'team_platform',
        mode: 'collaboration',
      }),
    ]);
  });

  it('treats as-of today as having no planned windows', () => {
    expect(listPlannedShapeChanges(loadFixture(), '2027-06-01')).toEqual([]);
  });

  it('cues a recorded future change without claiming today changed', () => {
    const planned = listPlannedShapeChanges(loadFixture(), '2026-09-04');
    expect(plannedShapeChangeCue(planned, '2026-09-04')).toMatch(
      /planned shape changes are recorded for 2026-12-01 and 2027-01-15/i,
    );
    expect(plannedShapeChangeCue(planned, '2026-09-04')).toMatch(/today is unchanged/i);
    expect(plannedShapeChangeCue(planned, '2026-12-01')).toMatch(
      /showing the planned shape for 2026-12-01/i,
    );
    expect(plannedShapeChangeCue([], '2026-09-04')).toBeNull();
  });

  it('parses planned ids and rejects past dates', () => {
    expect(parsePlannedShapeChangeId(plannedChangeIdForMember('mem_future'))).toEqual({
      kind: 'capacity',
      memberId: 'mem_future',
    });
    expect(
      parsePlannedShapeChangeId(
        plannedChangeIdForRelationship('team_stream', 'team_platform', 'collaboration'),
      ),
    ).toEqual({
      kind: 'relationship',
      fromTeamId: 'team_stream',
      toTeamId: 'team_platform',
      mode: 'collaboration',
    });
    expect(parsePlannedShapeChangeId('other')).toBeNull();
    expect(isFutureIsoDate('2026-12-01', '2026-09-04')).toBe(true);
    expect(isFutureIsoDate('2026-09-04', '2026-09-04')).toBe(false);
    expect(calendarTodayIsoDate(new Date('2026-09-04T12:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
