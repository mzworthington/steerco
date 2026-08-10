import { afterEach, describe, expect, it } from 'vitest';
import { PREVIEW_STORAGE_KEY, isPreviewUnlocked } from './siteGate';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

afterEach(() => {
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
});

describe('isPreviewUnlocked', () => {
  it('locks by default', () => {
    expect(isPreviewUnlocked('', memoryStorage())).toBe(false);
  });

  it('unlocks when preview=1 and persists to storage', () => {
    const storage = memoryStorage();
    expect(isPreviewUnlocked('?preview=1', storage)).toBe(true);
    expect(storage.getItem(PREVIEW_STORAGE_KEY)).toBe('1');
  });

  it('accepts preview=true', () => {
    expect(isPreviewUnlocked('?preview=true', memoryStorage())).toBe(true);
  });

  it('stays unlocked from session storage without query', () => {
    const storage = memoryStorage({ [PREVIEW_STORAGE_KEY]: '1' });
    expect(isPreviewUnlocked('', storage)).toBe(true);
  });

  it('locks again when preview=0 and clears storage', () => {
    const storage = memoryStorage({ [PREVIEW_STORAGE_KEY]: '1' });
    expect(isPreviewUnlocked('?preview=0', storage)).toBe(false);
    expect(storage.getItem(PREVIEW_STORAGE_KEY)).toBeNull();
  });
});
