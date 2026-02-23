import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/projects/[id]/activity
//
// Returns the project activity feed (paginated, newest first).
// Query params:
//   limit?  number (default: 30, max: 100)
//   cursor? string (cuid for keyset pagination)
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = params;
  const { searchParams }  = req.nextUrl;
  const limit  = Math.min(Number(searchParams.get('limit') ?? 30), 100);
  const cursor = searchParams.get('cursor') ?? undefined;

  // Verify project access
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true },
  });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  if (!process.env.SELF_HOSTED && project.userId !== userId) {
    // Allow if user is a project member
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId: userId! },
    });
    if (!membership) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const events = await prisma.activityEvent.findMany({
    take:    limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    where:   { projectId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:        true,
      type:      true,
      message:   true,
      userId:    true,
      refId:     true,
      createdAt: true,
    },
  });

  const hasMore    = events.length > limit;
  const trimmed    = hasMore ? events.slice(0, limit) : events;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  return NextResponse.json({
    events:     trimmed.map(e => ({ ...e, createdAt: e.createdAt.toISOString() })),
    nextCursor,
    hasMore,
  });
}

// ---------------------------------------------------------------------------
// POST /api/projects/[id]/activity
//
// Record an activity event for the project.
// Used internally by generation and export routes.
// Body: { type: string; message: string; refId?: string }
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: projectId } = params;

  let body: { type: string; message: string; refId?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, message, refId } = body;
  if (!type || !message) {
    return NextResponse.json({ error: 'type and message are required' }, { status: 400 });
  }

  const event = await prisma.activityEvent.create({
    data: { projectId, userId: userId ?? null, type, message, refId },
  });

  return NextResponse.json({ event: { ...event, createdAt: event.createdAt.toISOString() } });
}
