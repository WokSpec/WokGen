import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/health
//
// Lightweight health-check endpoint used by:
//   - Docker HEALTHCHECK instructions
//   - Uptime monitors (UptimeRobot, Betterstack, etc.)
//   - Load balancer probes
//   - CI smoke tests after deployment
//
// Returns 200 OK when the app and database are reachable, 503 otherwise.
//
// Response shape:
// {
//   status:  "ok" | "degraded"
//   version: string          -- from package.json
//   uptime:  number          -- process.uptime() in seconds
//   db:      "ok" | "error"
//   checks:  Record<string, { ok: boolean; latencyMs?: number; error?: string }>
//   ts:      string          -- ISO-8601 timestamp
// }
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';

// Never cache the health endpoint — always get a live reading
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET() {
  const startMs = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  // --------------------------------------------------------------------------
  // 1. Database ping
  // --------------------------------------------------------------------------
  let dbOk = false;
  const dbStart = Date.now();
  try {
    // Raw SELECT 1 — cheapest possible query that exercises the connection pool
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    checks.database = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // --------------------------------------------------------------------------
  // 2. Redis ping (Upstash — non-fatal if not configured)
  // --------------------------------------------------------------------------
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  if (redisUrl) {
    const redisStart = Date.now();
    try {
      const res = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN ?? ''}` },
        signal: AbortSignal.timeout(2000),
      });
      const ok = res.ok;
      checks.redis = { ok, latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = { ok: false, latencyMs: Date.now() - redisStart, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // --------------------------------------------------------------------------
  // 3. Environment check — warn if no provider is configured
  // --------------------------------------------------------------------------
  const anyProviderKey = Boolean(
    process.env.REPLICATE_API_TOKEN ||
      process.env.FAL_KEY ||
      process.env.TOGETHER_API_KEY,
  );
  const comfyuiHost = process.env.COMFYUI_HOST ?? 'http://127.0.0.1:8188';

  const providersCheck: Record<string, unknown> = {
    ok: anyProviderKey || Boolean(comfyuiHost),
    keys: {
      replicate: !!process.env.REPLICATE_API_TOKEN,
      fal: !!process.env.FAL_KEY,
      together: !!process.env.TOGETHER_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      cohere: !!process.env.COHERE_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GOOGLE_AI_API_KEY,
      mistral: !!process.env.MISTRAL_API_KEY,
      hf: !!process.env.HF_TOKEN,
    },
  };
  checks.providers = providersCheck as { ok: boolean; latencyMs?: number; error?: string };

  // --------------------------------------------------------------------------
  // 4. Overall status
  // --------------------------------------------------------------------------
  const allOk = dbOk;
  const status = allOk ? 'ok' : 'degraded';

  const body = {
    status,
    version:    VERSION,
    uptime:     Math.round(process.uptime()),
    db:         dbOk ? 'ok' : 'error',
    checks,
    ts:         new Date().toISOString(),
    totalMs:    Date.now() - startMs,
  };

  return NextResponse.json(body, {
    status: allOk ? 200 : 503,
    headers: {
      // Prevent CDN / reverse-proxy from caching health responses
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma':        'no-cache',
    },
  });
}
