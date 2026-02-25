/**
 * GET /api/v1/assets
 * WokSDK v1 — lists assets for the authenticated API key owner.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiUser = await authenticateApiKey(req);
  if (!apiUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page    = Math.max(1, Number(searchParams.get('page')    ?? '1'));
  const perPage = Math.min(100, Math.max(1, Number(searchParams.get('perPage') ?? '24')));
  const mode    = searchParams.get('mode') ?? undefined;

  const where: Record<string, unknown> = { job: { userId: apiUser.userId } };
  if (mode) where.mode = mode;

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

  return NextResponse.json({ assets, total });
}
