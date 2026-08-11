import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openWorkspaceFromYaml } from '../application/openWorkspace';
import { saveSteerSpecToPersistence } from './steerSpecPersistence';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../packages/core/fixtures',
);
const sampleYaml = readFileSync(path.join(fixtureDir, 'steertree.sample.yaml'), 'utf8');

describe('saveSteerSpecToPersistence', () => {
  it('writes yaml into a directory persistence target', async () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const writeDirectoryFile = vi.fn(
      async (_directory: FileSystemDirectoryHandle, _fileName: string, _contents: string) =>
        undefined,
    );
    const result = await saveSteerSpecToPersistence(
      opened.value,
      {
        mode: 'directory',
        directory: {} as FileSystemDirectoryHandle,
        fileName: 'steertree.yaml',
      },
      { writeDirectoryFile },
    );

    expect(result).toEqual({ ok: true, method: 'directory', fileName: 'steertree.yaml' });
    expect(writeDirectoryFile).toHaveBeenCalledOnce();
    const yaml = writeDirectoryFile.mock.calls[0]?.[2];
    expect(yaml).toMatch(/apiVersion:\s*steerco\.dev\/v1alpha1/);
    expect(yaml).toMatch(/kind:\s*SteerTree/);
  });

  it('falls back to download for sample workspaces', async () => {
    const opened = openWorkspaceFromYaml(sampleYaml);
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;

    const triggerDownload = vi.fn();
    const result = await saveSteerSpecToPersistence(
      opened.value,
      { mode: 'download' },
      { triggerDownload, downloadFileName: 'steertree.yaml' },
    );

    expect(result).toEqual({ ok: true, method: 'download', fileName: 'steertree.yaml' });
    expect(triggerDownload).toHaveBeenCalledOnce();
  });

  it('blocks invalid specs from writing', async () => {
    const writeDirectoryFile = vi.fn(async () => undefined);
    const result = await saveSteerSpecToPersistence(
      { apiVersion: 'nope' } as never,
      {
        mode: 'directory',
        directory: {} as FileSystemDirectoryHandle,
        fileName: 'steertree.yaml',
      },
      { writeDirectoryFile },
    );
    expect(result.ok).toBe(false);
    expect(writeDirectoryFile).not.toHaveBeenCalled();
  });
});
