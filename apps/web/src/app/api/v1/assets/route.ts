/**
 * GET /api/v1/assets
 * WokSDK v1 — lists assets for the authenticated API key owner.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, hasScope } from '@/lib/api-key-auth';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasScope(apiUser.scopes, 'read:assets')) {
    return NextResponse.json({ error: 'Forbidden: read:assets scope required' }, { status: 403, headers: CORS_HEADERS });
  }

  const { searchParams } = req.nextUrl;
  const page    = Math.max(1, Number(searchParams.get('page')    ?? '1'));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage') ?? '24')));
  const mode    = searchParams.get('mode') ?? undefined;

  const where: Record<string, unknown> = { job: { userId: apiUser.userId } };
  if (mode) where.mode = mode;

  try {
    const [assets, total] = await Promise.all([
      prisma.galleryAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:  (page - 1) * perPage,
        take:  perPage,
        select: {
          id:        true,
          imageUrl:  true,
          prompt:    true,
          mode:      true,
          createdAt: true,
        },
      }),
      prisma.galleryAsset.count({ where }),
    ]);

    return NextResponse.json({ assets, total }, { headers: CORS_HEADERS });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }
}
