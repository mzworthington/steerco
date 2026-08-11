import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSteerSpecYaml } from './checkSteerSpec';

const fixture = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../fixtures/steertree.sample.yaml',
);

describe('checkSteerSpecYaml (CI gate)', () => {
  it('accepts the sample fixture without error-severity mismatches', () => {
    const raw = readFileSync(fixture, 'utf8');
    const result = checkSteerSpecYaml(raw);
    expect(result.parseError).toBeNull();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('fails closed on invalid YAML', () => {
    const result = checkSteerSpecYaml('not: a: steerspec');
    expect(result.ok).toBe(false);
    expect(result.parseError).toBeTruthy();
  });
});
