/**
 * POST /api/tools/interrogate
 * Reverse-engineers a generation prompt from an image using BLIP + optional Gemini.
 * Requires authenticated session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { interrogateImage } from '@/lib/interrogator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Schema = z.object({
  imageUrl: z.string().url('Must be a valid URL'),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  if (!process.env.HF_TOKEN) {
    return NextResponse.json(
      { error: 'Image interrogation not configured. Set HF_TOKEN environment variable.' },
      { status: 503 },
    );
  }

  try {
    const result = await interrogateImage(parsed.data.imageUrl);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Interrogation failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
