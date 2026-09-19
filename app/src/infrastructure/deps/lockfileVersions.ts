import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function readAppLockfile(): string {
  return readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../pnpm-lock.yaml'),
    'utf8',
  );
}

export function lockfilePackageVersions(lockfile: string, packageName: string): string[] {
  const pattern = new RegExp(`^ {2}${packageName.replace('/', '\\/')}@([^:]+):$`, 'gm');
  return [
    ...new Set(
      [...lockfile.matchAll(pattern)].map((match) => (match[1] ?? '').replace(/\(.*\)$/, '')),
    ),
  ];
}

export function isAtLeast(version: string, minimum: string): boolean {
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
