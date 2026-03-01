import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/notifications  — list notifications with filter/pagination support
//   ?count=true           — returns { unread: number } (used by bell)
//   ?filter=all|unread|system|generations|social  ?page=1
// PATCH /api/notifications — mark all as read
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

const TYPE_GROUPS: Record<string, string[]> = {
  generations: ['generation_complete', 'generation_failed', 'batch_complete', 'quota_warning', 'quota_exhausted'],
  system:      ['system', 'new_feature', 'billing', 'automation_ran'],
  social:      ['social', 'level_up', 'project_invite', 'team_joined', 'director_plan_complete'],
};

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return API_ERRORS.UNAUTHORIZED();

    const { searchParams } = new URL(req.url);

    // Bell count-only mode
    if (searchParams.get('count') === 'true') {
      const unread = await dbQuery(prisma.notification.count({ where: { userId, read: false } }));
      return NextResponse.json({ unread });
    }

    const filter = searchParams.get('filter') ?? 'all';
    const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const skip   = (page - 1) * PAGE_SIZE;

    type WhereClause = { userId: string; read?: boolean; type?: { in: string[] } };
    const where: WhereClause = { userId };
    if (filter === 'unread') where.read = false;
    else if (filter in TYPE_GROUPS) where.type = { in: TYPE_GROUPS[filter] };

    const [notifications, total, unread] = await Promise.all([
      dbQuery(prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: PAGE_SIZE, skip })),
      dbQuery(prisma.notification.count({ where })),
      dbQuery(prisma.notification.count({ where: { userId, read: false } })),
    ]);

    return NextResponse.json({ notifications, total, unread });
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
