import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/jobs
//
// Returns the current user's last 50 jobs ordered by createdAt desc.
// Requires authentication.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  void req;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take:    50,
    select: {
      id:         true,
      status:     true,
      tool:       true,
      provider:   true,
      prompt:     true,
      resultUrl:  true,
      resultUrls: true,
      width:      true,
      height:     true,
      seed:       true,
      createdAt:  true,
      userRating: true,
    },
  });

  return NextResponse.json({ jobs });
}
