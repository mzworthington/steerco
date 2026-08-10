import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import {
  applyAddOrganisationRelationship,
  applyAddOrganisationTeam,
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
    expect(model.zones[0]?.teams[0]?.fteTotal).toBe(2.5);
    expect(model.relationships.some((item) => /uses as a service/i.test(item.sentence))).toBe(true);
    expect(model.relationships.some((item) => item.modeLabel === 'X-as-a-Service')).toBe(true);
    expect(model.overloadBanner).toBeNull();
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
});
