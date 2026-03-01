import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { DAILY_STD_LIMIT } from '@/lib/quota';
import { MODES_LIST } from '@/lib/modes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard | WokGen' };

// ── Inline styles replaced with CSS classes defined in globals.css ─────────
// All .dash-* classes are appended to globals.css via the AppShell section.

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = session.user;
  const userId = user.id!;
  const initial = (user.name || user.email || 'U')[0].toUpperCase();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [generationsToday, generationsMonth, totalAssets, recentProjects, subscription] = await Promise.all([
    prisma.job.count({ where: { userId, createdAt: { gte: today } } }),
    prisma.job.count({ where: { userId, createdAt: { gte: monthStart } } }),
    prisma.galleryAsset.count({ where: { job: { userId } } }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: { id: true, name: true, mode: true, updatedAt: true, _count: { select: { jobs: true } } },
    }),
    prisma.subscription.findUnique({
      where: { userId },
      select: { planId: true, status: true },
    }),
  ]);

  const planId = subscription?.planId ?? 'free';
  const dailyLimit = DAILY_STD_LIMIT[planId as keyof typeof DAILY_STD_LIMIT] ?? DAILY_STD_LIMIT['free'] ?? 100;
  const usagePct = Math.min(100, Math.round((generationsToday / dailyLimit) * 100));
  const usageDanger = generationsToday / dailyLimit >= 0.9;

  return (
    <div className="dash-root">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="dash-header">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User avatar'}
            width={44}
            height={44}
            priority
            className="dash-avatar-img"
          />
        ) : (
          <div className="dash-avatar-initials">{initial}</div>
        )}
        <div>
          <h1 className="dash-heading">
            {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p className="dash-subheading">{user.email}</p>
        </div>
      </div>

      {/* ── Recent projects ─────────────────────────────────── */}
      {recentProjects.length > 0 && (
        <div className="dash-section">
          <div className="dash-section-header">
            <h2 className="dash-section-label">Projects</h2>
            <Link href="/projects" className="dash-section-link">All projects →</Link>
          </div>
          <div className="dash-projects-grid">
            {recentProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="dash-project-card">
                <div className="dash-project-name">{p.name}</div>
                <div className="dash-project-meta">
                  <span>{p.mode}</span>
                  <span>·</span>
                  <span>{p._count.jobs} assets</span>
                </div>
              </Link>
            ))}
            <Link href="/projects" className="dash-project-new">+ New project</Link>
          </div>
        </div>
      )}

      {/* ── Action cards ────────────────────────────────────── */}
      <div className="dash-section">
        <div className="dash-cards-grid">
          {ACTION_CARDS.map((card) => (
            <Link key={card.href} href={card.href} className="dash-card">
              <div className="dash-card-icon" style={{ '--card-accent': card.accent } as React.CSSProperties}>
                {card.icon}
              </div>
              <div className="dash-card-label">{card.label}</div>
              <div className="dash-card-desc">{card.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Quick create ────────────────────────────────────── */}
      <div className="dash-quick-create">
        <span className="dash-quick-label">Quick create</span>
        <div className="dash-quick-links">
          {MODES_LIST.map((mode) => (
            <Link
              key={mode.id}
              href={mode.routes.studio}
              className="dash-quick-btn"
              style={{ '--mode-accent': mode.accentColor } as React.CSSProperties}
            >
              {mode.shortLabel}
            </Link>
          ))}
          <Link href="/tools" className="dash-quick-btn">Tools</Link>
        </div>
      </div>

      {/* ── Usage ───────────────────────────────────────────── */}
      <div className="dash-usage">
        <div className="dash-usage-header">
          <span className="dash-usage-title">Usage</span>
          <Link href="/account/usage" className="dash-usage-link">Full report →</Link>
        </div>
        <div className="dash-usage-grid">
          <div className="dash-usage-stat">
            <div className="dash-usage-stat-label">Daily generations</div>
            <div className="dash-usage-stat-value">
              {generationsToday}
              <span className="dash-usage-stat-max"> / {dailyLimit}</span>
            </div>
            <div className="dash-usage-bar-track">
              <div
                className="dash-usage-bar-fill"
                style={{
                  width: `${usagePct}%`,
                  background: usageDanger ? 'var(--danger)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
          <div className="dash-usage-stat">
            <div className="dash-usage-stat-label">Monthly total</div>
            <div className="dash-usage-stat-value">{generationsMonth}</div>
          </div>
          <div className="dash-usage-stat">
            <div className="dash-usage-stat-label">Assets stored</div>
            <div className="dash-usage-stat-value">{totalAssets}</div>
          </div>
        </div>
      </div>

    </div>
  );
}

// ── Action card definitions ──────────────────────────────────────────────────

const ACTION_CARDS = [
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    desc: 'Generation history, usage stats, activity',
    accent: 'var(--accent)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    href: '/library',
    label: 'Asset Library',
    desc: 'All your generated images, vectors, and files',
    accent: 'var(--success)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-5-5L5 21" />
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projects',
    desc: 'Organize work into workspaces with brand context',
    accent: 'var(--blue)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      </svg>
    ),
  },
  {
    href: '/account/api-keys',
    label: 'API Keys',
    desc: 'Manage WokAPI keys for programmatic access',
    accent: 'var(--yellow)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="7.5" cy="15.5" r="5.5" />
        <path d="m21 2-9.6 9.6M15.5 7.5l3 3" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    desc: 'Profile, connected accounts, preferences',
    accent: 'var(--text-secondary)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    href: '/developers',
    label: 'WokAPI',
    desc: 'Developer docs, endpoint reference, SDK',
    accent: 'var(--pink)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];
