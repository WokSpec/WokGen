import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET  /api/projects/[id]/assets   — all jobs + relationship edges
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const [jobs, relationships] = await Promise.all([
    prisma.job.findMany({
      where: { projectId: params.id, status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, tool: true, mode: true, prompt: true,
        resultUrl: true, provider: true, createdAt: true,
        assetTags: { select: { tag: true } },
      },
    }),
    prisma.assetRelationship.findMany({
      where: { projectId: params.id },
      take: 50,
      select: { id: true, fromJobId: true, toJobId: true, type: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ jobs, relationships });
}
