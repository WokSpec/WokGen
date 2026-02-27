/**
 * Rate limiter — sliding window per key.
 *
 * Primary:  Upstash Redis (shared across ALL Vercel serverless instances).
 *           This is the ONLY correct option at scale. In-memory rate limiting
 *           is silently bypassed when Vercel spawns multiple instances.
 *
 * Fallback: Postgres-backed rate limiting via WokGen's own DB.
 *           Slower (~10ms) but correct. Used when Redis is not configured.
 *
 * Last resort: In-memory — ONLY acceptable for local development.
 *              Will NOT enforce limits across concurrent production instances.
 */

import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';

// ─── Upstash Redis (primary) ───────────────────────────────────────────────

let _upstashLimiter: ((key: string, max: number, windowMs: number) => Promise<{ allowed: boolean; retryAfter?: number }>) | null | undefined = undefined;

function getUpstashLimiter() {
  if (_upstashLimiter !== undefined) return _upstashLimiter;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) { _upstashLimiter = null; return null; }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require('@upstash/ratelimit');
    const redis = new Redis({ url, token });
    const limiters = new Map<string, ReturnType<typeof Ratelimit>>();

    _upstashLimiter = async (key: string, max: number, windowMs: number) => {
      const cacheKey = `${max}:${windowMs}`;
      if (!limiters.has(cacheKey)) {
        limiters.set(cacheKey, new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(max, `${windowMs}ms`),
          prefix:  'wokgen:rl',
        }));
      }
      const result = await limiters.get(cacheKey)!.limit(key);
      return result.success
        ? { allowed: true }
        : { allowed: false, retryAfter: Math.ceil((result.reset - Date.now()) / 1000) };
    };
  } catch {
    _upstashLimiter = null;
  }

  return _upstashLimiter;
}

// ─── Postgres fallback (correct at scale, no Redis required) ──────────────
// Uses a single RateLimit table row per key, with atomic compare-and-swap.

async function checkPostgres(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now   = Date.now();
  const until = now + windowMs;

  try {
    // Upsert: create the row if missing, reset if window expired, else increment
    const result = await prisma.$queryRaw<Array<{ count: number; reset_at: bigint }>>`
      INSERT INTO "RateLimit" (key, count, reset_at)
      VALUES (${key}, 1, ${until})
      ON CONFLICT (key) DO UPDATE SET
        count    = CASE
                     WHEN "RateLimit".reset_at < ${now} THEN 1
                     ELSE "RateLimit".count + 1
                   END,
        reset_at = CASE
                     WHEN "RateLimit".reset_at < ${now} THEN ${until}
                     ELSE "RateLimit".reset_at
                   END
      RETURNING count, reset_at
    `;

    const row       = result[0];
    const count     = row?.count ?? 1;
    const resetAt   = Number(row?.reset_at ?? until);
    const retryAfter = Math.ceil((resetAt - now) / 1000);

    if (count > maxRequests) {
      return { allowed: false, retryAfter };
    }
    return { allowed: true };
  } catch {
    // DB unavailable — fall through to in-memory (development only)
    if (process.env.NODE_ENV === 'production') {
      log.warn({ key }, 'rate-limit: falling back to in-memory (NOT shared across instances)');
    }
    return checkInMemory(key, maxRequests, windowMs);
  }
}

// ─── In-memory (development / last resort) ────────────────────────────────
// IMPORTANT: This is NOT shared across Vercel instances.
// Only acceptable for local development where there is a single process.

interface MemBucket { count: number; resetAt: number }
const _memStore = new Map<string, MemBucket>();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of _memStore.entries()) {
      if (bucket.resetAt < now) _memStore.delete(key);
    }
  }, 5 * 60_000);
}

function checkInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfter?: number } {
  const now      = Date.now();
  const existing = _memStore.get(key);
  if (!existing || existing.resetAt < now) {
    _memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  if (existing.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { allowed: true };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Check rate limit for a key. Returns immediately.
 *
 * Uses Redis → Postgres → in-memory in that priority order.
 * Redis is the only option that works correctly across Vercel instances.
 */
export async function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs    = 60_000,
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const upstash = getUpstashLimiter();
  if (upstash) {
    try {
      return await upstash(key, maxRequests, windowMs);
    } catch {
      // Redis unavailable — fall through
    }
  }
  return checkPostgres(key, maxRequests, windowMs);
}
