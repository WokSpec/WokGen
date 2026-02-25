/**
 * GET /api/v1/me
 * WokSDK v1 — returns user info for the authenticated API key owner.
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
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

  let user;
  try {
    user = await prisma.user.findUnique({
      where: { id: apiUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        subscription: { select: { planId: true, status: true } },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: CORS_HEADERS });
  }

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404, headers: CORS_HEADERS });
  }

  const planId = user.subscription?.planId ?? 'free';

  return NextResponse.json({
    id:    user.id,
    name:  user.name ?? '',
    email: user.email ?? '',
    plan:  planId,
    usage: {
      creditsUsed:        0,
      creditsLimit:       planId === 'free' ? 50 : 1000,
      generationsToday:   0,
    },
  }, { headers: CORS_HEADERS });
}
