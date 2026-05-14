import { useEffect, useRef } from 'react';

const REFRESH_INTERVAL_MS = 60 * 1000; // 1 minute

/**
 * Sets up a background refresh every `intervalMs` (default 1 minute).
 * The fetchFn is called with `{ silent: true }` - when silent, it should NOT
 * show loading spinners; it should update data in place.
 *
 * @param {((opts?: { silent?: boolean }) => void | Promise<void>)} fetchFn - Function that fetches data. Accepts { silent } to avoid loading states.
 * @param {number} [intervalMs=60000] - Refresh interval in milliseconds.
 */
export function useBackgroundRefresh(fetchFn, intervalMs = REFRESH_INTERVAL_MS) {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  useEffect(() => {
    const id = setInterval(() => {
      const fn = fetchRef.current;
      if (typeof fn === 'function') {
        fn({ silent: true });
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
