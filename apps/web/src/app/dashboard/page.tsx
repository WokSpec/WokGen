import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { DAILY_STD_LIMIT } from '@/lib/quota';

export const metadata: Metadata = {
  title: 'Dashboard | WokGen',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = session.user;
  const userId = user.id;
  const initial = (user.name || user.email || 'U')[0].toUpperCase();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [generationsToday, generationsMonth, totalAssets] = await Promise.all([
    prisma.job.count({ where: { userId, createdAt: { gte: today } } }),
    prisma.job.count({ where: { userId, createdAt: { gte: monthStart } } }),
    prisma.galleryAsset.count({ where: { job: { userId } } }),
  ]);

  const dailyLimit = DAILY_STD_LIMIT['free'] ?? 100;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
        {user.image ? (
          <Image src={user.image} alt={user.name || 'User avatar'} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.08)' }} />
        ) : (
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.125rem', color: '#a78bfa', border: '2px solid rgba(167,139,250,0.2)' }}>
            {initial}
          </div>
        )}
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, lineHeight: 1.2 }}>
            {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{user.email}</p>
        </div>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem', marginBottom: '2rem' }}>
        {[
          {
            href: '/dashboard/analytics',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            ),
            label: 'Analytics',
            desc: 'Generation history, usage stats, activity heatmap',
            accent: '#a78bfa',
            bg: 'rgba(167,139,250,0.12)',
            border: 'rgba(167,139,250,0.25)',
          },
          {
            href: '/library',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
            ),
            label: 'Asset Library',
            desc: 'All your generated images, vectors, and files',
            accent: '#34d399',
            bg: 'rgba(52,211,153,0.12)',
            border: 'rgba(52,211,153,0.25)',
          },
          {
            href: '/projects',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
            ),
            label: 'Projects',
            desc: 'Organize work into named workspaces with brand context',
            accent: '#60a5fa',
            bg: 'rgba(96,165,250,0.12)',
            border: 'rgba(96,165,250,0.25)',
          },
          {
            href: '/account/api-keys',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3"/></svg>
            ),
            label: 'API Keys',
            desc: 'Manage WokAPI keys for programmatic access',
            accent: '#f59e0b',
            bg: 'rgba(245,158,11,0.12)',
            border: 'rgba(245,158,11,0.25)',
          },
          {
            href: '/settings',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            ),
            label: 'Settings',
            desc: 'Profile, connected accounts, and account management',
            accent: 'rgba(255,255,255,0.5)',
            bg: 'rgba(255,255,255,0.06)',
            border: 'rgba(255,255,255,0.12)',
          },
          {
            href: '/developers',
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            ),
            label: 'WokAPI',
            desc: 'Developer docs, endpoint reference, @wokspec/sdk',
            accent: '#f472b6',
            bg: 'rgba(244,114,182,0.12)',
            border: 'rgba(244,114,182,0.25)',
          },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '1.125rem',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              textDecoration: 'none',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: item.bg,
              border: `1px solid ${item.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.accent,
            }}>
              {item.icon}
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{item.label}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flexShrink: 0 }}>Quick create</span>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Pixel Studio', href: '/pixel/studio' },
            { label: 'Business Studio', href: '/business/studio' },
            { label: 'Vector Studio', href: '/vector/studio' },
            { label: 'Voice Studio', href: '/voice/studio' },
            { label: 'Code Studio', href: '/studio/code' },
            { label: 'All Tools', href: '/tools' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ padding: '0.375rem 0.875rem', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Usage widget */}
      <div style={{ marginTop: '1rem', padding: '1.25rem 1.5rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(167,139,250,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Usage</span>
          <Link href="/account/usage" style={{ fontSize: '0.8125rem', color: '#a78bfa', textDecoration: 'none' }}>View full report →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Daily generations</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{generationsToday} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {dailyLimit}</span></div>
            <div style={{ marginTop: '0.375rem', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, Math.round((generationsToday / dailyLimit) * 100))}%`, background: generationsToday / dailyLimit >= 0.9 ? '#f87171' : '#a78bfa', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Monthly total</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{generationsMonth}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Assets stored</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{totalAssets}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
