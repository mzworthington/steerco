import { describe, expect, it } from 'vitest';
import { listRecentWorkspaces, rememberRecentWorkspace } from './recentWorkspacesStore';

function memoryStorage(initial: Record<string, string> = {}) {
  const store = { ...initial };
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

describe('recentWorkspacesStore', () => {
  it('remembers and lists recent workspaces with newest first', () => {
    const storage = memoryStorage();
    rememberRecentWorkspace(
      {
        id: 'a',
        title: 'Alpha',
        kind: 'sample',
        openedAt: '2026-01-01T00:00:00.000Z',
      },
      storage,
    );
    rememberRecentWorkspace(
      {
        id: 'b',
        title: 'Beta',
        kind: 'file',
        openedAt: '2026-01-02T00:00:00.000Z',
      },
      storage,
    );

    expect(listRecentWorkspaces(storage).map((item) => item.id)).toEqual(['b', 'a']);
  });
});
