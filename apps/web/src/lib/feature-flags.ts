/**
 * Feature flags — env-var backed with LRU cache for fast reads.
 *
 * Flags are read from environment variables on first access and cached for
 * CACHE_TTL_MS. This gives O(1) flag reads without Redis round-trips.
 *
 * When VERCEL_ENV=production, flags can also be updated at runtime by writing
 * to Upstash Redis under the key `ff:{flag}` (value "true"/"false").
 * The LRU cache provides a TTL-based buffer so Redis isn't hit on every request.
 *
 * Flag priority:
 *  1. Redis override (if configured, checked every CACHE_TTL_MS)
 *  2. Environment variable (e.g. MAINTENANCE_MODE=true)
 *  3. Compiled-in default
 */

import { localCache } from './local-cache';

const CACHE_TTL_MS = 30_000; // 30s — flags are slightly stale but fast

export interface FeatureFlags {
  MAINTENANCE_MODE: boolean;
  ENABLE_QUALITY_GATE: boolean;
  MAX_BATCH_SIZE: number;
  DISABLE_SIGNUPS: boolean;
  DISABLE_GUEST_GENERATION: boolean;
  RATE_LIMIT_ENABLED: boolean;
}

const DEFAULTS: FeatureFlags = {
  MAINTENANCE_MODE:         false,
  ENABLE_QUALITY_GATE:      true,
  MAX_BATCH_SIZE:           8,
  DISABLE_SIGNUPS:          false,
  DISABLE_GUEST_GENERATION: false,
  RATE_LIMIT_ENABLED:       true,
};

function readFromEnv(): FeatureFlags {
  return {
    MAINTENANCE_MODE:         process.env.MAINTENANCE_MODE === 'true',
    ENABLE_QUALITY_GATE:      process.env.ENABLE_QUALITY_GATE !== 'false',
    MAX_BATCH_SIZE:           parseInt(process.env.MAX_BATCH_SIZE || '8', 10),
    DISABLE_SIGNUPS:          process.env.DISABLE_SIGNUPS === 'true',
    DISABLE_GUEST_GENERATION: process.env.DISABLE_GUEST_GENERATION === 'true',
    RATE_LIMIT_ENABLED:       process.env.RATE_LIMIT_ENABLED !== 'false',
  };
}

async function readFromRedis(): Promise<Partial<FeatureFlags>> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return {};

  try {
    const keys = Object.keys(DEFAULTS) as (keyof FeatureFlags)[];
    const results: Partial<FeatureFlags> = {};

    await Promise.all(keys.map(async (key) => {
      const res = await fetch(`${url}/get/ff:${key}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3_000),
      });
      if (!res.ok) return;
      const { result } = await res.json() as { result: string | null };
      if (result === null) return;

      if (key === 'MAX_BATCH_SIZE') {
        (results as Record<string, unknown>)[key] = parseInt(result, 10);
      } else {
        (results as Record<string, unknown>)[key] = result === 'true';
      }
    }));

    return results;
  } catch {
    return {};
  }
}

/**
 * Get all feature flags. Result is cached for CACHE_TTL_MS.
 */
export async function getFlags(): Promise<FeatureFlags> {
  const CACHE_KEY = 'feature_flags';
  const cached = localCache.get<FeatureFlags>(CACHE_KEY);
  if (cached) return cached;

  const envFlags   = readFromEnv();
  const redisFlags = await readFromRedis();
  const merged     = { ...DEFAULTS, ...envFlags, ...redisFlags };

  localCache.set(CACHE_KEY, merged, CACHE_TTL_MS);
  return merged;
}

/**
 * Get a single flag. Backed by the same cache.
 */
export async function getFlag<K extends keyof FeatureFlags>(key: K): Promise<FeatureFlags[K]> {
  const flags = await getFlags();
  return flags[key];
}
