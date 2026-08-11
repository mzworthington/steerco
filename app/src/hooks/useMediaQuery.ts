import { useSyncExternalStore } from 'react';

function subscribeMediaQuery(query: string, onStoreChange: () => void) {
  if (typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const media = window.matchMedia(query);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

function getMediaQuerySnapshot(query: string) {
  if (typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

/** Tailwind `lg` breakpoint (1024px) and up. */
export const LG_UP_QUERY = '(min-width: 1024px)';

export function useMediaQuery(query: string, serverSnapshot = false) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => serverSnapshot,
  );
}

export function useLgUp() {
  return useMediaQuery(LG_UP_QUERY, true);
}
