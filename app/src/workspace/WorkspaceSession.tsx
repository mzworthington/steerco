import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { steerSpecHasPendingChanges, steerSpecSchema, type SteerSpec } from '@steerco/core';
import {
  saveSteerSpecToPersistence,
  type SaveSteerSpecResult,
  type WorkspacePersistence,
} from '../adapters/steerSpecPersistence';
import {
  ensureDirectoryWritePermission,
  loadWorkspaceDirectoryBinding,
  saveWorkspaceDirectoryBinding,
  workspaceDirectoryKey,
  type SteerSpecFileName,
} from '../adapters/workspaceDirectoryStore';

export type WorkspaceSource = 'sample' | 'folder' | 'file';

export type WorkspaceSessionState = {
  /** Editable working copy. */
  spec: SteerSpec;
  /** Last opened / accepted baseline (ArchLens-style draft vs committed). */
  baselineSpec: SteerSpec;
  source: WorkspaceSource;
  label: string;
};

type WorkspaceSessionContextValue = {
  session: WorkspaceSessionState | null;
  hasPendingChanges: boolean;
  /** Folder write target when File System Access handle is available (memory or IndexedDB). */
  persistence: WorkspacePersistence;
  canWriteToFolder: boolean;
  setSession: (session: WorkspaceSessionState) => void;
  /** Open or replace workspace; seeds baseline = working. */
  openSession: (input: {
    spec: SteerSpec;
    source: WorkspaceSource;
    label: string;
    persistence?: WorkspacePersistence;
  }) => void;
  /** Promote working copy to the new baseline (session only). */
  acceptDraft: () => void;
  /** Restore working copy from baseline. */
  revertDraft: () => void;
  /** Validate, write/download SteerSpec, then promote baseline. */
  saveWorkspace: () => Promise<SaveSteerSpecResult>;
  clearSession: () => void;
};

const WorkspaceSessionContext = createContext<WorkspaceSessionContextValue | null>(null);

const SESSION_STORAGE_KEY = 'steerco.workspace-session';

function cloneSpec(spec: SteerSpec): SteerSpec {
  return structuredClone(spec);
}

function normalizeSession(input: {
  spec: SteerSpec;
  baselineSpec?: SteerSpec;
  source: WorkspaceSource;
  label: string;
}): WorkspaceSessionState | null {
  const working = steerSpecSchema.safeParse(input.spec);
  if (!working.success) return null;
  const baselineRaw = input.baselineSpec ?? input.spec;
  const baseline = steerSpecSchema.safeParse(baselineRaw);
  if (!baseline.success) return null;
  return {
    spec: working.data,
    baselineSpec: baseline.data,
    source: input.source,
    label: input.label,
  };
}

function readStoredSession(): WorkspaceSessionState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (
      typeof record.label !== 'string' ||
      (record.source !== 'sample' && record.source !== 'folder' && record.source !== 'file') ||
      !record.spec ||
      typeof record.spec !== 'object'
    ) {
      return null;
    }
    const normalized = normalizeSession({
      label: record.label,
      source: record.source,
      spec: record.spec as SteerSpec,
      baselineSpec:
        record.baselineSpec && typeof record.baselineSpec === 'object'
          ? (record.baselineSpec as SteerSpec)
          : undefined,
    });
    if (!normalized) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return normalized;
  } catch {
    return null;
  }
}

function persistSession(session: WorkspaceSessionState | null): void {
  if (!session) {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function defaultPersistenceForSource(_source: WorkspaceSource): WorkspacePersistence {
  return { mode: 'download' };
}

function isSteerSpecFileName(value: string): value is SteerSpecFileName {
  return value === 'steertree.yaml' || value === 'steertree.yml';
}

async function rememberDirectoryPersistence(
  session: WorkspaceSessionState,
  persistence: WorkspacePersistence,
): Promise<void> {
  if (persistence.mode !== 'directory') return;
  const key = workspaceDirectoryKey(session.source, session.spec.metadata.name);
  await saveWorkspaceDirectoryBinding({
    workspaceKey: key,
    fileName: persistence.fileName,
    directory: persistence.directory,
  });
}

export function WorkspaceSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<WorkspaceSessionState | null>(() =>
    typeof sessionStorage === 'undefined' ? null : readStoredSession(),
  );
  const [persistence, setPersistence] = useState<WorkspacePersistence>({ mode: 'download' });

  useEffect(() => {
    let cancelled = false;

    async function restoreDirectoryHandle() {
      if (!session || session.source === 'sample') return;
      if (persistence.mode === 'directory') return;

      const key = workspaceDirectoryKey(session.source, session.spec.metadata.name);
      try {
        const binding = await loadWorkspaceDirectoryBinding(key);
        if (!binding || cancelled) return;
        const allowed = await ensureDirectoryWritePermission(binding.directory);
        if (!allowed || cancelled) return;
        if (!isSteerSpecFileName(binding.fileName)) return;
        setPersistence({
          mode: 'directory',
          directory: binding.directory,
          fileName: binding.fileName,
        });
      } catch {
        // Leave download fallback if IndexedDB / permission restore fails.
      }
    }

    void restoreDirectoryHandle();
    return () => {
      cancelled = true;
    };
  }, [session, persistence.mode]);

  const setSession = useCallback((next: WorkspaceSessionState) => {
    const normalized = normalizeSession(next);
    if (!normalized) return;
    setSessionState(normalized);
    persistSession(normalized);
  }, []);

  const openSession = useCallback(
    (input: {
      spec: SteerSpec;
      source: WorkspaceSource;
      label: string;
      persistence?: WorkspacePersistence;
    }) => {
      const normalized = normalizeSession({
        ...input,
        baselineSpec: cloneSpec(input.spec),
        spec: cloneSpec(input.spec),
      });
      if (!normalized) return;
      const nextPersistence = input.persistence ?? defaultPersistenceForSource(input.source);
      setSessionState(normalized);
      persistSession(normalized);
      setPersistence(nextPersistence);
      void rememberDirectoryPersistence(normalized, nextPersistence).catch(() => {
        // Non-fatal: session still works; Save may fall back to download.
      });
    },
    [],
  );

  const acceptDraft = useCallback(() => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next: WorkspaceSessionState = {
        ...prev,
        baselineSpec: cloneSpec(prev.spec),
      };
      persistSession(next);
      return next;
    });
  }, []);

  const revertDraft = useCallback(() => {
    setSessionState((prev) => {
      if (!prev) return prev;
      const next: WorkspaceSessionState = {
        ...prev,
        spec: cloneSpec(prev.baselineSpec),
      };
      persistSession(next);
      return next;
    });
  }, []);

  const saveWorkspace = useCallback(async (): Promise<SaveSteerSpecResult> => {
    if (!session) {
      return { ok: false, error: 'Open a workspace before saving.' };
    }

    let activePersistence = persistence;
    if (activePersistence.mode !== 'directory' && session.source !== 'sample') {
      const key = workspaceDirectoryKey(session.source, session.spec.metadata.name);
      try {
        const binding = await loadWorkspaceDirectoryBinding(key);
        if (binding && (await ensureDirectoryWritePermission(binding.directory))) {
          activePersistence = {
            mode: 'directory',
            directory: binding.directory,
            fileName: binding.fileName,
          };
          setPersistence(activePersistence);
        }
      } catch {
        // fall through to download
      }
    }

    const result = await saveSteerSpecToPersistence(session.spec, activePersistence, {
      downloadFileName: `${session.spec.metadata.name || 'steertree'}.yaml`,
    });
    if (!result.ok) return result;
    const next: WorkspaceSessionState = {
      ...session,
      baselineSpec: cloneSpec(session.spec),
    };
    setSessionState(next);
    persistSession(next);
    return result;
  }, [session, persistence]);

  const clearSession = useCallback(() => {
    setSessionState(null);
    persistSession(null);
    setPersistence({ mode: 'download' });
  }, []);

  const hasPendingChanges = session
    ? steerSpecHasPendingChanges(session.baselineSpec, session.spec)
    : false;

  const value = useMemo(
    () => ({
      session,
      hasPendingChanges,
      persistence,
      canWriteToFolder: persistence.mode === 'directory',
      setSession,
      openSession,
      acceptDraft,
      revertDraft,
      saveWorkspace,
      clearSession,
    }),
    [
      session,
      hasPendingChanges,
      persistence,
      setSession,
      openSession,
      acceptDraft,
      revertDraft,
      saveWorkspace,
      clearSession,
    ],
  );

  return (
    <WorkspaceSessionContext.Provider value={value}>{children}</WorkspaceSessionContext.Provider>
  );
}

export function useWorkspaceSession(): WorkspaceSessionContextValue {
  const ctx = useContext(WorkspaceSessionContext);
  if (!ctx) {
    throw new Error('useWorkspaceSession must be used within WorkspaceSessionProvider');
  }
  return ctx;
}

/** Test helper: session with matching baseline + working. */
export function sessionWithBaseline(
  spec: SteerSpec,
  source: WorkspaceSource,
  label: string,
): WorkspaceSessionState {
  return {
    spec: cloneSpec(spec),
    baselineSpec: cloneSpec(spec),
    source,
    label,
  };
}
