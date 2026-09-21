import { useSyncExternalStore } from 'react';

import type { Device } from '@/meta/schema';

/** Breakpoints: mobile below 768px (Tailwind `md`), tablet below 1024px (`lg`), desktop from there. */
const QUERIES: Record<Exclude<Device, 'desktop'>, string> = {
  mobile: '(max-width: 767px)',
  tablet: '(max-width: 1023px)',
};

function current(): Device {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'desktop';
  if (window.matchMedia(QUERIES.mobile).matches) return 'mobile';
  if (window.matchMedia(QUERIES.tablet).matches) return 'tablet';
  return 'desktop';
}

function subscribe(onChange: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined;
  const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
  for (const list of lists) list.addEventListener('change', onChange);
  return () => {
    for (const list of lists) list.removeEventListener('change', onChange);
  };
}

/** The screen size the meta grids should use right now; re-renders when the window crosses a breakpoint. */
export function useDevice(): Device {
  return useSyncExternalStore(subscribe, current, () => 'desktop');
}
