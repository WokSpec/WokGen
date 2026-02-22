/**
 * In-memory rate limiter. Per-userId sliding window.
 * Resets on server restart — acceptable for serverless (each instance has its own window).
 * No Redis required.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const store = new Map<string, Bucket>();

/** Clean up expired buckets every 5 minutes */
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (bucket.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * @returns `{ allowed: true }` when under limit, `{ allowed: false, retryAfter }` when over.
 */
export function checkRateLimit(
  userId: string,
  maxRequests = 10,
  windowMs = 60_000,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const existing = store.get(userId);

  if (!existing || existing.resetAt < now) {
    store.set(userId, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { allowed: true };
}
