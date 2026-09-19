import { describe, expect, it } from 'vitest';
import { isAtLeast, lockfilePackageVersions, readAppLockfile } from './lockfileVersions';

const PATCHED_JS_YAML_V3 = '3.15.2';
const PATCHED_JS_YAML_V4 = '4.3.2';

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
  const lockfile = readAppLockfile();

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
