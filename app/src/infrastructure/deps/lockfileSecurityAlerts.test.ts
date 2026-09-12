import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PATCHED_JS_YAML_V3 = '3.15.2';
const PATCHED_JS_YAML_V4 = '4.3.2';

function lockfilePackageVersions(lockfile: string, packageName: string): string[] {
  const pattern = new RegExp(`^ {2}${packageName.replace('/', '\\/')}@([^:]+):$`, 'gm');
  return [
    ...new Set(
      [...lockfile.matchAll(pattern)].map((match) => (match[1] ?? '').replace(/\(.*\)$/, '')),
    ),
  ];
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

function jsYamlIsPatched(version: string): boolean {
  const major = Number(version.split('.')[0] ?? 0);
  if (major <= 3) {
    return isAtLeast(version, PATCHED_JS_YAML_V3);
  }
  if (major === 4) {
    return isAtLeast(version, PATCHED_JS_YAML_V4);
  }
  return true;
}

describe('pnpm lockfile Dependabot security pins', () => {
  const lockfile = readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../pnpm-lock.yaml'),
    'utf8',
  );

  it('resolves js-yaml to a release that counts empty merge sources', () => {
    const versions = lockfilePackageVersions(lockfile, 'js-yaml');

    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every(jsYamlIsPatched)).toBe(true);
  });

  it('drops extract-zip so symlink archive writes cannot land', () => {
    expect(lockfilePackageVersions(lockfile, 'extract-zip')).toEqual([]);
  });

  it('resolves qs past the Express query-string DoS releases', () => {
    const versions = lockfilePackageVersions(lockfile, 'qs');

    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((version) => isAtLeast(version, '6.16.0'))).toBe(true);
  });
});
