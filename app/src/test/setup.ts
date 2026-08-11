import '@testing-library/jest-dom/vitest';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

Object.defineProperty(globalThis, 'indexedDB', {
  configurable: true,
  writable: true,
  value: indexedDB,
});
Object.defineProperty(globalThis, 'IDBKeyRange', {
  configurable: true,
  writable: true,
  value: IDBKeyRange,
});

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

function ensureStorage(name: 'localStorage' | 'sessionStorage') {
  try {
    const current = globalThis[name];
    if (current && typeof current.getItem === 'function') {
      current.setItem('__steerlens_storage_probe__', '1');
      current.removeItem('__steerlens_storage_probe__');
      return;
    }
  } catch {
    // fall through to polyfill
  }
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value: createMemoryStorage(),
  });
}

ensureStorage('localStorage');
ensureStorage('sessionStorage');

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: ResizeObserverStub,
  });
}
