import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/workspaces/[id]/analytics
// Returns asset generation counts and tool usage for the workspace (project)
// Auth: project owner only
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const project = await dbQuery(prisma.project.findUnique({ where: { id: params.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Workspace');
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalJobs, jobs30d, toolBreakdown, recentActivity, memberCount] = await dbQuery(Promise.all([
      prisma.job.count({ where: { projectId: params.id } }),
      prisma.job.count({ where: { projectId: params.id, createdAt: { gte: last30Days } } }),
      prisma.job.groupBy({
        by: ['tool'],
        where: { projectId: params.id, createdAt: { gte: last30Days } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.activityEvent.findMany({
        where: { projectId: params.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, type: true, message: true, userId: true, createdAt: true },
      }),
      prisma.projectMember.count({ where: { projectId: params.id } }),
    ]));

    return NextResponse.json({
      totalJobs,
      jobs30d,
      memberCount,
      topTools: toolBreakdown.map(r => ({ tool: r.tool, count: r._count.id })),
      recentActivity,
    });
  } catch (err) {
    log.error({ err }, 'GET /api/workspaces/[id]/analytics failed');
    return API_ERRORS.INTERNAL();
  }
}
