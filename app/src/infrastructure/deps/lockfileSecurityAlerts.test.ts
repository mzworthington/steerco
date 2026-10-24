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

  it('resolves the October 2026 transitive advisories', () => {
    const pinned = [
      ['undici', '7.30.1'],
      ['dompurify', '3.4.17'],
      ['fast-uri', '4.2.3'],
      ['serialize-javascript', '7.1.3'],
      ['ip-address', '10.7.4'],
      ['body-parser', '1.20.9'],
      ['zod', '4.6.6'],
    ] as const;

    for (const [name, minimum] of pinned) {
      const sameMajor = lockfilePackageVersions(lockfile, name).filter(
        (version) => version.split('.')[0] === minimum.split('.')[0],
      );

      expect(sameMajor.length, name).toBeGreaterThan(0);
      expect(
        sameMajor.every((version) => isAtLeast(version, minimum)),
        `${name} resolved ${sameMajor.join(', ')}`,
      ).toBe(true);
    }

    expect(
      lockfilePackageVersions(lockfile, 'zod').every((version) => isAtLeast(version, '4.6.6')),
      'zod 3 stays inside GHSA-mrhx-c7xc-m3w5 (< 4.6.6)',
    ).toBe(true);
  });
});
