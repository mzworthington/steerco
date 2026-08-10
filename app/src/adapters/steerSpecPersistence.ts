import { serializeSteerSpec, steerSpecSchema, type SteerSpec } from '@steerlens/core';

export type WorkspaceDirectoryPersistence = {
  mode: 'directory';
  directory: FileSystemDirectoryHandle;
  fileName: 'steertree.yaml' | 'steertree.yml';
};

export type WorkspaceDownloadPersistence = {
  mode: 'download';
};

export type WorkspacePersistence = WorkspaceDirectoryPersistence | WorkspaceDownloadPersistence;

export type SaveSteerSpecResult =
  { ok: true; method: 'directory' | 'download'; fileName: string } | { ok: false; error: string };

export async function saveSteerSpecToPersistence(
  spec: SteerSpec,
  persistence: WorkspacePersistence,
  options?: {
    downloadFileName?: string;
    writeDirectoryFile?: typeof writeDirectoryFile;
    triggerDownload?: typeof triggerYamlDownload;
  },
): Promise<SaveSteerSpecResult> {
  const validated = steerSpecSchema.safeParse(spec);
  if (!validated.success) {
    return {
      ok: false,
      error: 'This workspace is not valid SteerSpec — fix errors before saving.',
    };
  }

  const yaml = serializeSteerSpec(validated.data);

  if (persistence.mode === 'directory') {
    const write = options?.writeDirectoryFile ?? writeDirectoryFile;
    try {
      await write(persistence.directory, persistence.fileName, yaml);
      return { ok: true, method: 'directory', fileName: persistence.fileName };
    } catch {
      return {
        ok: false,
        error: `Could not write ${persistence.fileName}. Check folder permissions and try again.`,
      };
    }
  }

  const fileName = options?.downloadFileName ?? 'steertree.yaml';
  const download = options?.triggerDownload ?? triggerYamlDownload;
  download(yaml, fileName);
  return { ok: true, method: 'download', fileName };
}

export async function writeDirectoryFile(
  directory: FileSystemDirectoryHandle,
  fileName: string,
  contents: string,
): Promise<void> {
  const handle = await directory.getFileHandle(fileName, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(contents);
    await writable.close();
  } catch (error) {
    try {
      await writable.abort();
    } catch {
      // ignore abort failures
    }
    throw error;
  }
}

export function triggerYamlDownload(contents: string, fileName: string): void {
  const blob = new Blob([contents], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
