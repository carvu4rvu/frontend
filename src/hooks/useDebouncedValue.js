import { useEffect, useState } from 'react';

/**
 * Debounce a value (e.g. search input) before triggering dependent effects.
 */
export function useDebouncedValue(value, delayMs = 500) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
