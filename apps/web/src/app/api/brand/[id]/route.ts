import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { withErrorHandler } from '@/lib/api-handler';

// ---------------------------------------------------------------------------
// GET    /api/brand/[id]   — get one kit
// PATCH  /api/brand/[id]   — update
// DELETE /api/brand/[id]   — delete
// ---------------------------------------------------------------------------

async function getKit(id: string, userId: string) {
  return prisma.brandKit.findFirst({ where: { id, userId } });
}

export const GET = withErrorHandler(async (_req: NextRequest, ctx) => {
  const id = ctx?.params?.id ?? '';
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const kit = await getKit(id, session.user.id);
  if (!kit) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ kit });
});

export const PATCH = withErrorHandler(async (req: NextRequest, ctx) => {
  const id = ctx?.params?.id ?? '';
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const existing = await getKit(id, session.user.id);
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

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

  const kit = await prisma.brandKit.update({ where: { id }, data });
  await cache.del(`brand:${session.user.id}`);
  return NextResponse.json({ kit });
});

export const DELETE = withErrorHandler(async (_req: NextRequest, ctx) => {
  const id = ctx?.params?.id ?? '';
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const existing = await getKit(id, session.user.id);
  if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  await prisma.brandKit.delete({ where: { id } });
  await cache.del(`brand:${session.user.id}`);
  return NextResponse.json({ ok: true });
});
