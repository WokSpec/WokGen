import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';

// ---------------------------------------------------------------------------
// PATCH  /api/automations/[id]  — update automation (name, enabled, template…)
// DELETE /api/automations/[id]  — delete automation
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

async function guardOwner(id: string, userId: string) {
  const auto = await prisma.automation.findUnique({ where: { id } });
  if (!auto) return null;
  if (auto.userId !== userId) return null;
  return auto;
}

export const PATCH = withErrorHandler(async (req: NextRequest, ctx) => {
  const id = ctx?.params?.id ?? '';
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const auto = await guardOwner(id, session.user.id);
  if (!auto) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name            === 'string')  data.name            = body.name.trim();
  if (typeof body.enabled         === 'boolean') data.enabled         = body.enabled;
  if (typeof body.schedule        === 'string')  data.schedule        = body.schedule.trim();
  if (typeof body.targetType      === 'string')  data.targetType      = body.targetType;
  if (typeof body.targetValue     === 'string')  data.targetValue     = body.targetValue || null;
  if (typeof body.messageTemplate === 'string')  data.messageTemplate = body.messageTemplate.trim();

  const updated = await prisma.automation.update({ where: { id }, data });
  return NextResponse.json({ automation: updated });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx) => {
  const id = ctx?.params?.id ?? '';
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const auto = await guardOwner(id, session.user.id);
  if (!auto) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.automation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
