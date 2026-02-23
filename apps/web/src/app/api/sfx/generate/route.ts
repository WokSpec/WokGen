// POST /api/sfx/generate
// Generates sound effects using ElevenLabs Sound Generation API
// Tier limits: guest=2/day, free=3/day, plus=20/day, pro/max=unlimited

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserPlanId, PER_MIN_RATE } from '@/lib/quota';
import { log as logger } from '@/lib/logger';

export const maxDuration = 60;
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Daily SFX limits by tier (-1 = unlimited)
const SFX_DAILY_LIMIT: Record<string, number> = {
  guest: 2,
  free:  3,
  plus:  20,
  pro:   -1,
  max:   -1,
};

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  const userId  = session?.user?.id ?? null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';

  // ── Rate limit ────────────────────────────────────────────────────────────
  const planId  = userId ? await getUserPlanId(userId) : 'guest';
  const tier    = userId ? planId : 'guest';
  const perMinMax = tier === 'guest' ? 2 : (PER_MIN_RATE[tier] >= 15 ? 15 : 5);
  const rlKey   = userId ? `sfx:user:${userId}` : `sfx:ip:${ip}`;

  const rl = await checkRateLimit(rlKey, perMinMax, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rl.retryAfter },
      { status: 429, headers: rl.retryAfter ? { 'Retry-After': String(rl.retryAfter) } : {} },
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { prompt?: unknown; duration?: unknown; promptInfluence?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (prompt.length < 3) {
    return NextResponse.json({ error: 'Prompt must be at least 3 characters' }, { status: 400 });
  }
  if (prompt.length > 500) {
    return NextResponse.json({ error: 'Prompt must be 500 characters or less' }, { status: 400 });
  }

  const rawDuration = typeof body.duration === 'number' ? body.duration : 2.0;
  const duration    = Math.min(22, Math.max(0.5, rawDuration));

  const rawInfluence    = typeof body.promptInfluence === 'number' ? body.promptInfluence : 0.6;
  const promptInfluence = Math.min(1, Math.max(0, rawInfluence));

  // ── Daily SFX quota (authenticated users only) ────────────────────────────
  const dailyLimit = SFX_DAILY_LIMIT[tier] ?? SFX_DAILY_LIMIT.free;
  if (dailyLimit !== -1 && userId) {
    const today   = utcToday();
    const todayStart = new Date(today + 'T00:00:00.000Z');
    const used    = await prisma.sfxJob.count({
      where: { userId, createdAt: { gte: todayStart } },
    }).catch(() => 0);

    if (used >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily SFX limit reached (${dailyLimit}/day on ${tier} plan)`, code: 'SFX_QUOTA_EXCEEDED' },
        { status: 429 },
      );
    }
  }

  // ── Call ElevenLabs ───────────────────────────────────────────────────────
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Sound generation requires ElevenLabs API key', code: 'NO_SFX_PROVIDER' },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 30_000);

  let audioBase64: string;
  try {
    const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
      method:  'POST',
      headers: {
        'xi-api-key':   apiKey,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text:             prompt,
        duration_seconds: duration,
        prompt_influence: promptInfluence,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      logger.error({ err: errText, status: res.status }, '[sfx/generate] ElevenLabs error');
      return NextResponse.json(
        { error: 'Sound generation failed', code: 'SFX_PROVIDER_ERROR' },
        { status: 502 },
      );
    }

    const buffer = await res.arrayBuffer();
    audioBase64  = Buffer.from(buffer).toString('base64');
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      return NextResponse.json({ error: 'Sound generation timed out' }, { status: 504 });
    }
    logger.error({ err }, '[sfx/generate] Fetch error');
    return NextResponse.json(
      { error: 'Sound generation requires ElevenLabs API key', code: 'NO_SFX_PROVIDER' },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }

  // ── Save to DB (best-effort) ───────────────────────────────────────────────
  prisma.sfxJob.create({
    data: { userId, prompt, durationSeconds: duration, provider: 'elevenlabs' },
  }).catch(() => {});

  return NextResponse.json({
    audioBase64,
    mimeType:        'audio/mpeg',
    prompt,
    durationSeconds: duration,
    provider:        'elevenlabs',
  });
}
