import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET    /api/projects/[id]/relationships   — list edges
// POST   /api/projects/[id]/relationships   — create edge
// DELETE /api/projects/[id]/relationships   — remove edge (?id=relationshipId)
// ---------------------------------------------------------------------------

const VALID_TYPES = ['variation', 'animation_of', 'enemy_of', 'tileset_for', 'same_palette', 'brand_use'];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const project = await dbQuery(prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    const relationships = await dbQuery(prisma.assetRelationship.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }));
    return NextResponse.json({ relationships });
  } catch (err) {
    log.error({ err }, 'GET /api/projects/[id]/relationships failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const project = await dbQuery(prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }
    const { fromJobId, toJobId, type } = (rawBody ?? {}) as { fromJobId?: string; toJobId?: string; type?: string };

    if (!fromJobId || !toJobId || !type) {
      return API_ERRORS.BAD_REQUEST('fromJobId, toJobId, and type are required.');
    }
    if (!VALID_TYPES.includes(type)) {
      return API_ERRORS.BAD_REQUEST(`type must be one of: ${VALID_TYPES.join(', ')}`);
    }
    if (fromJobId === toJobId) {
      return API_ERRORS.BAD_REQUEST('Cannot link an asset to itself.');
    }

    // Verify both jobs belong to this project and this user
    const [from, to] = await Promise.all([
      dbQuery(prisma.job.findFirst({ where: { id: fromJobId, projectId: params.id, userId: session.user.id } })),
      dbQuery(prisma.job.findFirst({ where: { id: toJobId, projectId: params.id, userId: session.user.id } })),
    ]);
    if (!from || !to) {
      return API_ERRORS.NOT_FOUND('One or both jobs not found in this project.');
    }

    const rel = await dbQuery(prisma.assetRelationship.upsert({
      where: { fromJobId_toJobId_type: { fromJobId, toJobId, type } },
      create: { projectId: params.id, fromJobId, toJobId, type },
      update: {},
    }));
    return NextResponse.json({ relationship: rel }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/projects/[id]/relationships failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const project = await dbQuery(prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    const relId = new URL(req.url).searchParams.get('id');
    if (!relId) return API_ERRORS.BAD_REQUEST('id query param required.');

    await dbQuery(prisma.assetRelationship.deleteMany({ where: { id: relId, projectId: params.id } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/projects/[id]/relationships failed');
    return API_ERRORS.INTERNAL();
  }
}
