import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// POST /api/eral/plan
//
// Eral Director: proxies to Eral Worker /v1/generate to produce a structured
// asset generation plan from a project brief.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to use Eral Director.' }, { status: 401 });
  }

  const token = signEralToken(session.user);
  if (!token) {
    return NextResponse.json(
      { error: 'Eral service not configured (ERAL_JWT_SECRET missing)' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.projectBrief || typeof body.projectBrief !== 'string') {
    return NextResponse.json({ error: 'projectBrief is required' }, { status: 400 });
  }

  const eralRes = await fetch(`${ERAL_API}/v1/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
    body: JSON.stringify({
      type: 'docs',
      topic: body.projectBrief,
      context: body.mode ? `Studio mode: ${body.mode}` : undefined,
      tone: 'technical',
      length: 'long',
      product: 'wokgen',
    }),
  });

  const data = await eralRes.json() as { data?: { content?: string; model?: string }; error?: unknown };

  if (!eralRes.ok) {
    return NextResponse.json(data.error ?? data, { status: eralRes.status });
  }

  return NextResponse.json({
    plan: data.data?.content ?? '',
    model: data.data?.model ?? 'eral',
  });
}
