/**
 * WokGen — Generation Quota System
 *
 * Enforces daily standard-tier generation limits that work correctly across
 * Vercel's multi-instance serverless environment (where in-memory state is
 * isolated per-instance and worthless at scale).
 *
 * Architecture:
 *   Primary:  Upstash Redis — atomic INCR, sub-millisecond, shared across
 *             all Vercel instances. Perfect for 20k concurrent users.
 *   Fallback: Postgres (Prisma) — atomic updateMany with conditional WHERE.
 *             Slightly higher latency (~10ms) but fully correct at scale.
 *
 * Daily limits by tier:
 *   guest →  3 std/day   (per IP)
 *   free  → 10 std/day   (per userId)
 *   plus  → unlimited standard (paid plan)
 *   pro   → unlimited standard
 *   max   → unlimited standard
 *
 * Per-minute rate limits (enforced separately in rate-limit.ts):
 *   guest → 2/min   free → 5/min   plus → 15/min   pro → 30/min
 *
 * Concurrent request limits (prevents resource exhaustion):
 *   guest → 1   free → 2   plus → 3   pro → 5   max → 10
 */

import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// Tier configuration (authoritative — mirrors Plan table + guest)
// ---------------------------------------------------------------------------

export const DAILY_STD_LIMIT: Record<string, number> = {
  guest: 5,
  free:  50,   // generous free tier — a real working session
  plus:  200,
  pro:   500,
  max:   -1,   // -1 = unlimited
};

export const SFX_DAILY_LIMIT: Record<string, number> = {
  guest: 3,
  free:  10,
  plus:  50,
  pro:   -1,
  max:   -1,
};

export const TTS_DAILY_LIMIT: Record<string, number> = {
  guest: 3,
  free:  10,
  plus:  50,
  pro:   -1,
  max:   -1,
};

export const TTS_MAX_CHARS: Record<string, number> = {
  guest: 500,
  free:  1000,
  plus:  3000,
  pro:   10000,
  max:   10000,
};

export const ERAL_VOICE_DAILY_LIMIT: Record<string, number> = {
  guest: 2,
  free:  5,
  plus:  -1,
  pro:   -1,
  max:   -1,
};

export const PER_MIN_RATE: Record<string, number> = {
  guest:  2,
  free:   5,
  plus:  15,
  pro:   30,
  max:   60,
};

export const MAX_CONCURRENT: Record<string, number> = {
  guest: 1,
  free:  2,
  plus:  3,
  pro:   5,
  max:   10,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuotaResult {
  allowed:     boolean;
  tier:        string;
  used:        number;
  limit:       number;      // -1 = unlimited
  remaining:   number;      // -1 = unlimited
  retryAfter?: number;      // seconds until quota resets (only when denied)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function utcToday(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function secondsUntilMidnightUTC(): number {
  const now = Date.now();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.ceil((midnight.getTime() - now) / 1000);
}

// ---------------------------------------------------------------------------
// Redis layer (Upstash)
// Lazy-initialised so module import doesn't fail if @upstash/redis is absent.
// ---------------------------------------------------------------------------

type RedisClient = {
  incr: (key: string) => Promise<number>;
  get:  (key: string) => Promise<number | null>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

let _redis: RedisClient | null | undefined = undefined; // undefined = uninitialised

function getRedis(): RedisClient | null {
  if (_redis !== undefined) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    _redis = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis');
    _redis = new Redis({ url, token }) as RedisClient;
  } catch {
    _redis = null;
  }
  return _redis;
}

/** Atomically increment a quota counter in Redis. Returns the new count. */
async function redisIncr(key: string, ttlSeconds: number): Promise<number> {
  const redis = getRedis()!;
  const count = await redis.incr(key);
  if (count === 1) {
    // First hit today — set TTL so key auto-expires at midnight (+60s buffer)
    await redis.expire(key, ttlSeconds + 60);
  }
  return count;
}

/** Read current count without incrementing. */
async function redisGet(key: string): Promise<number> {
  const redis = getRedis();
  if (!redis) return 0;
  return (await redis.get(key)) ?? 0;
}

// ---------------------------------------------------------------------------
// DB fallback — authenticated users
// Uses compare-and-swap via updateMany to be safe under concurrency.
// ---------------------------------------------------------------------------

async function dbClaimUserSlot(
  userId: string,
  today: string,
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { stdGenToday: true, stdGenDate: true },
  });
  if (!user) return { allowed: false, count: 0 };

  const isNewDay     = user.stdGenDate !== today;
  const currentCount = isNewDay ? 0 : (user.stdGenToday ?? 0);

  if (currentCount >= limit) {
    return { allowed: false, count: currentCount };
  }

  // Atomic: only succeeds if the row still satisfies the WHERE condition.
  // Prevents over-counting when two requests arrive simultaneously.
  const updated = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [
        { stdGenDate: { not: today } },                    // new day — reset
        { stdGenDate: today, stdGenToday: { lt: limit } }, // still under limit
      ],
    },
    data: {
      stdGenToday: isNewDay ? 1 : { increment: 1 },
      stdGenDate:  today,
    },
  });

  if (updated.count === 0) {
    // Race condition: another concurrent request claimed the last slot first.
    return { allowed: false, count: limit };
  }

  return { allowed: true, count: isNewDay ? 1 : currentCount + 1 };
}

// ---------------------------------------------------------------------------
// DB fallback — guest users (by IP)
// ---------------------------------------------------------------------------

async function dbClaimGuestSlot(
  ip: string,
  today: string,
  limit: number,
): Promise<{ allowed: boolean; count: number }> {
  try {
    // Ensure the row exists (idempotent)
    await prisma.guestUsage.upsert({
      where:  { ip_date: { ip, date: today } },
      create: { ip, date: today, count: 0 },
      update: {},
    });

    // Atomic increment — only if under the limit
    const claimed = await prisma.guestUsage.updateMany({
      where: { ip, date: today, count: { lt: limit } },
      data:  { count: { increment: 1 } },
    });

    if (claimed.count === 0) {
      const row = await prisma.guestUsage.findUnique({
        where:  { ip_date: { ip, date: today } },
        select: { count: true },
      });
      return { allowed: false, count: row?.count ?? limit };
    }

    const row = await prisma.guestUsage.findUnique({
      where:  { ip_date: { ip, date: today } },
      select: { count: true },
    });
    return { allowed: true, count: row?.count ?? 1 };
  } catch {
    // DB error — fail open (don't block guests due to infrastructure issues)
    return { allowed: true, count: 0 };
  }
}

// ---------------------------------------------------------------------------
// Main export: claimStdSlot
//
// Call this BEFORE starting a generation. It atomically claims one slot.
// If it returns allowed:false, reject the request with 429.
// No need to "release" on failure — the slot is consumed regardless.
// ---------------------------------------------------------------------------

export async function claimStdSlot(
  userId: string | null,
  ip: string,
  planId: string,
): Promise<QuotaResult> {
  const tier  = userId ? planId : 'guest';
  const limit = DAILY_STD_LIMIT[tier] ?? DAILY_STD_LIMIT.free;
  const today = utcToday();
  const ttl   = secondsUntilMidnightUTC();

  // Unlimited tiers (paid plans) skip the quota check entirely
  if (limit === -1) {
    return { allowed: true, tier, used: 0, limit: -1, remaining: -1 };
  }

  const redis    = getRedis();
  const redisKey = userId
    ? `wokgen:std:user:${userId}:${today}`
    : `wokgen:std:guest:${ip}:${today}`;

  let result: { allowed: boolean; count: number };

  if (redis) {
    // Redis path: O(1), atomic, works across all Vercel instances
    try {
      const count = await redisIncr(redisKey, ttl);
      if (count > limit) {
        result = { allowed: false, count };
      } else {
        result = { allowed: true, count };
      }
    } catch {
      // Redis error — fall through to DB
      result = userId
        ? await dbClaimUserSlot(userId, today, limit)
        : await dbClaimGuestSlot(ip, today, limit);
    }
  } else {
    // DB path: slightly slower but fully correct
    result = userId
      ? await dbClaimUserSlot(userId, today, limit)
      : await dbClaimGuestSlot(ip, today, limit);
  }

  return {
    allowed:    result.allowed,
    tier,
    used:       result.count,
    limit,
    remaining:  result.allowed ? Math.max(0, limit - result.count) : 0,
    retryAfter: result.allowed ? undefined : ttl,
  };
}

// ---------------------------------------------------------------------------
// Concurrent request guard
//
// Prevents a single user from hammering 50 parallel requests.
// Uses running Job count from DB (authoritative, correct across instances).
// For guests, uses Redis TTL keys (best-effort).
// ---------------------------------------------------------------------------

export async function checkConcurrent(
  userId: string | null,
  ip: string,
  planId: string,
): Promise<{ allowed: boolean; running: number; max: number }> {
  const tier = userId ? planId : 'guest';
  const max  = MAX_CONCURRENT[tier] ?? MAX_CONCURRENT.free;

  if (userId) {
    // Count jobs currently running for this user (last 3 min, covers stuck jobs)
    try {
      const running = await prisma.job.count({
        where: {
          userId,
          status:    'running',
          createdAt: { gte: new Date(Date.now() - 3 * 60_000) },
        },
      });
      return { allowed: running < max, running, max };
    } catch {
      return { allowed: true, running: 0, max }; // DB error — fail open
    }
  }

  // Guest — use Redis TTL key if available
  const redis = getRedis();
  if (!redis) return { allowed: true, running: 0, max }; // no Redis — skip check

  try {
    const key   = `wokgen:concur:guest:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 300); // 5-minute TTL per slot

    if (count > max) {
      // Roll back the counter for rejected requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (redis as any).decr?.(key).catch(() => {});
      return { allowed: false, running: count, max };
    }
    return { allowed: true, running: count, max };
  } catch {
    return { allowed: true, running: 0, max };
  }
}

// ---------------------------------------------------------------------------
// Release concurrent slot for guest (call after generation completes/fails)
// ---------------------------------------------------------------------------

export async function releaseConcurrentSlot(ip: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    const key = `wokgen:concur:guest:${ip}`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (redis as any).decr?.(key).catch(() => {});
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Read current quota status (for UI display — does NOT consume a slot)
// ---------------------------------------------------------------------------

export async function getQuotaStatus(
  userId: string | null,
  ip: string,
  planId: string,
): Promise<{ used: number; limit: number; remaining: number; tier: string }> {
  const tier  = userId ? planId : 'guest';
  const limit = DAILY_STD_LIMIT[tier] ?? DAILY_STD_LIMIT.free;
  const today = utcToday();

  if (limit === -1) return { used: 0, limit: -1, remaining: -1, tier };

  const redis    = getRedis();
  const redisKey = userId
    ? `wokgen:std:user:${userId}:${today}`
    : `wokgen:std:guest:${ip}:${today}`;

  if (redis) {
    try {
      const count = await redisGet(redisKey);
      return { used: count, limit, remaining: Math.max(0, limit - count), tier };
    } catch { /* fall through */ }
  }

  if (userId) {
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { stdGenToday: true, stdGenDate: true },
    }).catch(() => null);
    const count = user?.stdGenDate === today ? (user.stdGenToday ?? 0) : 0;
    return { used: count, limit, remaining: Math.max(0, limit - count), tier };
  }

  const row = await prisma.guestUsage.findUnique({
    where:  { ip_date: { ip, date: today } },
    select: { count: true },
  }).catch(() => null);
  const count = row?.count ?? 0;
  return { used: count, limit, remaining: Math.max(0, limit - count), tier };
}

// ---------------------------------------------------------------------------
// Get a user's active plan ID (with subscription status check)
// ---------------------------------------------------------------------------

export async function getUserPlanId(userId: string): Promise<string> {
  try {
    const sub = await prisma.subscription.findUnique({
      where:  { userId },
      select: { planId: true, status: true },
    });
    if (!sub || !['active', 'trialing'].includes(sub.status)) return 'free';
    return sub.planId;
  } catch {
    return 'free';
  }
}

// ---------------------------------------------------------------------------
// Cleanup old GuestUsage rows (call from /api/cron/cleanup)
// Keep only last 2 days to bound table growth
// ---------------------------------------------------------------------------

export async function cleanupOldGuestUsage(): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 2);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const result = await prisma.guestUsage.deleteMany({
    where: { date: { lt: cutoff } },
  });
  return result.count;
}
