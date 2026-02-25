import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// GET /api/gallery/search
//
// Full-text search over public gallery assets.
//
// Query params:
//   q       string  (required, min 2 chars)
//   mode?   string  filter by product line
//   tool?   string  filter by tool
//   limit?  number  (default: 24, max: 100)
//   cursor? string  keyset pagination cursor
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q      = (searchParams.get('q') ?? '').trim();
    const mode   = searchParams.get('mode')   ?? undefined;
    const tool   = searchParams.get('tool')   ?? undefined;
    const limit  = Math.min(Number(searchParams.get('limit') ?? 24), 100);
    const cursor = searchParams.get('cursor') ?? undefined;

    if (q.length < 2) return API_ERRORS.BAD_REQUEST('Search query must be at least 2 characters');

    const assets = await dbQuery(prisma.galleryAsset.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      where: {
        isPublic: true,
        AND: [
          {
            OR: [
              { prompt: { contains: q, mode: 'insensitive' } },
              { title:  { contains: q, mode: 'insensitive' } },
              { tags:   { contains: q.toLowerCase(), mode: 'insensitive' } },
            ],
          },
          ...(mode ? [{ tool: { startsWith: mode } }] : []),
          ...(tool ? [{ tool }]                       : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id:        true,
        jobId:     true,
        title:     true,
        prompt:    true,
        tool:      true,
        rarity:    true,
        imageUrl:  true,
        tags:      true,
        createdAt: true,
      },
    }));

    const hasMore    = assets.length > limit;
    const trimmed    = hasMore ? assets.slice(0, limit) : assets;
    const nextCursor = hasMore ? trimmed[trimmed.length - 1]?.id ?? null : null;

    return NextResponse.json({
      assets: trimmed.map(a => ({
        ...a,
        tags:      (() => { try { return a.tags ? JSON.parse(a.tags) : []; } catch { return []; } })(),
        createdAt: a.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
      total: trimmed.length,
      query: q,
    }, {
      headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=30' },
    });
  } catch (err) {
    log.error({ err }, 'GET /api/gallery/search failed');
    return API_ERRORS.INTERNAL();
  }
}
