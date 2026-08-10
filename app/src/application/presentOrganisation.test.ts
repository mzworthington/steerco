import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyAddOrganisationMember,
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
  applyUpdateOrganisationMember,
  presentOrganisation,
} from './presentOrganisation';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('presentOrganisation', () => {
  it('groups sample teams into four Team Topologies zones with capacity', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentOrganisation(opened.value);
    expect(model.empty).toBe(false);
    expect(model.teachingLine).toMatch(/four team types/i);
    expect(model.zones.map((zone) => zone.role)).toEqual([
      'stream_aligned',
      'platform',
      'enabling',
      'complicated_subsystem',
    ]);
    expect(model.zones[0]?.teams.map((team) => team.displayName)).toEqual([
      'Storefront experience',
      'Catalog and discovery',
    ]);
    expect(model.zones[0]?.teams[0]?.capacityLabel).toMatch(/3 members/i);
    expect(model.zones[0]?.teams[0]?.members[0]).toMatchObject({
      discipline: 'leadership',
      disciplineLabel: 'Leadership',
      title: 'Engineering Manager',
    });
    expect(model.zones[0]?.teams[0]?.fteTotal).toBe(2.5);
    expect(model.relationships.some((item) => /uses as a service/i.test(item.sentence))).toBe(true);
    expect(model.relationships.some((item) => item.modeLabel === 'X-as-a-Service')).toBe(true);
    expect(model.overloadBanner).toBeNull();
    const facilitation = model.relationships.find((item) => item.mode === 'facilitation');
    expect(facilitation?.expectedUntil).toBe('2026-12-31');
    const service = model.relationships.find((item) => item.mode === 'x_as_a_service');
    expect(service?.expectedUntil).toBeNull();
  });

  it('normalizes legacy roles and modes from stored sessions without crashing', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const legacy = {
      ...opened.value,
      spec: {
        ...opened.value.spec,
        teams: opened.value.spec.teams.map((team) => ({
          ...team,
          role:
            team.role === 'stream_aligned'
              ? ('customer_facing' as never)
              : team.role === 'platform'
                ? ('shared_platform' as never)
                : team.role === 'enabling'
                  ? ('coaching_support' as never)
                  : team.role,
          members: undefined as never,
        })),
        relationships: opened.value.spec.relationships.map((relationship) => ({
          ...relationship,
          mode:
            relationship.mode === 'x_as_a_service'
              ? ('uses_as_service' as never)
              : relationship.mode === 'facilitation'
                ? ('coaching' as never)
                : relationship.mode,
        })),
      },
    };

    const model = presentOrganisation(legacy);
    expect(model.zones[0]?.teams.length).toBe(2);
    expect(model.relationships.some((item) => item.modeLabel === 'X-as-a-Service')).toBe(true);
  });
});

describe('applyAddOrganisationTeam', () => {
  it('adds a stream-aligned team to SteerSpec', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddOrganisationTeam(opened.value, {
      displayName: 'Returns desk',
      role: 'stream_aligned',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.value.spec.teams.some((team) => team.displayName === 'Returns desk')).toBe(true);
  });
});

describe('applyAddOrganisationRelationship', () => {
  it('records an X-as-a-Service relationship', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const withTeam = applyAddOrganisationTeam(opened.value, {
      displayName: 'Returns desk',
      role: 'stream_aligned',
    });
    expect(withTeam.ok).toBe(true);
    if (!withTeam.ok) return;

    const returns = withTeam.value.spec.teams.find((team) => team.displayName === 'Returns desk');
    expect(returns).toBeTruthy();
    if (!returns) return;

    const applied = applyAddOrganisationRelationship(withTeam.value, {
      fromTeamId: returns.id,
      toTeamId: 'team_fulfilil',
      mode: 'x_as_a_service',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(
      applied.value.spec.relationships.some(
        (relationship) =>
          relationship.fromTeamId === returns.id &&
          relationship.toTeamId === 'team_fulfilil' &&
          relationship.mode === 'x_as_a_service',
      ),
    ).toBe(true);
  });

  it('records an expectedUntil time-box for a collaboration relationship', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddOrganisationRelationship(opened.value, {
      fromTeamId: 'team_enablement',
      toTeamId: 'team_catalog',
      mode: 'collaboration',
      expectedUntil: '2026-12-01',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const relationship = applied.value.spec.relationships.find(
      (item) => item.fromTeamId === 'team_enablement' && item.toTeamId === 'team_catalog',
    );
    expect(relationship?.expectedUntil).toBe('2026-12-01');
  });
});

describe('applyAddOrganisationMember', () => {
  it('adds a member with capacity windows to an existing team', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddOrganisationMember(opened.value, {
      teamId: 'team_catalog',
      displayName: 'Nina Torres',
      title: 'Backend Engineer',
      ftePercent: 80,
      discipline: 'engineering',
      effectiveFrom: '2026-09-01',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const team = applied.value.spec.teams.find((item) => item.id === 'team_catalog');
    const member = team?.members?.find((item) => item.displayName === 'Nina Torres');
    expect(member).toMatchObject({
      title: 'Backend Engineer',
      ftePercent: 80,
      discipline: 'engineering',
      effectiveFrom: '2026-09-01',
    });
  });

  it('rejects an unknown team', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyAddOrganisationMember(opened.value, {
      teamId: 'team_missing',
      displayName: 'Nina Torres',
      title: 'Backend Engineer',
      ftePercent: 80,
      discipline: 'engineering',
    });
    expect(applied.ok).toBe(false);
  });
});

describe('applyUpdateOrganisationMember', () => {
  it('updates discipline, title, and FTE for an existing member', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyUpdateOrganisationMember(opened.value, {
      teamId: 'team_catalog',
      memberId: 'mem_catalog_pm',
      displayName: 'Avery Ng',
      title: 'Product Lead',
      ftePercent: 50,
      discipline: 'product',
      effectiveUntil: '2026-12-31',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const team = applied.value.spec.teams.find((item) => item.id === 'team_catalog');
    const member = team?.members?.find((item) => item.id === 'mem_catalog_pm');
    expect(member).toMatchObject({
      displayName: 'Avery Ng',
      title: 'Product Lead',
      ftePercent: 50,
      discipline: 'product',
      effectiveUntil: '2026-12-31',
    });
  });

  it('rejects an unknown member', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyUpdateOrganisationMember(opened.value, {
      teamId: 'team_catalog',
      memberId: 'mem_missing',
      displayName: 'Ghost',
      title: 'None',
      ftePercent: 10,
      discipline: 'other',
    });
    expect(applied.ok).toBe(false);
  });
});
