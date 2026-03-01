import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { signEralToken } from '@/lib/eral-token';

// ---------------------------------------------------------------------------
// /api/eral/memory — proxy to Eral Worker chat session memory
//
//   GET  ?sessionId=xxx → GET  /v1/chat/:sessionId  (retrieve session messages)
//   GET  (no sessionId) → GET  /v1/chat/sessions    (list all sessions)
//   DELETE ?sessionId=xxx → DELETE /v1/chat/:sessionId (clear session memory)
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const ERAL_API = process.env.ERAL_API_URL ?? 'https://eral.wokspec.org/api';

async function makeEralRequest(
  url: string,
  method: string,
  token: string,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Eral-Source': 'wokgen',
    },
  });
}

export async function GET(req: NextRequest) {
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

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const url = sessionId
    ? `${ERAL_API}/v1/chat/${encodeURIComponent(sessionId)}`
    : `${ERAL_API}/v1/chat/sessions`;

  const eralRes = await makeEralRequest(url, 'GET', token);
  const data = await eralRes.json();
  return NextResponse.json(data, { status: eralRes.status });
}

export async function DELETE(req: NextRequest) {
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

  const sessionId =
    req.nextUrl.searchParams.get('sessionId') ??
    (await req.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>)?.sessionId as string | undefined;

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const eralRes = await makeEralRequest(
    `${ERAL_API}/v1/chat/${encodeURIComponent(sessionId)}`,
    'DELETE',
    token,
  );
  const data = await eralRes.json();
  return NextResponse.json(data, { status: eralRes.status });
}
