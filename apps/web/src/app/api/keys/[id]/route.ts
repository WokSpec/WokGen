import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// DELETE /api/keys/[id]  — revoke a key
// PATCH  /api/keys/[id]  — rename a key
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

interface Ctx { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id && !process.env.SELF_HOSTED) {
      return API_ERRORS.UNAUTHORIZED();
    }
    const userId = session?.user?.id ?? 'self-hosted';

    const key = await dbQuery(prisma.apiKey.findUnique({ where: { id: params.id } }));
    if (!key || key.userId !== userId) {
      return API_ERRORS.NOT_FOUND('Key');
    }

    await dbQuery(prisma.apiKey.update({ where: { id: params.id }, data: { isActive: false } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/keys/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const session = await auth();
    if (!session?.user?.id && !process.env.SELF_HOSTED) {
      return API_ERRORS.UNAUTHORIZED();
    }
    const userId = session?.user?.id ?? 'self-hosted';

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === 'string' ? body.name.trim() : null;
    if (!name) return API_ERRORS.BAD_REQUEST('name is required.');

    const key = await dbQuery(prisma.apiKey.findUnique({ where: { id: params.id } }));
    if (!key || key.userId !== userId) {
      return API_ERRORS.NOT_FOUND('Key');
    }

    const updated = await dbQuery(prisma.apiKey.update({ where: { id: params.id }, data: { name } }));
    return NextResponse.json({ key: updated });
  } catch (err) {
    log.error({ err }, 'PATCH /api/keys/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
