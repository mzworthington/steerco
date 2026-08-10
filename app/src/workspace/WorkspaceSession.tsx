import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { SteerSpec } from '@steerlens/core';

export type WorkspaceSource = 'sample' | 'folder' | 'file';

export type WorkspaceSessionState = {
  spec: SteerSpec;
  source: WorkspaceSource;
  label: string;
};

type WorkspaceSessionContextValue = {
  session: WorkspaceSessionState | null;
  setSession: (session: WorkspaceSessionState) => void;
  clearSession: () => void;
};

const WorkspaceSessionContext = createContext<WorkspaceSessionContextValue | null>(null);

const SESSION_STORAGE_KEY = 'steerlens.workspace-session';

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
    return {
      label: record.label,
      source: record.source,
      spec: record.spec as SteerSpec,
    };
  } catch {
    return null;
  }
}

export function WorkspaceSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<WorkspaceSessionState | null>(() =>
    typeof sessionStorage === 'undefined' ? null : readStoredSession(),
  );

  const setSession = useCallback((next: WorkspaceSessionState) => {
    setSessionState(next);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
  }, []);

  const clearSession = useCallback(() => {
    setSessionState(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({ session, setSession, clearSession }),
    [session, setSession, clearSession],
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
