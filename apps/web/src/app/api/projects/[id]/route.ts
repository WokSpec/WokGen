import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET    /api/projects/[id] — get project + recent jobs
// PATCH  /api/projects/[id] — rename or archive (mode is immutable)
// DELETE /api/projects/[id] — delete project + cascade jobs
// ---------------------------------------------------------------------------

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({ where: { id, userId } });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const project = await getProject(params.id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  const jobs = await prisma.job.findMany({
    where:   { projectId: params.id },
    orderBy: { createdAt: 'desc' },
    take:    50,
    select: {
      id: true, tool: true, status: true, provider: true, prompt: true,
      width: true, height: true, resultUrl: true, isPublic: true, createdAt: true,
    },
  });

  const recentAssets = await prisma.galleryAsset.findMany({
    where: { job: { projectId: params.id, userId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { job: { select: { prompt: true, mode: true } } },
  });

  return NextResponse.json({ project, jobs, recentAssets });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const project = await getProject(params.id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  // mode is immutable — strip it from update payload
  const { name, description, isArchived } = body;

  const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      ...(typeof name === 'string' && name.trim() ? { name: name.trim() } : {}),
      ...(typeof description === 'string' ? { description: description.trim() || null } : {}),
      ...(typeof isArchived === 'boolean' ? { isArchived } : {}),
    },
  });

  prisma.activityEvent.create({
    data: {
      projectId: params.id,
      userId: session.user.id,
      type: 'project.updated',
      message: `Project updated`,
    },
  }).catch(() => {});

  return NextResponse.json({ project: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const project = await getProject(params.id, session.user.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
