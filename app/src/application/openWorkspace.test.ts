import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from './openWorkspace';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('openWorkspaceFromYaml', () => {
  it('opens the sample SteerSpec', () => {
    const result = openWorkspaceFromYaml(sampleYaml);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.metadata.name).toBe('northwind-q3-alignment');
    expect(result.value.spec.bets).toHaveLength(3);
  });

  it('returns plain-language error for invalid YAML without a value', () => {
    const result = openWorkspaceFromYaml('not: [unterminated');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/does not look like valid YAML/i);
  });

  it('returns plain-language error for unsupported apiVersion', () => {
    const result = openWorkspaceFromYaml(`
apiVersion: steerlens.dev/v9
kind: SteerTree
metadata:
  name: x
spec:
  vision: v
  outcomes: []
  bets: []
  teams: []
`);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not supported/i);
  });
});
