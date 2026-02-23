import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/jobs/[id]/comments
//
// Returns all comments on a job/asset.
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id: jobId } = params;

  const comments = await prisma.assetComment.findMany({
    where:   { jobId },
    orderBy: { createdAt: 'asc' },
    select: {
      id:        true,
      userId:    true,
      content:   true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    comments: comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
  });
}

// ---------------------------------------------------------------------------
// POST /api/jobs/[id]/comments
//
// Add a comment to an asset. Requires auth.
// Body: { content: string }
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

  const { id: jobId } = params;

  let body: { content: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const content = (body.content ?? '').trim();
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
  }

  // Verify job exists
  const job = await prisma.job.findUnique({
    where:  { id: jobId },
    select: { id: true },
  });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const comment = await prisma.assetComment.create({
    data: { jobId, userId: userId!, content },
    select: { id: true, userId: true, content: true, createdAt: true },
  });

  return NextResponse.json({
    comment: { ...comment, createdAt: comment.createdAt.toISOString() },
  }, { status: 201 });
}

// ---------------------------------------------------------------------------
// DELETE /api/jobs/[id]/comments  (body: { commentId: string })
//
// Delete own comment.
// ---------------------------------------------------------------------------
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId  = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: jobId } = params;

  let body: { commentId: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const comment = await prisma.assetComment.findFirst({
    where: { id: body.commentId, jobId, userId },
  });
  if (!comment) return NextResponse.json({ error: 'Comment not found or not yours' }, { status: 404 });

  await prisma.assetComment.delete({ where: { id: comment.id } });
  return NextResponse.json({ ok: true });
}
