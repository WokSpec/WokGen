import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET  /api/projects/[id]/assets   — all jobs + relationship edges
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const project = await dbQuery(prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
    }));
    if (!project) return API_ERRORS.NOT_FOUND('Project');

    const [jobs, relationships] = await Promise.all([
      dbQuery(prisma.job.findMany({
        where: { projectId: params.id, status: 'succeeded' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true, tool: true, mode: true, prompt: true,
          resultUrl: true, provider: true, createdAt: true,
          assetTags: { select: { tag: true } },
        },
      })),
      dbQuery(prisma.assetRelationship.findMany({
        where: { projectId: params.id },
        take: 50,
        select: { id: true, fromJobId: true, toJobId: true, type: true, createdAt: true },
      })),
    ]);

    return NextResponse.json({ jobs, relationships });
  } catch (err) {
    log.error({ err }, 'GET /api/projects/[id]/assets failed');
    return API_ERRORS.INTERNAL();
  }
}
