import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// ---------------------------------------------------------------------------
// GET /api/jobs
//
// Returns the current user's last 50 jobs ordered by createdAt desc.
// Requires authentication.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const jobs = await dbQuery(prisma.job.findMany({
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
    }));

    return NextResponse.json({ jobs });
  } catch (err) {
    log.error({ err }, 'GET /api/jobs failed');
    return API_ERRORS.INTERNAL();
  }
}
