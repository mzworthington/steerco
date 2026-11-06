import type { ReactNode } from 'react';
import { WorkspaceSessionProvider } from './WorkspaceSession';
import { WorkspaceShell } from './WorkspaceShell';

/** Workspace chrome. Loaded only on `/workspace` so the public home route stays small. */
export function WorkspaceFrame({ children }: { children: ReactNode }) {
  return (
    <WorkspaceSessionProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceSessionProvider>
  );
}
