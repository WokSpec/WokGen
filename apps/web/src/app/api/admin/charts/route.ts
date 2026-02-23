import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, isAdminResponse } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const adminResult = await requireAdmin();
  if (isAdminResponse(adminResult)) return adminResult;

  // Daily volume — last 7 days using raw query for date grouping
  let dailyVolume: { date: string; count: bigint }[];
  let providerBreakdown: { provider: string; count: bigint }[];
  let latencyRows: { p50: number | null; p95: number | null }[];

  try {
    dailyVolume = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("createdAt") as date, COUNT(*) as count
      FROM "Job"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date
    `;
  } catch (err) {
    return NextResponse.json(
      { error: 'Database query failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  try {
    providerBreakdown = await prisma.$queryRaw<{ provider: string; count: bigint }[]>`
      SELECT provider, COUNT(*) as count
      FROM "Job"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
      GROUP BY provider
      ORDER BY count DESC
    `;
  } catch (err) {
    return NextResponse.json(
      { error: 'Database query failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  try {
    latencyRows = await prisma.$queryRaw<{ p50: number | null; p95: number | null }[]>`
      SELECT
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "durationMs") AS p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationMs") AS p95
      FROM "Job"
      WHERE "createdAt" > NOW() - INTERVAL '7 days'
        AND "durationMs" IS NOT NULL
    `;
  } catch (err) {
    return NextResponse.json(
      { error: 'Database query failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  const latency = latencyRows[0] ?? { p50: null, p95: null };

  return NextResponse.json({
    dailyVolume: dailyVolume.map(r => ({ date: r.date, count: Number(r.count) })),
    providerBreakdown: providerBreakdown.map(r => ({ provider: r.provider, count: Number(r.count) })),
    latencyP50: latency.p50 ?? 0,
    latencyP95: latency.p95 ?? 0,
  });
}
