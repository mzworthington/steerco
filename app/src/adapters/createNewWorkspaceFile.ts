import { serializeSteerSpec, type SteerSpec } from '@steerco/core';
import { createBlankSteerSpec, BLANK_WORKSPACE_LABEL } from '../application/createBlankWorkspace';
import {
  saveSteerSpecToPersistence,
  writeDirectoryFile,
  type WorkspacePersistence,
} from './steerSpecPersistence';

const FILE_NAME = 'steertree.yaml' as const;

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<FileSystemDirectoryHandle>;
  };

export type CreateNewWorkspaceFileResult =
  | {
      ok: true;
      value: SteerSpec;
      label: string;
      persistence: WorkspacePersistence;
      method: 'directory' | 'download';
    }
  | { ok: false; error: string; cancelled?: boolean };

/**
 * Create a new steertree.yaml - prefer writing into a chosen folder,
 * otherwise download a blank file and open it as a download-backed session.
 */
export async function createNewWorkspaceFile(options?: {
  createBlank?: typeof createBlankSteerSpec;
  pickDirectory?: () => Promise<FileSystemDirectoryHandle>;
  writeFile?: typeof writeDirectoryFile;
  save?: typeof saveSteerSpecToPersistence;
}): Promise<CreateNewWorkspaceFileResult> {
  const createBlank = options?.createBlank ?? createBlankSteerSpec;
  const blank = createBlank();
  const win = window as DirectoryPickerWindow;

  if (typeof win.showDirectoryPicker === 'function' || options?.pickDirectory) {
    const pickDirectory =
      options?.pickDirectory ?? (() => win.showDirectoryPicker!({ mode: 'readwrite' as const }));
    try {
      const directory = await pickDirectory();
      if (await directoryHasSteerSpec(directory)) {
        return {
          ok: false,
          error: `“${directory.name}” already has a steertree.yaml. Choose Open folder, or pick an empty folder.`,
        };
      }
      const write = options?.writeFile ?? writeDirectoryFile;
      await write(directory, FILE_NAME, serializeSteerSpec(blank));
      return {
        ok: true,
        value: blank,
        label: directory.name,
        method: 'directory',
        persistence: { mode: 'directory', directory, fileName: FILE_NAME },
      };
    } catch (error) {
      if (isAbortError(error)) {
        return { ok: false, error: 'Cancelled', cancelled: true };
      }
      return {
        ok: false,
        error: 'Could not create steertree.yaml in that folder. Check permissions and try again.',
      };
    }
  }

  const save = options?.save ?? saveSteerSpecToPersistence;
  const saved = await save(blank, { mode: 'download' }, { downloadFileName: FILE_NAME });
  if (!saved.ok) {
    return { ok: false, error: saved.error };
  }
  return {
    ok: true,
    value: blank,
    label: BLANK_WORKSPACE_LABEL,
    method: 'download',
    persistence: { mode: 'download' },
  };
}

async function directoryHasSteerSpec(directory: FileSystemDirectoryHandle): Promise<boolean> {
  for (const name of ['steertree.yaml', 'steertree.yml'] as const) {
    try {
      await directory.getFileHandle(name);
      return true;
    } catch {}
  }
  return false;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  );
}
