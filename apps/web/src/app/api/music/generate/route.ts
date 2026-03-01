/**
 * POST /api/music/generate
 * Free background music generation via HuggingFace facebook/musicgen-small.
 * Requires authenticated session. Quota: 10 generations/day per free user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { musicgenGenerate } from '@/lib/providers/musicgen';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  prompt:   z.string().min(1).max(200),
  duration: z.number().int().min(1).max(30).optional().default(10),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  // Quota: 10 generations per day per user
  const today = new Date().toISOString().slice(0, 10);
  const rl = await checkRateLimit(`music-gen:${session.user.id}:${today}`, 10, 86_400_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Daily music generation quota reached (10/day). Try again tomorrow.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 86400) } },
    );
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!process.env.HF_TOKEN) {
    return NextResponse.json(
      { error: 'Music generation not configured. Set HF_TOKEN environment variable.' },
      { status: 503 },
    );
  }

  try {
    const result = await musicgenGenerate({
      prompt:   parsed.data.prompt,
      duration: parsed.data.duration,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Music generation failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
