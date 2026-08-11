import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import { buildTopologyTimeline } from './buildTopologyTimeline';

const docYaml = `
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: timeline-demo
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
        - id: mem_steady
          displayName: Steady
          discipline: engineering
          title: Engineer
          ftePercent: 100
        - id: mem_temp
          displayName: Temp
          discipline: engineering
          title: Contractor
          ftePercent: 50
          effectiveFrom: 2026-04-01
          effectiveUntil: 2026-06-30
    - id: team_platform
      displayName: Platform
      role: platform
      provenance: local
      members: []
    - id: team_enable
      displayName: Enable
      role: enabling
      provenance: local
      members: []
  relationships:
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: x_as_a_service
    - fromTeamId: team_enable
      toTeamId: team_stream
      mode: facilitation
      effectiveFrom: 2026-03-01
      expectedUntil: 2026-09-30
  topologyEvents:
    - id: evt_facilitation
      at: 2026-03-01
      kind: relationship_added
      summary: Enable started facilitation with Stream
      teamIds: [team_enable, team_stream]
      relationshipKey: team_enable::team_stream
`;

describe('buildTopologyTimeline', () => {
  it('derives capacity deltas from member effective windows', () => {
    const parsed = parseSteerSpecYaml(docYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const timeline = buildTopologyTimeline(parsed.value);
    expect(timeline.capacityDeltas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          at: '2026-04-01',
          teamId: 'team_stream',
          memberId: 'mem_temp',
          deltaFtePercent: 50,
          kind: 'capacity_up',
        }),
        expect.objectContaining({
          at: '2026-06-30',
          teamId: 'team_stream',
          memberId: 'mem_temp',
          deltaFtePercent: -50,
          kind: 'capacity_down',
        }),
      ]),
    );
  });

  it('draws relationship spans using effective windows and expectedUntil fallback', () => {
    const parsed = parseSteerSpecYaml(docYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const timeline = buildTopologyTimeline(parsed.value);
    const facilitation = timeline.relationshipSpans.find(
      (span) => span.fromTeamId === 'team_enable' && span.toTeamId === 'team_stream',
    );
    const xaas = timeline.relationshipSpans.find(
      (span) => span.fromTeamId === 'team_stream' && span.toTeamId === 'team_platform',
    );
    expect(facilitation).toMatchObject({
      mode: 'facilitation',
      start: '2026-03-01',
      end: '2026-09-30',
    });
    expect(xaas).toMatchObject({
      mode: 'x_as_a_service',
      start: null,
      end: null,
    });
  });

  it('merges ledger events with derived capacity events for the a11y list', () => {
    const parsed = parseSteerSpecYaml(docYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const timeline = buildTopologyTimeline(parsed.value);
    expect(timeline.events.map((event) => event.id)).toEqual(
      expect.arrayContaining(['evt_facilitation', 'derived:mem_temp:up', 'derived:mem_temp:down']),
    );
    expect(timeline.events.map((event) => event.at)).toEqual([
      '2026-03-01',
      '2026-04-01',
      '2026-06-30',
    ]);
    expect(timeline.events.find((event) => event.id === 'evt_facilitation')?.source).toBe('ledger');
    expect(timeline.events.find((event) => event.id === 'derived:mem_temp:up')?.source).toBe(
      'derived',
    );
  });

  it('computes a scrub range covering deltas, spans, and ledger events', () => {
    const parsed = parseSteerSpecYaml(docYaml);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const timeline = buildTopologyTimeline(parsed.value);
    expect(timeline.rangeStart).toBe('2026-03-01');
    expect(timeline.rangeEnd).toBe('2026-09-30');
  });

  it('returns empty timeline when nothing is dated', () => {
    const parsed = parseSteerSpecYaml(`
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: empty
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_a
      displayName: A
      role: stream_aligned
      provenance: local
      members:
        - id: mem_a
          displayName: A
          discipline: engineering
          title: Engineer
          ftePercent: 100
  relationships: []
`);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const timeline = buildTopologyTimeline(parsed.value);
    expect(timeline.capacityDeltas).toEqual([]);
    expect(timeline.relationshipSpans).toEqual([]);
    expect(timeline.events).toEqual([]);
    expect(timeline.rangeStart).toBeNull();
    expect(timeline.rangeEnd).toBeNull();
  });
});
