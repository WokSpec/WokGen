/**
 * POST /api/v1/eral/chat
 * WokSDK v1 wrapper — authenticates via API key, forwards to /api/eral/chat.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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
  return NextResponse.json(data, { status: internalRes.status });
}
