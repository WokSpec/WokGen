import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics — WokGen' };

// Map generation count to a heat colour (purple-scale like GitHub)
function heatColour(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.06)';
  if (count === 1) return 'rgba(167,139,250,0.25)';
  if (count <= 3) return 'rgba(167,139,250,0.5)';
  if (count <= 5) return 'rgba(167,139,250,0.75)';
  return 'rgba(167,139,250,1)';
}

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/dashboard/analytics');

  const userId = session.user.id;
  const now = new Date();

  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
  ninetyDaysAgo.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalGenerations, recentJobs, eralMessages, usagePeriod, topToolsRaw] = await Promise.all([
    prisma.job.count({ where: { userId, status: 'succeeded' } }),
    prisma.job.findMany({
      where: { userId, status: 'succeeded', createdAt: { gte: ninetyDaysAgo } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, tool: true, mode: true, createdAt: true, resultUrl: true, prompt: true },
    }),
    prisma.eralMessage.count({
      where: { role: 'user', conversation: { userId } },
    }),
    prisma.usagePeriod.findFirst({
      where: { userId, periodStart: { gte: startOfMonth } },
      orderBy: { periodStart: 'desc' },
    }),
    prisma.job.groupBy({
      by: ['tool'],
      where: { userId, status: 'succeeded' },
      _count: { _all: true },
      orderBy: { _count: { tool: 'desc' } },
      take: 5,
    }),
  ]);

  // ── 90-day heatmap ──────────────────────────────────────────────────────────
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

  // Pad to a full week grid (Sunday-first) so cells align as columns = weeks
  const heatDays = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }));
  const startDow = ninetyDaysAgo.getDay(); // 0 = Sun
  const padCells = startDow;

  // ── Derived stats ───────────────────────────────────────────────────────────
  const creditsUsed = usagePeriod?.imagesUsed ?? 0;
  const uniqueTools = new Set(topToolsRaw.map((t) => t.tool)).size;
  const recentActivity = recentJobs.slice(0, 10);

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Your Analytics</h1>
      <p style={{ opacity: 0.5, marginBottom: '2rem', fontSize: '0.875rem' }}>
        Personal usage stats for your WokGen account.
      </p>

      {/* ── Stats cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {[
          { label: 'TOTAL GENERATIONS', value: totalGenerations },
          { label: 'TOOLS USED', value: uniqueTools },
          { label: 'ERAL MESSAGES', value: eralMessages },
          { label: 'CREDITS THIS MONTH', value: creditsUsed },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.05em', opacity: 0.5, marginBottom: '0.5rem' }}>
              {label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Activity heatmap ── */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Activity — last 90 days</h2>
        {/* GitHub-style grid: auto-flow column, 7 rows = days of week */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: 'repeat(7, 14px)',
            gridAutoFlow: 'column',
            gridAutoColumns: '14px',
            gap: '3px',
            overflowX: 'auto',
          }}
        >
          {/* Padding cells to align first day to correct weekday */}
          {Array.from({ length: padCells }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {heatDays.map(({ date, count }) => (
            <div
              key={date}
              title={`${date}: ${count} generation${count !== 1 ? 's' : ''}`}
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '2px',
                backgroundColor: heatColour(count),
              }}
            />
          ))}
        </div>
        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '0.75rem',
            fontSize: '0.7rem',
            opacity: 0.45,
          }}
        >
          <span>Less</span>
          {[0, 1, 2, 4, 6].map((v, i) => (
            <div
              key={i}
              style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: heatColour(v) }}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* ── Top tools ── */}
      {topToolsRaw.length > 0 && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Top Tools</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {topToolsRaw.map((t) => {
              const pct = totalGenerations > 0 ? Math.round((t._count._all / totalGenerations) * 100) : 0;
              return (
                <div key={t.tool} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '80px', fontSize: '0.8rem', opacity: 0.7, flexShrink: 0 }}>{t.tool}</div>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '3px',
                        width: `${pct}%`,
                        backgroundColor: 'rgba(167,139,250,0.7)',
                      }}
                    />
                  </div>
                  <div style={{ width: '40px', textAlign: 'right', fontSize: '0.8rem', opacity: 0.6 }}>
                    {t._count._all}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent generations ── */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Recent Generations</h2>
        {recentActivity.length === 0 ? (
          <p style={{ opacity: 0.45, textAlign: 'center', padding: '2rem 0', fontSize: '0.875rem' }}>
            No generations yet — head to the studio to create something!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((job) => (
              <div key={job.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Thumbnail */}
                {job.resultUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.resultUrl}
                    alt=""
                    width={48}
                    height={48}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      flexShrink: 0,
                    }}
                  />
                )}
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {job.prompt.slice(0, 90)}
                  </div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.45, marginTop: '0.2rem' }}>
                    {job.tool} · {job.mode} ·{' '}
                    {new Date(job.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
