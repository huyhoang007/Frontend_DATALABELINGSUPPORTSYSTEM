import apiClient from "../api/apiClient";

const MAX_CACHE_ENTRIES = 40;
const blobUrlCache = new Map();
const inFlightRequests = new Map();

const touchEntry = (key, entry) => {
  blobUrlCache.delete(key);
  blobUrlCache.set(key, {
    ...entry,
    touchedAt: Date.now(),
  });
};

const evictIfNeeded = () => {
  while (blobUrlCache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = blobUrlCache.keys().next().value;
    if (!oldestKey) return;
    const oldestEntry = blobUrlCache.get(oldestKey);
    if (oldestEntry?.objectUrl) {
      URL.revokeObjectURL(oldestEntry.objectUrl);
    }
    blobUrlCache.delete(oldestKey);
  }
};

export async function getCachedBlobUrl(path) {
  if (!path) return null;

  const cachedEntry = blobUrlCache.get(path);
  if (cachedEntry?.objectUrl) {
    touchEntry(path, cachedEntry);
    return cachedEntry.objectUrl;
  }

  if (inFlightRequests.has(path)) {
    return inFlightRequests.get(path);
  }

  const requestPromise = apiClient
    .get(path, {
      responseType: "blob",
      transformResponse: [(data) => data],
    })
    .then((response) => {
      const blob = response instanceof Blob ? response : new Blob([response]);
      const objectUrl = URL.createObjectURL(blob);
      blobUrlCache.set(path, {
        objectUrl,
        touchedAt: Date.now(),
      });
      evictIfNeeded();
      inFlightRequests.delete(path);
      return objectUrl;
    })
    .catch((error) => {
      inFlightRequests.delete(path);
      throw error;
    });

  inFlightRequests.set(path, requestPromise);
  return requestPromise;
}

export function preloadBlobUrl(path) {
  if (!path || blobUrlCache.has(path) || inFlightRequests.has(path)) return;
  getCachedBlobUrl(path).catch(() => {
    // Ignore preload failures and let foreground requests retry.
  });
}

export function clearBlobAssetCache() {
  blobUrlCache.forEach((entry) => {
    if (entry?.objectUrl) {
      URL.revokeObjectURL(entry.objectUrl);
    }
  });
  blobUrlCache.clear();
  inFlightRequests.clear();
}
