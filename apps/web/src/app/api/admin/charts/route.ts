import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ADMIN_EMAIL || session.user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Daily volume — last 7 days using raw query for date grouping
  const dailyVolume = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE("createdAt") as date, COUNT(*) as count
    FROM "Job"
    WHERE "createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY date
  `;

  // Provider breakdown
  const providerBreakdown = await prisma.$queryRaw<{ provider: string; count: bigint }[]>`
    SELECT provider, COUNT(*) as count
    FROM "Job"
    WHERE "createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY provider
    ORDER BY count DESC
  `;

  // Latency percentiles (using durationMs field if available, else 0)
  const latencyRows = await prisma.$queryRaw<{ p50: number | null; p95: number | null }[]>`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "durationMs") AS p50,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationMs") AS p95
    FROM "Job"
    WHERE "createdAt" > NOW() - INTERVAL '7 days'
      AND "durationMs" IS NOT NULL
  `;

  const latency = latencyRows[0] ?? { p50: null, p95: null };

  return NextResponse.json({
    dailyVolume: dailyVolume.map(r => ({ date: r.date, count: Number(r.count) })),
    providerBreakdown: providerBreakdown.map(r => ({ provider: r.provider, count: Number(r.count) })),
    latencyP50: latency.p50 ?? 0,
    latencyP95: latency.p95 ?? 0,
  });
}
