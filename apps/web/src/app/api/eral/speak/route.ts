import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// POST /api/eral/speak
//
// Voice proxy: sends the spoken transcript to the Eral Worker and returns a
// concise text reply. The client is responsible for TTS playback.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';

const VOICE_CONTEXT =
  'Respond with a brief, conversational answer suitable for voice output. ' +
  'Keep your reply under 3 sentences. Avoid markdown, lists, and code blocks.';

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

  const message = (body.text ?? body.message ?? body.transcript ?? '') as string;
  if (!message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const eralRes = await fetch(`${ERAL_API}/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
    body: JSON.stringify({
      message,
      sessionId: (body.conversationId ?? body.sessionId ?? 'wokgen-voice') as string,
      product: 'wokgen',
      pageContext: VOICE_CONTEXT,
    }),
  });

  const data = await eralRes.json() as { data?: { response?: string; sessionId?: string; model?: string }; error?: unknown };

  if (!eralRes.ok) {
    return NextResponse.json(data.error ?? data, { status: eralRes.status });
  }

  return NextResponse.json({
    reply: data.data?.response ?? '',
    conversationId: data.data?.sessionId,
    model: data.data?.model ?? 'eral',
  });
}
