/**
 * POST /api/v1/eral/chat
 * WokSDK v1 wrapper — authenticates via API key, forwards to /api/eral/chat.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit(`v1:eral:${apiUser.userId}`, 50, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rl.retryAfter },
      { status: 429, headers: { ...CORS_HEADERS, 'Retry-After': String(rl.retryAfter ?? 60) } },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: CORS_HEADERS });
  }

  const internalUrl = new URL('/api/eral/chat', req.url);
  const internalRes = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key-user-id': apiUser.userId,
      cookie: req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify(body),
  });

  const data = await internalRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: internalRes.status, headers: CORS_HEADERS });
}
