import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET   /api/projects/[id]/brief   — get project brief
// PUT   /api/projects/[id]/brief   — create or replace project brief
// PATCH /api/projects/[id]/brief   — partial update
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const project = await dbQuery(prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    const brief = await dbQuery(prisma.projectBrief.findUnique({ where: { projectId: params.id } }));
    return NextResponse.json({ brief: brief ?? null });
  } catch (err) {
    log.error({ err }, 'GET /api/projects/[id]/brief failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return upsertBrief(req, params.id, false);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return upsertBrief(req, params.id, true);
}

async function upsertBrief(req: NextRequest, projectId: string, partial: boolean) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const project = await dbQuery(prisma.project.findFirst({ where: { id: projectId, userId: session.user.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }
    const body = rawBody as Record<string, unknown>;
    const {
      genre, artStyle, paletteJson, moodBoard,
      brandName, industry, colorHex, styleGuide, pinnedStyle,
    } = body;

    const data: Record<string, unknown> = {};
    if (!partial || genre        !== undefined) data.genre        = genre        ?? null;
    if (!partial || artStyle     !== undefined) data.artStyle     = artStyle     ?? null;
    if (!partial || paletteJson  !== undefined) data.paletteJson  = paletteJson  !== undefined ? JSON.stringify(paletteJson) : null;
    if (!partial || moodBoard    !== undefined) data.moodBoard    = moodBoard    !== undefined ? JSON.stringify(moodBoard)   : null;
    if (!partial || brandName    !== undefined) data.brandName    = brandName    ?? null;
    if (!partial || industry     !== undefined) data.industry     = industry     ?? null;
    if (!partial || colorHex     !== undefined) data.colorHex     = colorHex     ?? null;
    if (!partial || styleGuide   !== undefined) data.styleGuide   = styleGuide   ?? null;
    if (!partial || pinnedStyle  !== undefined) data.pinnedStyle  = pinnedStyle  !== undefined ? JSON.stringify(pinnedStyle) : null;

    const brief = await dbQuery(prisma.projectBrief.upsert({
      where:  { projectId },
      create: { projectId, ...data },
      update: data,
    }));

    return NextResponse.json({ brief });
  } catch (err) {
    log.error({ err }, `${partial ? 'PATCH' : 'PUT'} /api/projects/[id]/brief failed`);
    return API_ERRORS.INTERNAL();
  }
}
