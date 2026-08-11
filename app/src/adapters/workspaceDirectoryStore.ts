const DB_NAME = 'steerco-workspace';
const DB_VERSION = 1;
const STORE_NAME = 'directory-bindings';

export type SteerSpecFileName = 'steertree.yaml' | 'steertree.yml';

export type WorkspaceDirectoryBinding = {
  workspaceKey: string;
  fileName: SteerSpecFileName;
  directoryName: string;
  directory: FileSystemDirectoryHandle;
  updatedAt: string;
};

type StoredDirectoryRecord = {
  workspaceKey: string;
  fileName: SteerSpecFileName;
  directoryName: string;
  directory: FileSystemDirectoryHandle;
  updatedAt: string;
};

export function workspaceDirectoryKey(
  source: 'sample' | 'folder' | 'file',
  metadataName: string,
): string {
  return `${source}:${metadataName}`;
}

export async function saveWorkspaceDirectoryBinding(input: {
  workspaceKey: string;
  fileName: SteerSpecFileName;
  directory: FileSystemDirectoryHandle;
}): Promise<void> {
  const db = await openDb();
  try {
    const record: StoredDirectoryRecord = {
      workspaceKey: input.workspaceKey,
      fileName: input.fileName,
      directoryName: input.directory.name,
      directory: input.directory,
      updatedAt: new Date().toISOString(),
    };
    await idbRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record));
  } finally {
    db.close();
  }
}

export async function loadWorkspaceDirectoryBinding(
  workspaceKey: string,
): Promise<WorkspaceDirectoryBinding | null> {
  const db = await openDb();
  try {
    const record = await idbRequest<StoredDirectoryRecord | undefined>(
      db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(workspaceKey),
    );
    if (!record?.directory || !record.fileName) return null;
    return {
      workspaceKey: record.workspaceKey,
      fileName: record.fileName,
      directoryName: record.directoryName || record.directory.name,
      directory: record.directory,
      updatedAt: record.updatedAt,
    };
  } finally {
    db.close();
  }
}

export async function clearWorkspaceDirectoryBinding(workspaceKey: string): Promise<void> {
  const db = await openDb();
  try {
    await idbRequest(
      db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(workspaceKey),
    );
  } finally {
    db.close();
  }
}

export async function clearAllWorkspaceDirectoryBindings(): Promise<void> {
  const db = await openDb();
  try {
    await idbRequest(db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear());
  } finally {
    db.close();
  }
}

export async function ensureDirectoryWritePermission(
  directory: FileSystemDirectoryHandle,
): Promise<boolean> {
  const handle = directory as FileSystemDirectoryHandle & {
    queryPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
    requestPermission?: (descriptor?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>;
  };

  if (typeof handle.queryPermission === 'function') {
    const current = await handle.queryPermission({ mode: 'readwrite' });
    if (current === 'granted') return true;
  }
  if (typeof handle.requestPermission === 'function') {
    const next = await handle.requestPermission({ mode: 'readwrite' });
    return next === 'granted';
  }
  // Environments without the permission API (tests / older browsers): assume usable.
  return true;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'workspaceKey' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}
