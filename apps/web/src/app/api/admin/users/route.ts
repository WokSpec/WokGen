import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

async function guardAdmin() {
  const session = await auth();
  if (!session?.user?.id) return 'Unauthorized';
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) return 'Forbidden';
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/admin/users
//
// Query params:
//   limit?   number  (default: 50, max: 200)
//   offset?  number  (default: 0)
//   plan?    string  filter by planId
//   search?  string  email prefix search
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const deny = await guardAdmin();
  if (deny) return NextResponse.json({ error: deny }, { status: deny === 'Unauthorized' ? 401 : 403 });

  const { searchParams } = req.nextUrl;
  const limit  = Math.min(Number(searchParams.get('limit')  ?? 50), 200);
  const offset = Number(searchParams.get('offset') ?? 0);
  const plan   = searchParams.get('plan')   ?? undefined;
  const search = searchParams.get('search') ?? undefined;

  // Fetch users with their subscription plan and job count
  const users = await prisma.user.findMany({
    take: limit,
    skip: offset,
    orderBy: { createdAt: 'desc' },
    where: {
      ...(search ? { email: { startsWith: search, mode: 'insensitive' } } : {}),
    },
    select: {
      id:        true,
      email:     true,
      name:      true,
      createdAt: true,
      subscription: {
        select: { planId: true, currentPeriodEnd: true },
      },
      _count: { select: { jobs: true } },
      jobs: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      },
    },
  });

  const rows = users
    .filter(u => !plan || (u.subscription?.planId ?? 'free') === plan)
    .map(u => ({
      id:         u.id,
      email:      u.email ?? '',
      name:       u.name  ?? undefined,
      planId:     u.subscription?.planId ?? 'free',
      jobCount:   u._count.jobs,
      lastActive: u.jobs[0]?.createdAt?.toISOString() ?? null,
      createdAt:  u.createdAt.toISOString(),
    }));

  return NextResponse.json({ users: rows, total: rows.length });
}
