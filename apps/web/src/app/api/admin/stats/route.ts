import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard: must be authenticated and admin
  const adminResult = await requireAdmin();
  if (isAdminResponse(adminResult)) return adminResult;

  const CACHE_KEY = 'wokgen:admin:stats';
  const cached = await cache.get<object>(CACHE_KEY);
  if (cached) return NextResponse.json(cached);

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeThisMonth,
    planCounts,
    totalJobs,
    jobsToday,
    hdJobs,
    standardJobs,
    recentJobs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.job.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: monthStart }, userId: { not: null } },
    }).then(rows => rows.length),
    prisma.subscription.groupBy({
      by: ['planId'],
      _count: true,
    }),
    prisma.job.count(),
    prisma.job.count({ where: { createdAt: { gte: today } } }),
    prisma.job.count({ where: { provider: 'replicate' } }),
    prisma.job.count({ where: { provider: { not: 'replicate' } } }),
    prisma.job.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, prompt: true, provider: true, status: true, createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  const byPlan: Record<string, number> = {};
  for (const row of planCounts) {
    byPlan[row.planId] = row._count;
  }

    const responseBody = {
    users: {
      total: totalUsers,
      activeThisMonth,
      byPlan,
    },
    jobs: {
      total: totalJobs,
      today: jobsToday,
      hd:       hdJobs,
      standard: standardJobs,
    },
    recentJobs,
    generatedAt: now.toISOString(),
  };
  await cache.set(CACHE_KEY, responseBody, 300); // 5 min TTL
  return NextResponse.json(responseBody);
}
