import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/assets/[id]
//
// Returns a single public gallery asset by ID.
// Used for /community/[id] shareable asset pages.
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const id = ctx?.params?.id ?? '';

    if (!id) {
      return API_ERRORS.BAD_REQUEST('Asset ID is required');
    }

    const asset = await dbQuery(prisma.galleryAsset.findUnique({
      where:  { id },
      select: {
        id:        true,
        jobId:     true,
        title:     true,
        prompt:    true,
        tool:      true,
        rarity:    true,
        imageUrl:  true,
        tags:      true,
        isPublic:  true,
        createdAt: true,
        job:       { select: { provider: true, seed: true, width: true, height: true } },
      },
    }));

    if (!asset) {
      return API_ERRORS.NOT_FOUND('Asset');
    }

    if (!asset.isPublic) {
      return NextResponse.json({ error: 'Asset is not public' }, { status: 403 });
    }

    return NextResponse.json({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
    }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    log.error({ err }, 'GET /api/assets/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
