import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET /api/notifications  — last 10 unread notifications for the current user
// PATCH /api/notifications — mark all as read
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const notifications = await dbQuery(prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }));

    return NextResponse.json(notifications);
  } catch (err) {
    log.error({ err }, 'GET /api/notifications failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PATCH() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return API_ERRORS.UNAUTHORIZED();
    }

    await dbQuery(prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'PATCH /api/notifications failed');
    return API_ERRORS.INTERNAL();
  }
}
