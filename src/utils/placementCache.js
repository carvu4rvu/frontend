const DEFAULT_TTL_MS = 5 * 60 * 1000;

const store = new Map();

function cacheKey(namespace, key) {
  return `${namespace}:${key}`;
}

export function getCached(namespace, key) {
  const entry = store.get(cacheKey(namespace, key));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(cacheKey(namespace, key));
    return null;
  }
  return entry.value;
}

export function setCached(namespace, key, value, ttlMs = DEFAULT_TTL_MS) {
  store.set(cacheKey(namespace, key), {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateCache(namespace, key) {
  if (key != null) {
    store.delete(cacheKey(namespace, key));
    return;
  }
  const prefix = `${namespace}:`;
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

export async function getOrFetch(namespace, key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const hit = getCached(namespace, key);
  if (hit != null) return hit;
  const value = await fetcher();
  setCached(namespace, key, value, ttlMs);
  return value;
}
