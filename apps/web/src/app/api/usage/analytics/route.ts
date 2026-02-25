import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

/**
 * GET /api/usage/analytics
 *
 * Personal analytics for the authenticated user:
 *  - totalGenerations: all-time succeeded job count
 *  - daily: generations per day for last 90 days (for heatmap)
 *  - topTools: top 5 tools by usage count
 *  - eralMessages: total user messages sent to Eral
 *  - creditsUsedThisMonth: imagesUsed from current UsagePeriod
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const userId = session.user.id;
    const now = new Date();

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalGenerations, recentJobs, eralMessages, usagePeriod, topToolsRaw] = await Promise.all([
      dbQuery(prisma.job.count({ where: { userId, status: 'succeeded' } })),
      dbQuery(prisma.job.findMany({
        where: { userId, status: 'succeeded', createdAt: { gte: ninetyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, tool: true, mode: true, createdAt: true, resultUrl: true, prompt: true },
      })),
      dbQuery(prisma.eralMessage.count({
        where: { role: 'user', conversation: { userId } },
      })),
      dbQuery(prisma.usagePeriod.findFirst({
        where: { userId, periodStart: { gte: startOfMonth } },
        orderBy: { periodStart: 'desc' },
      })),
      dbQuery(prisma.job.groupBy({
        by: ['tool'],
        where: { userId, status: 'succeeded' },
        _count: { _all: true },
        orderBy: { _count: { tool: 'desc' } },
        take: 5,
      })),
    ]);

    // Build 90-day count map
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 90; i++) {
      const d = new Date(ninetyDaysAgo);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const job of recentJobs) {
      const key = job.createdAt.toISOString().slice(0, 10);
      if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }

    return NextResponse.json({
      totalGenerations,
      eralMessages,
      creditsUsedThisMonth: usagePeriod?.imagesUsed ?? 0,
      topTools: topToolsRaw.map((t) => ({ tool: t.tool, count: t._count._all })),
      daily: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
      recentJobs: recentJobs.slice(0, 10).map((j) => ({
        id: j.id,
        tool: j.tool,
        mode: j.mode,
        prompt: j.prompt.slice(0, 100),
        resultUrl: j.resultUrl,
        createdAt: j.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    log.error({ err }, 'GET /api/usage/analytics failed');
    return API_ERRORS.INTERNAL();
  }
}
