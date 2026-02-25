import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { getWorkspaceLimit, getUserPlanId } from '@/lib/plan-limits';

const VALID_MODES = new Set(['pixel', 'business', 'vector', 'emoji', 'uiux']);

// GET /api/workspaces?mode=pixel
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const mode = req.nextUrl.searchParams.get('mode') ?? '';
    if (!VALID_MODES.has(mode)) {
      return API_ERRORS.BAD_REQUEST('Invalid mode');
    }

    const workspaces = await dbQuery(prisma.project.findMany({
      where:   { userId: session.user.id, mode, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { jobs: true } } },
    }));

    return NextResponse.json({
      workspaces: workspaces.map(w => ({
        id:        w.id,
        name:      w.name,
        mode:      w.mode,
        jobCount:  w._count.jobs,
        createdAt: w.createdAt.toISOString(),
        updatedAt: w.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    log.error({ err }, 'GET /api/workspaces failed');
    return API_ERRORS.INTERNAL();
  }
}

// POST /api/workspaces
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }
    const body = rawBody as { name?: string; mode?: string };
    const name = (body.name ?? '').trim();
    const mode = (body.mode ?? '').trim();

    if (!name || name.length > 40) {
      return API_ERRORS.BAD_REQUEST('Workspace name must be 1–40 characters');
    }
    if (!VALID_MODES.has(mode)) {
      return API_ERRORS.BAD_REQUEST('Invalid mode');
    }

    const userId = session.user.id;

    // Enforce plan limit
    const [limit, planId, existingCount] = await Promise.all([
      getWorkspaceLimit(userId),
      getUserPlanId(userId),
      dbQuery(prisma.project.count({ where: { userId, mode, isArchived: false } })),
    ]);

    if (existingCount >= limit) {
      return NextResponse.json(
        {
          error:   `Workspace limit reached (${existingCount}/${limit}). Upgrade to unlock more.`,
          limit,
          plan:    planId,
          current: existingCount,
        },
        { status: 403 },
      );
    }

    const workspace = await dbQuery(prisma.project.create({
      data: { userId, mode, name },
      include: { _count: { select: { jobs: true } } },
    }));

    return NextResponse.json({
      workspace: {
        id:        workspace.id,
        name:      workspace.name,
        mode:      workspace.mode,
        jobCount:  workspace._count.jobs,
        createdAt: workspace.createdAt.toISOString(),
      },
    });
  } catch (err) {
    log.error({ err }, 'POST /api/workspaces failed');
    return API_ERRORS.INTERNAL();
  }
}
