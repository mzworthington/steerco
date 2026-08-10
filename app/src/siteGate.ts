/** Query param that unlocks the real site from the Coming Soon splash. */
const PREVIEW_QUERY_PARAM = 'preview';

/** sessionStorage key so in-app navigation stays unlocked after `?preview=1`. */
export const PREVIEW_STORAGE_KEY = 'steerlens.preview';

const UNLOCK_VALUES = new Set(['1', 'true', 'yes']);

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function isPreviewUnlocked(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
  storage: StorageLike | null = typeof window !== 'undefined' ? window.sessionStorage : null,
): boolean {
  const params = new URLSearchParams(search);
  const raw = params.get(PREVIEW_QUERY_PARAM);

  if (raw !== null) {
    const unlocked = UNLOCK_VALUES.has(raw.toLowerCase());
    if (storage) {
      if (unlocked) storage.setItem(PREVIEW_STORAGE_KEY, '1');
      else storage.removeItem(PREVIEW_STORAGE_KEY);
    }
    return unlocked;
  }

  return storage?.getItem(PREVIEW_STORAGE_KEY) === '1';
}
