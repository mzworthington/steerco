import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSteerSpecYaml, type SteerSpec } from '../../index';
import { detectSteerSpecMismatches, DEFAULT_PLATFORM_OVERLOAD_THRESHOLD } from './detectMismatches';

const fixtureDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../fixtures');
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

function loadSample(): SteerSpec {
  const parsed = parseSteerSpecYaml(sampleYaml);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.value;
}

describe('detectSteerSpecMismatches', () => {
  it('does not flag platform_overload on the sample workspace', () => {
    const mismatches = detectSteerSpecMismatches(loadSample());
    expect(mismatches.some((item) => item.code === 'platform_overload')).toBe(false);
  });

  it('flags platform_overload when dependents meet the threshold', () => {
    const sample = loadSample();
    const dependents = Array.from({ length: DEFAULT_PLATFORM_OVERLOAD_THRESHOLD }, (_, index) => ({
      id: `team_dep_${index}`,
      displayName: `Dependent ${index}`,
      role: 'stream_aligned' as const,
      provenance: 'local' as const,
      externalRefs: [],
      members: [],
      streamIds: [],
    }));
    const overloaded: SteerSpec = {
      ...sample,
      spec: {
        ...sample.spec,
        teams: [...sample.spec.teams, ...dependents],
        relationships: [
          ...sample.spec.relationships,
          ...dependents.map((team) => ({
            fromTeamId: team.id,
            toTeamId: 'team_fulfilil',
            mode: 'x_as_a_service' as const,
          })),
        ],
      },
    };

    const mismatches = detectSteerSpecMismatches(overloaded);
    const overload = mismatches.find((item) => item.code === 'platform_overload');
    expect(overload).toBeTruthy();
    expect(overload?.headline).toMatch(/cognitive-load|flow/i);
    expect(overload?.headline).toMatch(/Fulfilment platform|8/);
  });

  it('flags bet_without_team when fundedTeamIds is empty', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet, index) =>
      index === 0 ? { ...bet, fundedTeamIds: [] } : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'bet_without_team')).toBe(true);
  });

  it('does not flag bet_without_mos_link, collab_without_end, stream_bet_wip, or enabling_owns_delivery on the sample workspace', () => {
    const mismatches = detectSteerSpecMismatches(loadSample());
    expect(mismatches.some((item) => item.code === 'bet_without_mos_link')).toBe(false);
    expect(mismatches.some((item) => item.code === 'collab_without_end')).toBe(false);
    expect(mismatches.some((item) => item.code === 'stream_bet_wip')).toBe(false);
    expect(mismatches.some((item) => item.code === 'enabling_owns_delivery')).toBe(false);
  });

  it('flags bet_without_mos_link when an active bet has no metricIds or primaryMetricId', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_pickup' ? { ...bet, metricIds: [], primaryMetricId: null } : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    const mismatch = mismatches.find((item) => item.code === 'bet_without_mos_link');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.severity).toBe('warning');
    expect(mismatch?.relatedBetIds).toEqual(['bet_pickup']);
  });

  it('does not flag bet_without_mos_link for a proposed bet with no MoS link', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_pickup'
        ? { ...bet, status: 'proposed' as const, metricIds: [], primaryMetricId: null }
        : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'bet_without_mos_link')).toBe(false);
  });

  it('does not flag bet_without_mos_link when only primaryMetricId is set', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_pickup' ? { ...bet, metricIds: [], primaryMetricId: 'met_promise_hit' } : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'bet_without_mos_link')).toBe(false);
  });

  it('flags collab_without_end when a facilitation relationship has no expectedUntil', () => {
    const sample = loadSample();
    const nextRelationships = sample.spec.relationships.map((rel) =>
      rel.fromTeamId === 'team_enablement' ? { ...rel, expectedUntil: undefined } : rel,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, relationships: nextRelationships },
    });
    const mismatch = mismatches.find((item) => item.code === 'collab_without_end');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.severity).toBe('warning');
    expect(mismatch?.relatedTeamIds).toEqual(['team_enablement', 'team_storefront']);
  });

  it('flags collab_without_end for collaboration mode too, but not for x_as_a_service', () => {
    const sample = loadSample();
    const nextRelationships = [
      ...sample.spec.relationships,
      { fromTeamId: 'team_storefront', toTeamId: 'team_catalog', mode: 'collaboration' as const },
    ];
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, relationships: nextRelationships },
    });
    const collabMismatches = mismatches.filter((item) => item.code === 'collab_without_end');
    expect(collabMismatches).toHaveLength(1);
    expect(collabMismatches[0]?.relatedTeamIds).toEqual(['team_storefront', 'team_catalog']);
  });

  it('does not flag collab_without_end when expectedUntil is present', () => {
    const mismatches = detectSteerSpecMismatches(loadSample());
    expect(mismatches.some((item) => item.code === 'collab_without_end')).toBe(false);
  });

  it('flags stream_bet_wip when a stream-aligned team funds more than two active bets', () => {
    const sample = loadSample();
    const extraBets = [
      {
        id: 'bet_extra_1',
        outcomeId: 'out_promise',
        title: 'Extra bet one',
        successSignal: 'Signal',
        killCriteria: 'Kill criteria',
        status: 'on_track' as const,
        fundedTeamIds: ['team_storefront'],
        systemRefs: [],
        metricIds: [],
      },
      {
        id: 'bet_extra_2',
        outcomeId: 'out_promise',
        title: 'Extra bet two',
        successSignal: 'Signal',
        killCriteria: 'Kill criteria',
        status: 'proposed' as const,
        fundedTeamIds: ['team_storefront'],
        systemRefs: [],
        metricIds: [],
      },
    ];
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: [...sample.spec.bets, ...extraBets] },
    });
    const mismatch = mismatches.find((item) => item.code === 'stream_bet_wip');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.severity).toBe('warning');
    expect(mismatch?.relatedTeamIds).toEqual(['team_storefront']);
    expect(mismatch?.relatedBetIds).toEqual(['bet_pickup', 'bet_extra_1', 'bet_extra_2']);
  });

  it('does not flag stream_bet_wip at exactly the threshold', () => {
    const mismatches = detectSteerSpecMismatches(loadSample());
    expect(mismatches.some((item) => item.code === 'stream_bet_wip')).toBe(false);
  });

  it('flags enabling_owns_delivery when an enabling team is the sole funded team on an active bet', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_loyalty' ? { ...bet, fundedTeamIds: ['team_enablement'] } : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    const mismatch = mismatches.find((item) => item.code === 'enabling_owns_delivery');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.severity).toBe('warning');
    expect(mismatch?.relatedTeamIds).toEqual(['team_enablement']);
    expect(mismatch?.relatedBetIds).toEqual(['bet_loyalty']);
  });

  it('does not flag enabling_owns_delivery when an enabling team co-funds a bet with others', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_loyalty'
        ? { ...bet, fundedTeamIds: ['team_enablement', 'team_fulfilil'] }
        : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'enabling_owns_delivery')).toBe(false);
  });

  it('does not flag enabling_owns_delivery for a proposed bet solely funded by an enabling team', () => {
    const sample = loadSample();
    const nextBets = sample.spec.bets.map((bet) =>
      bet.id === 'bet_loyalty'
        ? { ...bet, status: 'proposed' as const, fundedTeamIds: ['team_enablement'] }
        : bet,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, bets: nextBets },
    });
    expect(mismatches.some((item) => item.code === 'enabling_owns_delivery')).toBe(false);
  });

  it('flags stream_missing_product when a stream team has members but no product discipline', () => {
    const sample = loadSample();
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_catalog'
        ? {
            ...team,
            members: team.members.filter((member) => member.discipline !== 'product'),
          }
        : team,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    const mismatch = mismatches.find((item) => item.code === 'stream_missing_product');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.severity).toBe('warning');
    expect(mismatch?.relatedTeamIds).toEqual(['team_catalog']);
  });

  it('flags stream_aligned_multi_stream when a stream-aligned team spans multiple streams', () => {
    const sample = loadSample();
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_storefront'
        ? { ...team, streamIds: ['stream_storefront', 'stream_catalog'] }
        : team,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    const mismatch = mismatches.find((item) => item.code === 'stream_aligned_multi_stream');
    expect(mismatch).toBeTruthy();
    expect(mismatch?.headline).toMatch(/multiple streams|cognitive load|one stream/i);
  });

  it('flags css_without_stream when a complicated subsystem has no stream', () => {
    const sample = loadSample();
    const nextTeams = sample.spec.teams.map((team) =>
      team.id === 'team_pricing' ? { ...team, streamIds: [] } : team,
    );
    const mismatches = detectSteerSpecMismatches({
      ...sample,
      spec: { ...sample.spec, teams: nextTeams },
    });
    expect(mismatches.some((item) => item.code === 'css_without_stream')).toBe(true);
  });
});
