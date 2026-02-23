import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserPlanId, PER_MIN_RATE } from '@/lib/quota';

// ---------------------------------------------------------------------------
// POST /api/generate/batch
//
// Accepts an array of generation params (max 16) and fans them out to
// POST /api/generate one-by-one with a short delay between requests.
// Returns an array of { index, jobId?, error? } results.
//
// Quota: Each item in the batch consumes quota independently (same as
// sending separate requests). Batch itself requires auth (no guest batch).
//
// The per-item limit is enforced by the underlying /api/generate route.
// This route validates count, tier access, and orchestrates the fan-out.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const BATCH_LIMITS: Record<string, number> = {
  free:  1,    // free users can't batch (use sequential single gen)
  plus:  4,
  pro:   16,
  max:   16,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to use batch generation.' }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit: batch counts as 1 batch call per minute
  const planId  = await getUserPlanId(userId);
  const maxRate = PER_MIN_RATE[planId] ?? PER_MIN_RATE.free;
  const rl = await checkRateLimit(`batch:${userId}`, Math.max(1, Math.floor(maxRate / 4)), 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many batch requests. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 60) } },
    );
  }

  const maxItems = BATCH_LIMITS[planId] ?? 1;
  if (maxItems <= 1) {
    return NextResponse.json({ error: 'Upgrade to Plus or higher to use batch generation.' }, { status: 403 });
  }

  let body: { items: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { items } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: '"items" must be a non-empty array.' }, { status: 400 });
  }
  if (items.length > maxItems) {
    return NextResponse.json(
      { error: `Your plan supports up to ${maxItems} items per batch. Got ${items.length}.` },
      { status: 400 },
    );
  }

  // Build the host origin so we can call our own /api/generate
  const origin = new URL(req.url).origin;

  // Forward the auth cookie header so /api/generate can authenticate the user
  const cookieHeader = req.headers.get('cookie') ?? '';

  const results: Array<{ index: number; jobId?: string; status?: string; error?: string }> = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const res = await fetch(`${origin}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': cookieHeader,
          // Propagate real IP for rate limiting consistency
          'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? '',
        },
        body: JSON.stringify(items[i]),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        results.push({ index: i, error: data.error ?? `HTTP ${res.status}` });
      } else {
        results.push({ index: i, jobId: data.jobId, status: data.status });
      }
    } catch (err) {
      results.push({ index: i, error: err instanceof Error ? err.message : 'Network error' });
    }

    // Small delay between items to avoid hammering providers
    if (i < items.length - 1) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  const succeeded = results.filter(r => !r.error).length;
  const failed    = results.filter(r =>  r.error).length;

  return NextResponse.json({ results, succeeded, failed, total: items.length });
}
