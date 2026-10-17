import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(import.meta.dirname, '../../..');
const hook = readFileSync(resolve(repoRoot, '.husky/pre-commit'), 'utf8');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'app/package.json'), 'utf8')) as {
  'lint-staged': Record<string, string[]>;
};

describe('local format gate covers GitHub config CI already checks', () => {
  it('runs pre-commit checks for .github yaml and formats those files with lint-staged', () => {
    expect(hook).toMatch(/\.github\//);
    expect(hook).toMatch(/yml\|yaml/);
    expect(Object.keys(pkg['lint-staged'])).toContain('../.github/**/*.{yml,yaml,md}');
  });
});
