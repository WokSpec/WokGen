/**
 * In-process LRU cache for hot reads that don't need Redis round-trips.
 *
 * Use this for:
 * - Provider health status (volatile, per-instance is fine)
 * - Feature flags (refreshed on TTL expiry)
 * - User quota summaries (short TTL, reduces DB pressure)
 *
 * This is instance-local — does NOT share across multiple server instances.
 * For shared state, use lib/cache.ts (Redis-backed).
 */

import { LRUCache } from 'lru-cache';

type CacheEntry<T> = { value: T; expiresAt: number };

const _store = new LRUCache<string, CacheEntry<unknown>>({
  max: 2000,         // max 2000 entries
  ttl: 60 * 1000,   // default 60s TTL
  ttlAutopurge: true,
});

export const localCache = {
  get<T>(key: string): T | null {
    const entry = _store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { _store.delete(key); return null; }
    return entry.value;
  },

  set<T>(key: string, value: T, ttlMs = 60_000): void {
    _store.set(key, { value, expiresAt: Date.now() + ttlMs }, { ttl: ttlMs });
  },

  del(key: string): void {
    _store.delete(key);
  },

  has(key: string): boolean {
    return _store.has(key);
  },

  clear(): void {
    _store.clear();
  },

  size(): number {
    return _store.size;
  },
};
