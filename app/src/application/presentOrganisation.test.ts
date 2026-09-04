import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyAddOrganisationMember,
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
  applyClearPlannedShapeChange,
  applyMoveOrganisationMember,
  applyRecordPlannedShapeChange,
  applyUpdateOrganisationMember,
  applyUpdateOrganisationTeam,
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
    expect(model.layout).toBe('flow');
    expect(model.viewMode).toBe('as_is');
    expect(model.teachingLine).toMatch(/interaction graph/i);
    expect(model.flow?.streams.map((band) => band.title)).toEqual(
      expect.arrayContaining(['Storefront', 'Catalog']),
    );
    expect(model.zones.map((zone) => zone.role)).toEqual([
      'stream_aligned',
      'platform',
      'enabling',
      'complicated_subsystem',
    ]);
    expect(model.zones[0]?.teams.map((team) => team.displayName)).toEqual(
      expect.arrayContaining(['Storefront experience', 'Catalog and discovery']),
    );
    expect(model.zones[0]?.teams.length).toBeGreaterThan(10);
    expect(model.flow?.streams.map((band) => band.title)).toEqual(
      expect.arrayContaining(['Storefront', 'Catalog']),
    );
    expect(model.flow?.streams[0]?.complicatedSubsystems.map((team) => team.displayName)).toEqual(
      expect.arrayContaining(['Pricing engine']),
    );
    expect(model.flow?.streams[0]?.domainTitle).toBe('Commerce');
    expect(model.flow?.platforms.some((item) => item.scopeLabel === 'Organisation')).toBe(true);
    const waysOfWorking = model.flow?.enabling.find(
      (item) => item.team.displayName === 'Ways of working',
    );
    expect(waysOfWorking?.facilitatesLabels).toEqual(
      expect.arrayContaining(['Storefront experience', 'Catalog and discovery']),
    );
    expect(model.zones[0]?.shape).toBe('rounded_horizontal');
    expect(model.zones[1]?.shape).toBe('square_dotted');
    const storefront = model.zones[0]?.teams.find((team) => team.id === 'team_storefront');
    expect(storefront?.capacityLabel).toMatch(/\d+ people/i);
    expect(storefront?.members[0]).toMatchObject({
      discipline: 'leadership',
      disciplineLabel: 'Leadership',
      title: 'Engineering Manager',
      initials: 'PN',
    });
    expect(storefront?.fteTotal).toBeGreaterThan(2);
    expect(model.relationships.some((item) => /uses as a service/i.test(item.sentence))).toBe(true);
    expect(model.relationships.some((item) => item.modeLabel === 'X-as-a-Service')).toBe(true);
    expect(model.relationships.find((item) => item.mode === 'x_as_a_service')?.shape).toBe(
      'triangle',
    );
    expect(model.overloadBanner).toBeNull();
    const facilitation = model.relationships.filter((item) => item.mode === 'facilitation');
    expect(facilitation.length).toBeGreaterThanOrEqual(2);
    expect(
      facilitation.find(
        (item) => item.fromTeamId === 'team_enablement' && item.toTeamId === 'team_storefront',
      )?.expectedUntil,
    ).toBe('2026-12-31');
    const service = model.relationships.find((item) => item.mode === 'x_as_a_service');
    expect(service?.expectedUntil).toBeNull();
  });

  it('projects capacity as of a selected date', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const withWindow = {
      ...opened.value,
      spec: {
        ...opened.value.spec,
        teams: opened.value.spec.teams.map((team) =>
          team.id === 'team_storefront'
            ? {
                ...team,
                members: team.members.map((member, index) =>
                  index === 0
                    ? { ...member, effectiveFrom: '2026-01-01', effectiveUntil: '2026-06-30' }
                    : member,
                ),
              }
            : team,
        ),
      },
    };

    const before = presentOrganisation(withWindow, { asOf: '2026-03-01' });
    const after = presentOrganisation(withWindow, { asOf: '2026-08-01' });
    const storefrontBefore = before.zones[0]?.teams.find((t) => t.id === 'team_storefront');
    const storefrontAfter = after.zones[0]?.teams.find((t) => t.id === 'team_storefront');
    expect(storefrontBefore?.members.some((m) => m.id === 'mem_storefront_em')).toBe(true);
    expect(storefrontAfter?.members.some((m) => m.id === 'mem_storefront_em')).toBe(false);
    expect(after.asOf).toBe('2026-08-01');
    expect(after.pointInTimeLine).toMatch(/2026-08-01/);
  });

  it('builds flow layout with stream bands for capacity', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const model = presentOrganisation(opened.value, { viewMode: 'as_is' });
    expect(model.viewMode).toBe('as_is');
    expect(model.teachingLine).toMatch(/interaction graph/i);
    expect(model.flow?.streams[0]?.streamAlignedTeams.map((team) => team.displayName)).toContain(
      'Storefront experience',
    );
  });

  it('filters as-is flow streams by domain while keeping shared platforms', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const filtered = presentOrganisation(opened.value, {
      viewMode: 'as_is',
      domainId: 'domain_commerce',
    });
    expect(filtered.flow?.streams.every((band) => band.domainTitle === 'Commerce')).toBe(true);
    expect(filtered.flow?.streams.map((band) => band.title)).toEqual(
      expect.arrayContaining(['Storefront', 'Catalog']),
    );
    expect(filtered.flow?.streams.some((band) => band.title === 'Warehouse')).toBe(false);
    expect(filtered.flow?.platforms.length).toBeGreaterThan(0);
    expect(filtered.flow?.enabling.length).toBeGreaterThan(0);

    const all = presentOrganisation(opened.value, { viewMode: 'as_is' });
    expect(all.flow?.streams.length).toBeGreaterThan(filtered.flow?.streams.length ?? 0);
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
    expect(model.zones[0]?.teams.length).toBeGreaterThan(2);
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
      domainId: 'domain_customer',
      streamId: 'stream_returns',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const team = applied.value.spec.teams.find((item) => item.displayName === 'Returns desk');
    expect(team?.streamIds).toEqual(['stream_returns']);
  });
});

describe('applyUpdateOrganisationTeam', () => {
  it('updates display name, role, and stream placement', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyUpdateOrganisationTeam(opened.value, {
      teamId: 'team_storefront',
      displayName: 'Storefront web',
      role: 'stream_aligned',
      domainId: 'domain_commerce',
      streamId: 'stream_checkout',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const team = applied.value.spec.teams.find((item) => item.id === 'team_storefront');
    expect(team?.displayName).toBe('Storefront web');
    expect(team?.streamIds).toEqual(['stream_checkout']);
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
      effectiveFrom: '2026-08-11',
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const relationship = applied.value.spec.relationships.find(
      (item) =>
        item.fromTeamId === 'team_enablement' &&
        item.toTeamId === 'team_catalog' &&
        item.mode === 'collaboration',
    );
    expect(relationship?.expectedUntil).toBe('2026-12-01');
    expect(relationship?.effectiveFrom).toBe('2026-08-11');
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

describe('applyMoveOrganisationMember', () => {
  it('moves a person from one team shape to another', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyMoveOrganisationMember(opened.value, {
      memberId: 'mem_storefront_pm',
      fromTeamId: 'team_storefront',
      toTeamId: 'team_catalog',
      ftePercent: 40,
    });
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const storefront = applied.value.spec.teams.find((team) => team.id === 'team_storefront');
    const catalog = applied.value.spec.teams.find((team) => team.id === 'team_catalog');
    expect(storefront?.members?.some((member) => member.id === 'mem_storefront_pm')).toBe(false);
    expect(catalog?.members?.find((member) => member.id === 'mem_storefront_pm')).toMatchObject({
      displayName: 'Casey Morales',
      ftePercent: 40,
    });
  });

  it('rejects moving a person who is not on the source team', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyMoveOrganisationMember(opened.value, {
      memberId: 'mem_storefront_pm',
      fromTeamId: 'team_catalog',
      toTeamId: 'team_fulfilil',
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

describe('planned shape change', () => {
  const today = '2026-09-04';
  const plannedAt = '2026-12-01';

  it('projects a future relationship onto as-of that date and leaves today unchanged', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const recorded = applyRecordPlannedShapeChange(
      opened.value,
      {
        kind: 'relationship',
        at: plannedAt,
        fromTeamId: 'team_pos',
        toTeamId: 'team_fulfilil',
        mode: 'x_as_a_service',
      },
      today,
    );
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) return;

    const asToday = presentOrganisation(recorded.value, { asOf: today, today });
    expect(asToday.plannedChanges).toHaveLength(1);
    expect(asToday.plannedChangeCue).toMatch(/planned shape change is recorded for 2026-12-01/i);
    expect(asToday.plannedChangeCue).toMatch(/today is unchanged/i);
    expect(asToday.mismatches.some((item) => item.code === 'platform_overload')).toBe(false);

    const asPlanned = presentOrganisation(recorded.value, { asOf: plannedAt, today });
    expect(asPlanned.plannedChangeCue).toMatch(/showing the planned shape for 2026-12-01/i);
    expect(asPlanned.mismatches.some((item) => item.code === 'platform_overload')).toBe(true);
    expect(asPlanned.overloadBanner).toMatch(/fulfilment platform/i);
    expect(asPlanned.overloadBanner).toMatch(/8 teams/i);
  });

  it('projects a future capacity seat onto as-of that date', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const recorded = applyRecordPlannedShapeChange(
      opened.value,
      {
        kind: 'capacity',
        at: plannedAt,
        teamId: 'team_storefront',
        displayName: 'Horizon Hire',
        title: 'Engineer',
        ftePercent: 100,
        discipline: 'engineering',
      },
      today,
    );
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) return;

    const asToday = presentOrganisation(recorded.value, { asOf: today, today });
    const storefrontToday = asToday.zones
      .flatMap((zone) => zone.teams)
      .find((team) => team.id === 'team_storefront');
    expect(storefrontToday?.members.some((member) => member.displayName === 'Horizon Hire')).toBe(
      false,
    );
    expect(asToday.plannedChanges[0]?.summary).toMatch(/horizon hire/i);
    expect(asToday.plannedChangeCue).toMatch(/2026-12-01/);

    const asPlanned = presentOrganisation(recorded.value, { asOf: plannedAt, today });
    const storefrontPlanned = asPlanned.zones
      .flatMap((zone) => zone.teams)
      .find((team) => team.id === 'team_storefront');
    expect(storefrontPlanned?.members.some((member) => member.displayName === 'Horizon Hire')).toBe(
      true,
    );
  });

  it('clears a planned event so a future as-of no longer shows it', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const recorded = applyRecordPlannedShapeChange(
      opened.value,
      {
        kind: 'relationship',
        at: plannedAt,
        fromTeamId: 'team_pos',
        toTeamId: 'team_fulfilil',
        mode: 'x_as_a_service',
      },
      today,
    );
    expect(recorded.ok).toBe(true);
    if (!recorded.ok) return;

    const cleared = applyClearPlannedShapeChange(recorded.value, recorded.plannedId);
    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;

    const asPlanned = presentOrganisation(cleared.value, { asOf: plannedAt, today });
    expect(asPlanned.plannedChanges).toEqual([]);
    expect(asPlanned.plannedChangeCue).toBeNull();
    expect(asPlanned.mismatches.some((item) => item.code === 'platform_overload')).toBe(false);
    expect(
      cleared.value.spec.relationships.some(
        (item) =>
          item.fromTeamId === 'team_pos' &&
          item.toTeamId === 'team_fulfilil' &&
          item.mode === 'x_as_a_service',
      ),
    ).toBe(false);
    expect(
      cleared.value.spec.topologyEvents?.some((event) => event.id === recorded.plannedId),
    ).toBe(false);
  });

  it('rejects a planned change dated today or earlier', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const applied = applyRecordPlannedShapeChange(
      opened.value,
      {
        kind: 'capacity',
        at: today,
        teamId: 'team_storefront',
        displayName: 'Too Soon',
        title: 'Engineer',
        ftePercent: 100,
        discipline: 'engineering',
      },
      today,
    );
    expect(applied.ok).toBe(false);
    if (applied.ok) return;
    expect(applied.error).toMatch(/future date/i);
  });
});
