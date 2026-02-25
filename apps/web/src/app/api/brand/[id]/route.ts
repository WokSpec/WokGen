import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET    /api/brand/[id]   — get one kit
// PATCH  /api/brand/[id]   — update
// DELETE /api/brand/[id]   — delete
// ---------------------------------------------------------------------------

async function getKit(id: string, userId: string) {
  return dbQuery(prisma.brandKit.findFirst({ where: { id, userId } }));
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const kit = await getKit(id, session.user.id);
    if (!kit) return API_ERRORS.NOT_FOUND('Brand kit');
    return NextResponse.json({ kit });
  } catch (err) {
    log.error({ err }, 'GET /api/brand/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const existing = await getKit(id, session.user.id);
    if (!existing) return API_ERRORS.NOT_FOUND('Brand kit');

    const body = await req.json().catch(() => ({}));
    const { name, paletteJson, typography, styleGuide, industry, mood, projectId } = body;

    const data: Record<string, unknown> = {};
    if (name        !== undefined) data.name        = name;
    if (paletteJson !== undefined) data.paletteJson = JSON.stringify(paletteJson);
    if (typography  !== undefined) data.typography  = JSON.stringify(typography);
    if (styleGuide  !== undefined) data.styleGuide  = styleGuide;
    if (industry    !== undefined) data.industry    = industry;
    if (mood        !== undefined) data.mood        = mood;
    if (projectId   !== undefined) data.projectId   = projectId;

    const kit = await dbQuery(prisma.brandKit.update({ where: { id }, data }));
    await cache.del(`brand:${session.user.id}`);
    return NextResponse.json({ kit });
  } catch (err) {
    log.error({ err }, 'PATCH /api/brand/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const existing = await getKit(id, session.user.id);
    if (!existing) return API_ERRORS.NOT_FOUND('Brand kit');
    await dbQuery(prisma.brandKit.delete({ where: { id } }));
    await cache.del(`brand:${session.user.id}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/brand/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
