import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// POST /api/eral/chat
//
// Thin proxy to the Eral Worker — avoids CORS issues for WokGen clients and
// lets WokGen sign a service JWT on behalf of the authenticated user.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const eralRes = await fetch(`${ERAL_API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
    body: JSON.stringify({
      message: body.message ?? body.prompt,
      sessionId: body.conversationId ?? body.sessionId ?? 'wokgen-default',
      product: 'wokgen',
      pageContext: body.context != null
        ? JSON.stringify(body.context)
        : (body.studioContext as string | undefined),
    }),
  });

  const data = await eralRes.json() as { data?: { response?: string; sessionId?: string; model?: string }; error?: unknown };

  if (!eralRes.ok) {
    return NextResponse.json(data.error ?? data, { status: eralRes.status });
  }

  // Normalize to the shape WokGen clients expect
  return NextResponse.json({
    reply: data.data?.response ?? '',
    conversationId: data.data?.sessionId ?? body.conversationId ?? body.sessionId,
    model: data.data?.model ?? 'eral',
  });
}
