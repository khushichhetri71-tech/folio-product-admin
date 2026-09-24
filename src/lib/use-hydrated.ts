'use client';
import { useSyncExternalStore } from 'react';
const subscribe = () => () => {};
// Keep forms inert until React can intercept submit; credentials must never become a GET URL.
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
