import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/webhooks/user — list all webhooks for the current user
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const webhooks = await prisma.webhook.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      lastStatus: true,
      lastTriggeredAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ webhooks });
}

// POST /api/webhooks/user — create a new webhook
export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { url, events } = body as { url?: string; events?: string };

  if (!url || !events) {
    return NextResponse.json({ error: 'url and events are required' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const secret = randomBytes(32).toString('hex');

  const webhook = await prisma.webhook.create({
    data: { userId, url, events, secret },
    select: {
      id: true,
      url: true,
      events: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ webhook, secret }, { status: 201 });
}
