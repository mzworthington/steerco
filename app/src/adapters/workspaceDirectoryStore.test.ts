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
    queryPermission: vi.fn(async () => 'granted'),
    requestPermission: vi.fn(async () => 'granted'),
  } as unknown as FileSystemDirectoryHandle;
}

beforeEach(async () => {
  await clearAllWorkspaceDirectoryBindings();
});

describe('workspaceDirectoryStore', () => {
  it('builds a stable key from source and metadata name', () => {
    expect(workspaceDirectoryKey('folder', 'northwind-q3-alignment')).toBe(
      'folder:northwind-q3-alignment',
    );
  });

  it('round-trips a directory handle binding', async () => {
    const directory = fakeDirectory('northwind');
    await saveWorkspaceDirectoryBinding({
      workspaceKey: 'folder:northwind-q3-alignment',
      fileName: 'steertree.yaml',
      directory,
    });

    const loaded = await loadWorkspaceDirectoryBinding('folder:northwind-q3-alignment');
    expect(loaded?.fileName).toBe('steertree.yaml');
    expect(loaded?.directoryName).toBe('northwind');
    expect(loaded?.directory).toBe(directory);
  });

  it('clears a single binding', async () => {
    const directory = fakeDirectory('northwind');
    await saveWorkspaceDirectoryBinding({
      workspaceKey: 'folder:northwind-q3-alignment',
      fileName: 'steertree.yaml',
      directory,
    });
    await clearWorkspaceDirectoryBinding('folder:northwind-q3-alignment');
    expect(await loadWorkspaceDirectoryBinding('folder:northwind-q3-alignment')).toBeNull();
  });

  it('treats granted queryPermission as ready', async () => {
    const directory = fakeDirectory('northwind');
    await expect(ensureDirectoryWritePermission(directory)).resolves.toBe(true);
  });
});
