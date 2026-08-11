/** Query param that unlocks the real site from the Coming Soon splash. */
const PREVIEW_QUERY_PARAM = 'preview';

/** localStorage key so preview stays unlocked across visits after `?preview=1`. */
export const PREVIEW_STORAGE_KEY = 'steerco.preview';

const UNLOCK_VALUES = new Set(['1', 'true', 'yes']);
const LOCK_VALUES = new Set(['0', 'false', 'no']);

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function isPreviewUnlocked(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
  storage: StorageLike | null = typeof window !== 'undefined' ? window.localStorage : null,
): boolean {
  const params = new URLSearchParams(search);
  const raw = params.get(PREVIEW_QUERY_PARAM);

  if (raw !== null) {
    const normalized = raw.toLowerCase();

    if (UNLOCK_VALUES.has(normalized)) {
      storage?.setItem(PREVIEW_STORAGE_KEY, '1');
      return true;
    }

    if (LOCK_VALUES.has(normalized)) {
      storage?.removeItem(PREVIEW_STORAGE_KEY);
      return false;
    }
  }

  return storage?.getItem(PREVIEW_STORAGE_KEY) === '1';
}
