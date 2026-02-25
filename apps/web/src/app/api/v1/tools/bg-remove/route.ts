/**
 * POST /api/v1/tools/bg-remove
 * WokSDK v1 wrapper — authenticates via API key, forwards to /api/tools/bg-remove.
 * SDK sends { url: imageUrl }, internal route expects { imageUrl }.
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

  let body: { url?: string; imageUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // SDK sends { url }, internal route expects { imageUrl }
  const imageUrl = body.imageUrl ?? body.url;
  if (!imageUrl) {
    return NextResponse.json({ error: 'imageUrl or url is required' }, { status: 400 });
  }

  const internalUrl = new URL('/api/tools/bg-remove', req.url);
  const internalRes = await fetch(internalUrl.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key-user-id': apiUser.userId,
      cookie: req.headers.get('cookie') ?? '',
    },
    body: JSON.stringify({ imageUrl }),
  });

  const data = await internalRes.json().catch(() => ({}));
  return NextResponse.json(data, { status: internalRes.status });
}
