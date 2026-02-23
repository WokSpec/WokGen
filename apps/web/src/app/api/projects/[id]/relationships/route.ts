import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

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
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const relationships = await prisma.assetRelationship.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ relationships });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { fromJobId, toJobId, type } = body ?? {};

  if (!fromJobId || !toJobId || !type) {
    return NextResponse.json({ error: 'fromJobId, toJobId, and type are required.' }, { status: 400 });
  }
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 400 });
  }
  if (fromJobId === toJobId) {
    return NextResponse.json({ error: 'Cannot link an asset to itself.' }, { status: 400 });
  }

  // Verify both jobs belong to this project and this user
  const [from, to] = await Promise.all([
    prisma.job.findFirst({ where: { id: fromJobId, projectId: params.id, userId: session.user.id } }),
    prisma.job.findFirst({ where: { id: toJobId, projectId: params.id, userId: session.user.id } }),
  ]);
  if (!from || !to) {
    return NextResponse.json({ error: 'One or both jobs not found in this project.' }, { status: 404 });
  }

  const rel = await prisma.assetRelationship.upsert({
    where: { fromJobId_toJobId_type: { fromJobId, toJobId, type } },
    create: { projectId: params.id, fromJobId, toJobId, type },
    update: {},
  });
  return NextResponse.json({ relationship: rel }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const relId = new URL(req.url).searchParams.get('id');
  if (!relId) return NextResponse.json({ error: 'id query param required.' }, { status: 400 });

  await prisma.assetRelationship.deleteMany({ where: { id: relId, projectId: params.id } });
  return NextResponse.json({ ok: true });
}
