import { describe, expect, it } from 'vitest';
import { isAtLeast, lockfilePackageVersions, readAppLockfile } from './lockfileVersions';

const PATCHED_SHARP = '0.35.4';

describe('pnpm lockfile sharp', () => {
  it('resolves sharp to a release that includes the libheif 1.23.2 fix', () => {
    const versions = lockfilePackageVersions(readAppLockfile(), 'sharp');

    expect(versions.length).toBeGreaterThan(0);
    expect(versions.every((version) => isAtLeast(version, PATCHED_SHARP))).toBe(true);
  });
});
