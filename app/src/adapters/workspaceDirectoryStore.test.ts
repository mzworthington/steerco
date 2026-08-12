import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllWorkspaceDirectoryBindings,
  clearWorkspaceDirectoryBinding,
  ensureDirectoryWritePermission,
  loadWorkspaceDirectoryBinding,
  saveWorkspaceDirectoryBinding,
  workspaceDirectoryKey,
} from './workspaceDirectoryStore';

function fakeDirectory(name: string): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name,
  } as unknown as FileSystemDirectoryHandle;
}

function fakeDirectoryWithPermission(
  name: string,
  state: PermissionState = 'granted',
): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name,
    queryPermission: vi.fn(async () => state),
    requestPermission: vi.fn(async () => state),
  } as unknown as FileSystemDirectoryHandle;
}

beforeEach(async () => {
  await clearAllWorkspaceDirectoryBindings();
});

describe('workspaceDirectoryStore', () => {
  it('builds a stable key from source and metadata name', () => {
    expect(workspaceDirectoryKey('folder', 'northwind-group-h2-alignment')).toBe(
      'folder:northwind-group-h2-alignment',
    );
  });

  it('round-trips a directory handle binding', async () => {
    const directory = fakeDirectory('northwind');
    await saveWorkspaceDirectoryBinding({
      workspaceKey: 'folder:northwind-group-h2-alignment',
      fileName: 'steertree.yaml',
      directory,
    });

    const loaded = await loadWorkspaceDirectoryBinding('folder:northwind-group-h2-alignment');
    expect(loaded?.fileName).toBe('steertree.yaml');
    expect(loaded?.directoryName).toBe('northwind');
    expect(loaded?.directory.name).toBe('northwind');
  });

  it('clears a single binding', async () => {
    const directory = fakeDirectory('northwind');
    await saveWorkspaceDirectoryBinding({
      workspaceKey: 'folder:northwind-group-h2-alignment',
      fileName: 'steertree.yaml',
      directory,
    });
    await clearWorkspaceDirectoryBinding('folder:northwind-group-h2-alignment');
    expect(await loadWorkspaceDirectoryBinding('folder:northwind-group-h2-alignment')).toBeNull();
  });

  it('treats granted queryPermission as ready', async () => {
    const directory = fakeDirectoryWithPermission('northwind', 'granted');
    await expect(ensureDirectoryWritePermission(directory)).resolves.toBe(true);
  });
});
