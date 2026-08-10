import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { steerSpecHasPendingChanges, steerSpecSchema, type SteerSpec } from '@steerlens/core';

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
  setSession: (session: WorkspaceSessionState) => void;
  /** Open or replace workspace; seeds baseline = working. */
  openSession: (input: { spec: SteerSpec; source: WorkspaceSource; label: string }) => void;
  /** Promote working copy to the new baseline (session accept; disk write = F09). */
  acceptDraft: () => void;
  /** Restore working copy from baseline. */
  revertDraft: () => void;
  clearSession: () => void;
};

const WorkspaceSessionContext = createContext<WorkspaceSessionContextValue | null>(null);

const SESSION_STORAGE_KEY = 'steerlens.workspace-session';

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

export function WorkspaceSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<WorkspaceSessionState | null>(() =>
    typeof sessionStorage === 'undefined' ? null : readStoredSession(),
  );

  const setSession = useCallback((next: WorkspaceSessionState) => {
    const normalized = normalizeSession(next);
    if (!normalized) return;
    setSessionState(normalized);
    persistSession(normalized);
  }, []);

  const openSession = useCallback(
    (input: { spec: SteerSpec; source: WorkspaceSource; label: string }) => {
      const normalized = normalizeSession({
        ...input,
        baselineSpec: cloneSpec(input.spec),
        spec: cloneSpec(input.spec),
      });
      if (!normalized) return;
      setSessionState(normalized);
      persistSession(normalized);
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

  const clearSession = useCallback(() => {
    setSessionState(null);
    persistSession(null);
  }, []);

  const hasPendingChanges = session
    ? steerSpecHasPendingChanges(session.baselineSpec, session.spec)
    : false;

  const value = useMemo(
    () => ({
      session,
      hasPendingChanges,
      setSession,
      openSession,
      acceptDraft,
      revertDraft,
      clearSession,
    }),
    [session, hasPendingChanges, setSession, openSession, acceptDraft, revertDraft, clearSession],
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
