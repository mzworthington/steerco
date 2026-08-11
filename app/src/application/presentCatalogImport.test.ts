import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';
import { applyCatalogImportPlan, presentCatalogImportPreview } from './presentCatalogImport';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');
const catalogYaml = readFileSync(path.join(fixtureDir, 'catalog.sample.yaml'), 'utf8');

describe('presentCatalogImport', () => {
  it('previews merge without proposing Group YAML and applies refs', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const previewed = presentCatalogImportPreview(opened.value, catalogYaml, 'catalog.sample.yaml');
    expect(previewed.ok).toBe(true);
    if (!previewed.ok) return;

    expect(previewed.preview.proposesGroupYaml).toBe(false);
    expect(previewed.preview.banner).toMatch(/never creates directory groups/i);
    expect(previewed.preview.applyCount).toBeGreaterThan(0);
    expect(previewed.preview.rows.some((row) => row.action === 'add')).toBe(true);

    const applied = applyCatalogImportPlan(opened.value, previewed.plan);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    expect(applied.value.spec.teams.some((team) => team.id === 'team_new_platform')).toBe(true);
    const storefront = applied.value.spec.teams.find((team) => team.id === 'team_storefront');
    expect(storefront?.externalRefs.some((ref) => ref.id === 'group:default/storefront')).toBe(
      true,
    );
  });

  it('rejects invalid catalog text', () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const previewed = presentCatalogImportPreview(opened.value, 'not: valid: catalog');
    expect(previewed.ok).toBe(false);
  });
});
