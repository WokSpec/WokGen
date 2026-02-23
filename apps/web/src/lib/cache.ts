/**
 * WokGen Redis cache layer — stale-while-revalidate pattern.
 *
 * Falls back gracefully when Redis is not configured (returns null → caller
 * fetches from DB and continues without caching).
 *
 * Usage:
 *   const cached = await cache.get<Gallery>('gallery:page:1');
 *   if (cached) return cached;
 *   const fresh = await db.fetchGallery(...);
 *   await cache.set('gallery:page:1', fresh, 30); // 30 second TTL
 */

import type { Redis } from '@upstash/redis';

let _client: Redis | null | undefined = undefined;

function getRedis(): Redis | null {
  if (_client !== undefined) return _client;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { _client = null; return null; }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis: R } = require('@upstash/redis');
    _client = new R({ url, token });
  } catch {
    _client = null;
  }
  return _client as Redis | null;
}

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get<string>(key);
      if (raw == null) return null;
      return typeof raw === 'string' ? JSON.parse(raw) as T : raw as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
    } catch {
      // Non-fatal — fall through
    }
  },

  async del(key: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try { await redis.del(key); } catch { /* ignore */ }
  },

  async delPattern(pattern: string): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length) await redis.del(...keys as [string, ...string[]]);
    } catch { /* ignore */ }
  },

  /** Wrap a fetcher with cache-aside logic */
  async wrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await cache.set(key, fresh, ttlSeconds);
    return fresh;
  },
};

// ---------------------------------------------------------------------------
// Cache key constants (Cycle 11)
// ---------------------------------------------------------------------------
export const CK = {
  quota:        (userId: string)  => `wokgen:quota:${userId}`,         // 30s
  brand:        (userId: string)  => `wokgen:brand:${userId}`,         // 5min
  galleryPage1: ()                => `wokgen:gallery:p1`,              // 30s
  adminStats:   ()                => `wokgen:admin:stats`,             // 5min
  providerHealth:(p: string)      => `wokgen:phk:${p}`,               // 60s
  featureFlags: ()                => `wokgen:flags`,                   // 2min
} as const;
