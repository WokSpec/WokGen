import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const auto = await prisma.automation.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true, targetType: true, targetValue: true, name: true },
  });

  if (!auto) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (auto.targetType !== 'webhook') {
    return NextResponse.json({ error: 'Only webhook automations can be tested' }, { status: 400 });
  }
  if (!auto.targetValue) {
    return NextResponse.json({ error: 'No webhook URL configured' }, { status: 400 });
  }

  try {
    const res = await fetch(auto.targetValue, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'WokGen-Webhook/1.0' },
      body: JSON.stringify({
        event: 'test',
        automation: auto.name,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
