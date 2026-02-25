import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkSsrf } from '@/lib/ssrf-check';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/[id]/test — send a test payload to a webhook
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhook = await prisma.webhook.findUnique({ where: { id: params.id } });
  if (!webhook || webhook.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ssrf = checkSsrf(webhook.url, true);
  if (!ssrf.ok) return NextResponse.json({ error: `Blocked: ${ssrf.reason}` }, { status: 400 });

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WokGen-Event': 'test' },
      body: JSON.stringify({ type: 'test', userId, sentAt: new Date().toISOString() }),
    });
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastStatus: res.ok ? 'ok' : `${res.status}`, lastTriggeredAt: new Date() },
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: { lastStatus: 'error', lastTriggeredAt: new Date() },
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
