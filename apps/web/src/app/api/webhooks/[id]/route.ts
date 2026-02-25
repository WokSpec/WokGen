import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/webhooks/[id] — delete a webhook
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return API_ERRORS.UNAUTHORIZED();

    const webhook = await dbQuery(prisma.webhook.findUnique({ where: { id: params.id } }));
    if (!webhook || webhook.userId !== userId) {
      return API_ERRORS.NOT_FOUND('Webhook');
    }

    await dbQuery(prisma.webhook.delete({ where: { id: params.id } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/webhooks/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
