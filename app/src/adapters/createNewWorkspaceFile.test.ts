import { describe, expect, it, vi } from 'vitest';
import { createNewWorkspaceFile } from './createNewWorkspaceFile';
import { createBlankSteerSpec } from '../application/createBlankWorkspace';

describe('createNewWorkspaceFile', () => {
  it('writes steertree.yaml into a chosen empty folder', async () => {
    const writeFile = vi.fn(async () => undefined);
    const directory = {
      name: 'my-programme',
      getFileHandle: vi.fn(async () => {
        throw new DOMException('NotFoundError');
      }),
    } as unknown as FileSystemDirectoryHandle;

    const result = await createNewWorkspaceFile({
      createBlank: createBlankSteerSpec,
      pickDirectory: async () => directory,
      writeFile,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe('directory');
    expect(result.label).toBe('my-programme');
    expect(result.persistence.mode).toBe('directory');
    expect(writeFile).toHaveBeenCalledWith(
      directory,
      'steertree.yaml',
      expect.stringContaining('kind: SteerTree'),
    );
  });

  it('refuses to overwrite an existing steertree.yaml', async () => {
    const directory = {
      name: 'existing',
      getFileHandle: vi.fn(async () => ({})),
    } as unknown as FileSystemDirectoryHandle;

    const result = await createNewWorkspaceFile({
      pickDirectory: async () => directory,
      writeFile: vi.fn(),
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already has a steertree\.yaml/i);
  });

  it('downloads a blank file when directory picking is unavailable', async () => {
    const save = vi.fn(async () => ({
      ok: true as const,
      method: 'download' as const,
      fileName: 'steertree.yaml',
    }));
    const result = await createNewWorkspaceFile({
      pickDirectory: undefined,
      save,
    });

    // Without injecting pickDirectory and without showDirectoryPicker, falls through to download.
    // In jsdom there is no showDirectoryPicker - so this path should run.
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe('download');
    expect(save).toHaveBeenCalled();
  });
});
