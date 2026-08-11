import { describe, expect, it } from 'vitest';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';
import {
  isEffectiveInRange,
  isEffectiveOnDate,
  projectSteerSpecAsOf,
} from './projectSteerSpecAsOf';

const minimalDoc = `
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
      streamIds: [stream_checkout]
      members:
        - id: mem_early
          displayName: Early Bird
          discipline: engineering
          title: Engineer
          ftePercent: 100
          effectiveFrom: 2026-01-01
          effectiveUntil: 2026-06-30
        - id: mem_late
          displayName: Late Join
          discipline: product
          title: PM
          ftePercent: 50
          effectiveFrom: 2026-07-01
    - id: team_css
      displayName: Pricing engine
      role: complicated_subsystem
      provenance: local
      streamIds: [stream_checkout]
      members: []
    - id: team_platform
      displayName: Shared platform
      role: platform
      provenance: local
      platformScope: organisation
      members: []
  streams:
    - id: stream_checkout
      title: Checkout
  domains:
    - id: domain_commerce
      title: Commerce
      memberStreamIds: [stream_checkout]
  groupings:
    - id: grp_platform
      kind: platform
      title: Shared platform
      platformScope: organisation
      memberTeamIds: [team_platform]
  relationships:
    - fromTeamId: team_stream
      toTeamId: team_platform
      mode: x_as_a_service
      effectiveFrom: 2026-01-01
    - fromTeamId: team_css
      toTeamId: team_stream
      mode: x_as_a_service
      effectiveFrom: 2026-03-01
      effectiveUntil: 2026-05-31
`;

const legacyDoc = `
apiVersion: steerco.dev/v1alpha1
kind: SteerTree
metadata:
  name: legacy
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_stream
      displayName: Stream
      role: stream_aligned
      provenance: local
      members: []
    - id: team_css
      displayName: Pricing
      role: complicated_subsystem
      provenance: local
      withinTeamId: team_stream
      members: []
  groupings:
    - id: grp_checkout
      kind: value_stream
      title: Checkout
      memberTeamIds: [team_stream, team_css]
`;

describe('isEffectiveOnDate', () => {
  it('treats open windows as always active', () => {
    expect(isEffectiveOnDate({}, '2026-08-01')).toBe(true);
  });

  it('respects inclusive from/until bounds', () => {
    expect(
      isEffectiveOnDate(
        { effectiveFrom: '2026-07-01', effectiveUntil: '2026-07-31' },
        '2026-07-01',
      ),
    ).toBe(true);
    expect(
      isEffectiveOnDate(
        { effectiveFrom: '2026-07-01', effectiveUntil: '2026-07-31' },
        '2026-07-31',
      ),
    ).toBe(true);
    expect(
      isEffectiveOnDate(
        { effectiveFrom: '2026-07-01', effectiveUntil: '2026-07-31' },
        '2026-06-30',
      ),
    ).toBe(false);
    expect(
      isEffectiveOnDate(
        { effectiveFrom: '2026-07-01', effectiveUntil: '2026-07-31' },
        '2026-08-01',
      ),
    ).toBe(false);
  });
});

describe('projectSteerSpecAsOf', () => {
  it('parses streams, domains, platformScope, and streamIds', () => {
    const parsed = parseSteerSpecYaml(minimalDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.value.spec.streams).toHaveLength(1);
    expect(parsed.value.spec.domains[0]).toMatchObject({
      id: 'domain_commerce',
      memberStreamIds: ['stream_checkout'],
    });
    expect(parsed.value.spec.teams.find((t) => t.id === 'team_platform')?.platformScope).toBe(
      'organisation',
    );
    expect(parsed.value.spec.teams.find((t) => t.id === 'team_css')?.streamIds).toEqual([
      'stream_checkout',
    ]);
  });

  it('migrates legacy value_stream groupings and withinTeamId into streams', () => {
    const parsed = parseSteerSpecYaml(legacyDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.spec.streams.map((s) => s.id)).toEqual(['grp_checkout']);
    expect(parsed.value.spec.groupings).toEqual([]);
    expect(parsed.value.spec.teams.find((t) => t.id === 'team_stream')?.streamIds).toEqual([
      'grp_checkout',
    ]);
    expect(parsed.value.spec.teams.find((t) => t.id === 'team_css')?.streamIds).toEqual([
      'grp_checkout',
    ]);
    expect(parsed.value.spec.teams.find((t) => t.id === 'team_css')).not.toHaveProperty(
      'withinTeamId',
    );
  });

  it('filters members and relationships to the as-of date', () => {
    const parsed = parseSteerSpecYaml(minimalDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const mid = projectSteerSpecAsOf(parsed.value, '2026-04-15');
    const stream = mid.spec.teams.find((t) => t.id === 'team_stream');
    expect(stream?.members.map((m) => m.id)).toEqual(['mem_early']);
    expect(mid.spec.relationships).toHaveLength(2);

    const late = projectSteerSpecAsOf(parsed.value, '2026-08-01');
    const streamLate = late.spec.teams.find((t) => t.id === 'team_stream');
    expect(streamLate?.members.map((m) => m.id)).toEqual(['mem_late']);
    expect(late.spec.relationships).toHaveLength(1);
    expect(late.spec.relationships[0]?.fromTeamId).toBe('team_stream');
  });

  it('returns the document unchanged when asOf is empty', () => {
    const parsed = parseSteerSpecYaml(minimalDoc);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(projectSteerSpecAsOf(parsed.value, null)).toBe(parsed.value);
    expect(projectSteerSpecAsOf(parsed.value, '  ')).toBe(parsed.value);
  });
});

describe('isEffectiveInRange', () => {
  it('treats open windows as always overlapping', () => {
    expect(isEffectiveInRange({}, '2026-01-01', '2026-12-31')).toBe(true);
  });

  it('detects overlap against a closed window', () => {
    const window = { effectiveFrom: '2026-03-01', effectiveUntil: '2026-05-31' };
    expect(isEffectiveInRange(window, '2026-01-01', '2026-02-28')).toBe(false);
    expect(isEffectiveInRange(window, '2026-04-01', '2026-04-30')).toBe(true);
    expect(isEffectiveInRange(window, '2026-06-01', '2026-07-01')).toBe(false);
    expect(isEffectiveInRange(window, '2026-05-01', '2026-08-01')).toBe(true);
  });

  it('falls back to a single as-of day when only one bound is set', () => {
    const window = { effectiveFrom: '2026-03-01', effectiveUntil: '2026-05-31' };
    expect(isEffectiveInRange(window, '2026-04-15', null)).toBe(true);
    expect(isEffectiveInRange(window, null, '2026-02-01')).toBe(false);
    expect(isEffectiveOnDate(window, '2026-04-15')).toBe(true);
  });
});
