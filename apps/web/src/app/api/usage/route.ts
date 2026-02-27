import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { DAILY_STD_LIMIT } from '@/lib/quota';

export const dynamic = 'force-dynamic';

/**
 * GET /api/usage
 *
 * Returns generation stats for the authenticated user:
 *  - allTime / thisMonth / today counts (total / hd / standard)
 *  - daily breakdown for the last 30 days (for spark-chart)
 *  - per-mode breakdown for today and all-time
 *  - quota limits for the user's tier
 *  - paginated request log (?page=1&limit=20)
 *  - last 12 jobs with resultUrl for history strip
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const userId = session.user.id;
    const now    = new Date();
    const url    = new URL(req.url);
    const page   = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));

    // Period boundaries
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const [recentJobs, allTimeTotal, allTimeHd, user, subscription, requestLogTotal] = await Promise.all([
      dbQuery(prisma.job.findMany({
        where:   { userId, status: 'succeeded', createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take:    50,
        select:  { id: true, provider: true, mode: true, createdAt: true, resultUrl: true, prompt: true, tool: true },
      })),
      dbQuery(prisma.job.count({ where: { userId, status: 'succeeded' } })),
      dbQuery(prisma.job.count({ where: { userId, status: 'succeeded', provider: 'replicate' } })),
      dbQuery(prisma.user.findUnique({ where: { id: userId }, select: { stdGenToday: true, stdGenDate: true, hdMonthlyUsed: true, hdTopUpCredits: true } })),
      dbQuery(prisma.subscription.findUnique({ where: { userId }, include: { plan: true } })),
      dbQuery(prisma.job.count({ where: { userId }, })),
    ]);

    // Partition into HD vs standard (replicate = HD, everything else = standard)
    const isHd = (provider: string) => provider === 'replicate';

    // Today / this-month counts
    const todayJobs      = recentJobs.filter(j => j.createdAt >= startOfToday);
    const thisMonthJobs  = recentJobs.filter(j => j.createdAt >= startOfMonth);

    // Daily breakdown for last 30 days
    const dailyMap = new Map<string, { total: number; hd: number; standard: number }>();
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { total: 0, hd: 0, standard: 0 });
    }
    for (const job of recentJobs) {
      const key = job.createdAt.toISOString().slice(0, 10);
      const bucket = dailyMap.get(key);
      if (bucket) {
        bucket.total++;
        if (isHd(job.provider)) bucket.hd++;
        else bucket.standard++;
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, counts]) => ({ date, ...counts }));

    // Per-mode breakdown (today + all-time from recentJobs for today slice)
    const modes = ['pixel', 'business', 'vector', 'emoji', 'uiux', 'voice', 'code'] as const;
    const modeBreakdownToday: Record<string, number> = {};
    const modeBreakdownMonth: Record<string, number> = {};
    for (const m of modes) {
      modeBreakdownToday[m]  = todayJobs.filter(j => j.mode === m).length;
      modeBreakdownMonth[m]  = thisMonthJobs.filter(j => j.mode === m).length;
    }

    // Quota info
    const planId = subscription?.plan?.id ?? 'free';
    const dailyLimit = DAILY_STD_LIMIT[planId] ?? DAILY_STD_LIMIT['free'];
    const todayUsed  = user?.stdGenToday ?? 0;
    const hdAlloc    = subscription?.plan?.creditsPerMonth ?? 0;
    const hdUsed     = user?.hdMonthlyUsed ?? 0;
    const hdTopUp    = user?.hdTopUpCredits ?? 0;

    // Paginated request log
    const logJobs = await dbQuery(prisma.job.findMany({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select:  { id: true, mode: true, tool: true, provider: true, status: true, prompt: true, createdAt: true, resultUrl: true },
    }));

    return NextResponse.json({
      allTime: {
        total:    allTimeTotal,
        hd:       allTimeHd,
        standard: allTimeTotal - allTimeHd,
      },
      thisMonth: {
        total:    thisMonthJobs.length,
        hd:       thisMonthJobs.filter(j => isHd(j.provider)).length,
        standard: thisMonthJobs.filter(j => !isHd(j.provider)).length,
      },
      today: {
        total:    todayJobs.length,
        hd:       todayJobs.filter(j => isHd(j.provider)).length,
        standard: todayJobs.filter(j => !isHd(j.provider)).length,
      },
      quota: {
        planId,
        dailyLimit,   // -1 = unlimited
        todayUsed,
        hdAlloc,
        hdUsed,
        hdTopUp,
        hdAvailable: Math.max(0, hdAlloc - hdUsed) + hdTopUp,
      },
      modeToday:  modeBreakdownToday,
      modeMonth:  modeBreakdownMonth,
      daily,
      // Paginated request log
      log: {
        items: logJobs.map(j => ({
          id:        j.id,
          mode:      j.mode,
          tool:      j.tool,
          provider:  j.provider,
          status:    j.status,
          prompt:    j.prompt.slice(0, 120),
          resultUrl: j.resultUrl,
          createdAt: j.createdAt.toISOString(),
          hd:        isHd(j.provider),
        })),
        total: requestLogTotal,
        page,
        limit,
        pages: Math.ceil(requestLogTotal / limit),
      },
      // Most recent 12 jobs with images for history strip
      recent: recentJobs.slice(0, 12).map(j => ({
        id:        j.id,
        prompt:    j.prompt,
        tool:      j.tool,
        mode:      j.mode,
        provider:  j.provider,
        resultUrl: j.resultUrl,
        createdAt: j.createdAt.toISOString(),
        hd:        isHd(j.provider),
      })),
    });
  } catch (err) {
    log.error({ err }, 'GET /api/usage failed');
    return API_ERRORS.INTERNAL();
  }
}
