import { describe, expect, it } from 'vitest';
import { applyTeamCatalogMerge, parseCatalogFile, proposeTeamCatalogMerge } from './catalogImport';
import { parseSteerSpecYaml } from './parseSteerSpecYaml';

const baseYaml = `
apiVersion: steerlens.dev/v1alpha1
kind: SteerTree
metadata:
  name: demo
spec:
  vision: A vision
  outcomes: []
  bets: []
  teams:
    - id: team_storefront
      displayName: Storefront
      role: stream_aligned
      provenance: local
      members: []
`;

describe('catalogImport', () => {
  it('parses a catalog file and proposes add/link without Group YAML', () => {
    const catalog = `
teams:
  - id: team_storefront
    displayName: Storefront experience
    role: stream_aligned
    system: backstage
    externalId: group:default/storefront
  - id: team_new
    displayName: New stream
    role: stream_aligned
    system: github
    externalId: org/new-stream
`;
    const parsedCatalog = parseCatalogFile(catalog);
    expect(parsedCatalog.ok).toBe(true);
    if (!parsedCatalog.ok) return;

    const doc = parseSteerSpecYaml(baseYaml);
    expect(doc.ok).toBe(true);
    if (!doc.ok) return;

    const plan = proposeTeamCatalogMerge(doc.value, parsedCatalog.teams);
    expect(plan.proposesGroupYaml).toBe(false);
    expect(plan.banner).toMatch(/never creates directory groups/i);
    expect(plan.rows.map((row) => row.action)).toEqual(['link', 'add']);

    const applied = applyTeamCatalogMerge(doc.value, plan);
    expect(applied.spec.teams).toHaveLength(2);
    const storefront = applied.spec.teams.find((team) => team.id === 'team_storefront');
    expect(storefront?.externalRefs).toEqual([
      { system: 'backstage', id: 'group:default/storefront' },
    ]);
    expect(storefront?.provenance).toBe('catalog_file');
    expect(applied.spec.teams.find((team) => team.id === 'team_new')?.provenance).toBe(
      'catalog_file',
    );
  });

  it('rejects malformed catalogs', () => {
    const result = parseCatalogFile('not: useful');
    expect(result.ok).toBe(false);
  });
});
