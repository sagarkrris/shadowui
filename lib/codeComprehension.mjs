// Literal sources remain readable in production builds; tests execute exactly these snippets.
export const COMPREHENSION_STARTER = `function readCachedBuggy(cache, key, now) {
  const entry = cache.get(key);
  if (entry && entry.value && now <= entry.expiresAt) return entry.value;
  return undefined;
}`;

export const COMPREHENSION_REFERENCE = `function readCached(cache, key, now) {
  const entry = cache.get(key);
  if (entry && now < entry.expiresAt) return entry.value;
  return undefined;
}`;
