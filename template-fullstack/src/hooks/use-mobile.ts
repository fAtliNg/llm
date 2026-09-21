import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

const query = `(max-width: ${String(MOBILE_BREAKPOINT - 1)}px)`;

function subscribe(onChange: () => void): () => void {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => {
    mql.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(query).matches;
}

/** True below the tablet breakpoint; used by the sidebar to switch to a sheet. */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
