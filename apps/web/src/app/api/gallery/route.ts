import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

// GET /api/gallery — public gallery of shared assets
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
  const tool = searchParams.get('tool');

  const where = {
    isPublic: true,
    ...(tool ? { tool } : {}),
  };

  const [assets, total] = await Promise.all([
    prisma.generatedAsset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        url: true,
        format: true,
        tool: true,
        prompt: true,
        createdAt: true,
        width: true,
        height: true,
      },
    }),
    prisma.generatedAsset.count({ where }),
  ]);

  return NextResponse.json({
    assets,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

// PATCH /api/gallery — toggle public/private on own asset
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { assetId, isPublic } = await req.json();
  if (!assetId || typeof isPublic !== 'boolean') {
    return NextResponse.json({ error: 'assetId and isPublic required' }, { status: 400 });
  }

  const asset = await prisma.generatedAsset.findUnique({ where: { id: assetId } });
  if (!asset || asset.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updated = await prisma.generatedAsset.update({
    where: { id: assetId },
    data: { isPublic },
  });

  return NextResponse.json({ id: updated.id, isPublic: updated.isPublic });
}
