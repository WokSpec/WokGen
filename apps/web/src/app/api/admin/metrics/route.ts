import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminResult = await requireAdmin();
  if (isAdminResponse(adminResult)) return adminResult;

  const now = new Date();
  const since7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsers7d,
    totalJobs,
    jobs24h,
    toolCounts,
    activeUserRows,
    recentSignups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since7d } } }),
    prisma.job.count(),
    prisma.job.count({ where: { createdAt: { gte: since24h } } }),
    prisma.job.groupBy({
      by: ['tool'],
      _count: true,
      orderBy: { _count: { tool: 'desc' } },
      take: 10,
    }),
    prisma.job.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since7d }, userId: { not: null } },
    }),
    prisma.user.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true },
    }),
  ]);

  const topTools = toolCounts.map(row => ({
    tool:  row.tool,
    count: row._count,
  }));

  return NextResponse.json({
    totalUsers,
    newUsers7d,
    totalJobs,
    jobs24h,
    activeUsers7d: activeUserRows.length,
    topTools,
    recentSignups: recentSignups.map(u => ({
      id:        u.id,
      email:     u.email ?? '',
      name:      u.name  ?? null,
      createdAt: u.createdAt.toISOString(),
    })),
    generatedAt: now.toISOString(),
  });
}
