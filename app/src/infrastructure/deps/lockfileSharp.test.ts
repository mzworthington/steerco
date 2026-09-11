import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PATCHED_SHARP = '0.35.4';

function lockfileSharpVersions(lockfile: string): string[] {
  return [...lockfile.matchAll(/^ {2}sharp@([^:]+):$/gm)].map((match) => match[1]);
}

function isAtLeast(version: string, minimum: string): boolean {
  const actual = version.split('.').map(Number);
  const required = minimum.split('.').map(Number);
  for (let index = 0; index < required.length; index += 1) {
    const left = actual[index] ?? 0;
    const right = required[index] ?? 0;
    if (left > right) {
      return true;
    }
    if (left < right) {
      return false;
    }
  }
  return true;
}

describe('pnpm lockfile sharp', () => {
  it('resolves sharp to a release that includes the libheif 1.23.2 fix', () => {
    const lockfile = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../pnpm-lock.yaml'),
      'utf8',
    );
    const versions = lockfileSharpVersions(lockfile);

    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((version) => isAtLeast(version, PATCHED_SHARP))).toBe(true);
  });
});
