export type RecentWorkspaceKind = 'sample' | 'file';

export type RecentWorkspace = {
  id: string;
  title: string;
  kind: RecentWorkspaceKind;
  openedAt: string;
};

const STORAGE_KEY = 'steerco.recent-workspaces';
const MAX_RECENT = 8;

export function listRecentWorkspaces(
  storage: Pick<Storage, 'getItem'> = localStorage,
): RecentWorkspace[] {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentWorkspace).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function rememberRecentWorkspace(
  entry: Omit<RecentWorkspace, 'openedAt'> & { openedAt?: string },
  storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage,
): RecentWorkspace[] {
  const nextEntry: RecentWorkspace = {
    ...entry,
    openedAt: entry.openedAt ?? new Date().toISOString(),
  };
  const existing = listRecentWorkspaces(storage).filter((item) => item.id !== nextEntry.id);
  const next = [nextEntry, ...existing].slice(0, MAX_RECENT);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function isRecentWorkspace(value: unknown): value is RecentWorkspace {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.title === 'string' &&
    (record.kind === 'sample' || record.kind === 'file') &&
    typeof record.openedAt === 'string'
  );
}
