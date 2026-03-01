import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// POST /api/notifications/mark-read
// Body: { ids: string[] }  — mark specific notifications as read
//   or: { all: true }      — mark all as read
// ---------------------------------------------------------------------------

const BodySchema = z.union([
  z.object({ ids: z.array(z.string()).min(1) }),
  z.object({ all: z.literal(true) }),
]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return API_ERRORS.UNAUTHORIZED();

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const body = parsed.data;

    if ('all' in body && body.all) {
      await dbQuery(prisma.notification.updateMany({
        where: { userId, read: false },
        data:  { read: true },
      }));
    } else if ('ids' in body) {
      await dbQuery(prisma.notification.updateMany({
        where: { userId, id: { in: body.ids }, read: false },
        data:  { read: true },
      }));
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'POST /api/notifications/mark-read failed');
    return API_ERRORS.INTERNAL();
  }
}
