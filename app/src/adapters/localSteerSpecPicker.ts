import { openWorkspaceFromYaml, type OpenWorkspaceResult } from '../application/openWorkspace';

const STEERSPEC_NAMES = new Set(['steertree.yaml', 'steertree.yml']);

type LocalSteerSpecPick =
  { ok: true; text: string; label: string } | { ok: false; error: string; cancelled?: boolean };

type DirectoryPickerWindow = Window &
  typeof globalThis & {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  };

/**
 * Open a local SteerSpec via File System Access (directory) when available,
 * otherwise fall back to a single-file picker.
 */
async function pickLocalSteerSpec(options?: {
  pickFileText?: () => Promise<LocalSteerSpecPick>;
}): Promise<LocalSteerSpecPick> {
  const win = window as DirectoryPickerWindow;
  if (typeof win.showDirectoryPicker === 'function') {
    try {
      const directory = await win.showDirectoryPicker();
      return await readSteerSpecFromDirectory(directory);
    } catch (error) {
      if (isAbortError(error)) {
        return { ok: false, error: 'Cancelled', cancelled: true };
      }
      return {
        ok: false,
        error: 'Could not open that folder. Try again or choose a steertree.yaml file.',
      };
    }
  }

  const pickFileText = options?.pickFileText ?? pickSteerSpecFileText;
  return pickFileText();
}

export async function openWorkspaceFromLocalPick(): Promise<
  OpenWorkspaceResult & { label?: string; cancelled?: boolean }
> {
  const picked = await pickLocalSteerSpec();
  if (!picked.ok) {
    return {
      ok: false,
      error: picked.error,
      cancelled: picked.cancelled,
    };
  }
  const opened = openWorkspaceFromYaml(picked.text);
  if (!opened.ok) return opened;
  return { ok: true, value: opened.value, label: picked.label };
}

async function readSteerSpecFromDirectory(
  directory: FileSystemDirectoryHandle,
): Promise<LocalSteerSpecPick> {
  for (const name of STEERSPEC_NAMES) {
    try {
      const handle = await directory.getFileHandle(name);
      const file = await handle.getFile();
      const text = await file.text();
      return { ok: true, text, label: directory.name };
    } catch {
      // try next name
    }
  }
  return {
    ok: false,
    error: `No steertree.yaml found in “${directory.name}”. Add one and try again.`,
  };
}

function pickSteerSpecFileText(): Promise<LocalSteerSpecPick> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml,text/yaml,application/x-yaml';
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) {
        resolve({ ok: false, error: 'Cancelled', cancelled: true });
        return;
      }
      void file.text().then(
        (text) => resolve({ ok: true, text, label: file.name }),
        () =>
          resolve({
            ok: false,
            error: 'Could not read that file. Check permissions and try again.',
          }),
      );
    });

    input.addEventListener('cancel', () => {
      cleanup();
      resolve({ ok: false, error: 'Cancelled', cancelled: true });
    });

    input.click();
  });
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  );
}
