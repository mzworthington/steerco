import { useSyncExternalStore } from 'react';

const LG_UP_QUERY = '(min-width: 1024px)';

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

function useMediaQuery(query: string, serverSnapshot = false) {
  return useSyncExternalStore(
    (onStoreChange) => subscribeMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => serverSnapshot,
  );
}

/** True at the Tailwind `lg` breakpoint (1024px) and up. */
export function useLgUp() {
  return useMediaQuery(LG_UP_QUERY, true);
}
