import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-handler';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/assets/[id]
//
// Returns a single public gallery asset by ID.
// Used for /community/[id] shareable asset pages.
// ---------------------------------------------------------------------------
export const GET = withErrorHandler(async (
  _req: NextRequest,
  ctx,
) => {
  const id = ctx?.params?.id ?? '';

  if (!id) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }

  const asset = await prisma.galleryAsset.findUnique({
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
  });

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
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
});
