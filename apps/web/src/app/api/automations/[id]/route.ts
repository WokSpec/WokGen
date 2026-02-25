import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// PATCH  /api/automations/[id]  — update automation (name, enabled, template…)
// DELETE /api/automations/[id]  — delete automation
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

async function guardOwner(id: string, userId: string) {
  const auto = await dbQuery(prisma.automation.findUnique({ where: { id } }));
  if (!auto) return null;
  if (auto.userId !== userId) return null;
  return auto;
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const auto = await guardOwner(id, session.user.id);
    if (!auto) return API_ERRORS.NOT_FOUND('Automation');

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (typeof body.name            === 'string')  data.name            = body.name.trim();
    if (typeof body.enabled         === 'boolean') data.enabled         = body.enabled;
    if (typeof body.schedule        === 'string')  data.schedule        = body.schedule.trim();
    if (typeof body.targetType      === 'string')  data.targetType      = body.targetType;
    if (typeof body.targetValue     === 'string')  data.targetValue     = body.targetValue || null;
    if (typeof body.messageTemplate === 'string')  data.messageTemplate = body.messageTemplate.trim();

    const updated = await dbQuery(prisma.automation.update({ where: { id }, data }));
    return NextResponse.json({ automation: updated });
  } catch (err) {
    log.error({ err }, 'PATCH /api/automations/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const auto = await guardOwner(id, session.user.id);
    if (!auto) return API_ERRORS.NOT_FOUND('Automation');

    await dbQuery(prisma.automation.delete({ where: { id } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/automations/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
