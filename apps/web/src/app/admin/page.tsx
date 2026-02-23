'use client';




import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface Stats {
  users: { total: number; activeThisMonth: number; byPlan: Record<string, number> };
  jobs:  { total: number; today: number; hd: number; standard: number };
  recentJobs: { id: string; prompt: string; provider: string; status: string; createdAt: string; user?: { email: string } }[];
  generatedAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name?: string;
  planId: string;
  jobCount: number;
  lastActive: string | null;
  createdAt: string;
}

interface Revenue {
  mrr: number;
  activeSubscriptions: number;
  byPlan: Record<string, { count: number; revenue: number }>;
}

/* ── StatCard ────────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {sub && <p className="admin-stat-card__sub">{sub}</p>}
    </div>
  );
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */

type Tab = 'overview' | 'users' | 'jobs' | 'revenue' | 'system';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users',    label: 'Users'    },
  { id: 'jobs',     label: 'Jobs'     },
  { id: 'revenue',  label: 'Revenue'  },
  { id: 'system',   label: 'System'   },
];

/* ── Overview tab ────────────────────────────────────────────────────────── */

function OverviewTab({ stats }: { stats: Stats }) {
  return (
    <>
      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Users</p>
        <div className="admin-grid">
          <StatCard label="Total users" value={stats.users.total} />
          <StatCard label="Active this month" value={stats.users.activeThisMonth} sub="≥1 generation" />
          {Object.entries(stats.users.byPlan).map(([plan, count]) => (
            <StatCard key={plan} label={`Plan: ${plan}`} value={count} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Generations</p>
        <div className="admin-grid">
          <StatCard label="Total jobs" value={stats.jobs.total.toLocaleString()} />
          <StatCard label="Today" value={stats.jobs.today.toLocaleString()} />
          <StatCard label="HD (Replicate)" value={stats.jobs.hd.toLocaleString()} />
          <StatCard label="Standard" value={stats.jobs.standard.toLocaleString()} />
        </div>
      </section>

      <section>
        <p className="admin-section-label">Recent generations</p>
        <div className="admin-table-wrap">
          <div className="admin-table-row admin-table-row--header" style={{ gridTemplateColumns: '1fr auto auto auto' }}>
            <span className="admin-table-cell admin-table-cell--head">Prompt / User</span>
            <span className="admin-table-cell admin-table-cell--head">Provider</span>
            <span className="admin-table-cell admin-table-cell--head">Status</span>
            <span className="admin-table-cell admin-table-cell--head">Date</span>
          </div>
          {stats.recentJobs.map((job, i) => (
            <div key={job.id} className={`admin-table-row ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`} style={{ gridTemplateColumns: '1fr auto auto auto' }}>
              <div>
                <p className="admin-table-cell" style={{ margin: 0 }}>{job.prompt}</p>
                <p className="admin-table-cell admin-table-cell--faint" style={{ margin: '0.1rem 0 0', fontSize: '0.7rem' }}>{job.user?.email ?? 'guest'}</p>
              </div>
              <span className={`admin-table-cell ${job.provider === 'replicate' ? 'admin-table-cell--hd' : 'admin-table-cell--std'}`}>
                {job.provider === 'replicate' ? 'HD' : 'std'}
              </span>
              <span className={`admin-table-cell ${job.status === 'completed' ? 'admin-table-cell--ok' : job.status === 'failed' ? 'admin-table-cell--fail' : 'admin-table-cell--run'}`}>
                {job.status}
              </span>
              <span className="admin-table-cell admin-table-cell--faint">{new Date(job.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/* ── Users tab ───────────────────────────────────────────────────────────── */

function UsersTab() {
  const [users, setUsers]   = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users?limit=50')
      .then(r => r.ok ? r.json() : r.json().then((d: {error?:string}) => Promise.reject(d.error ?? `HTTP ${r.status}`)))
      .then((d: { users: UserRow[] }) => setUsers(d.users))
      .catch((e: string) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-loading">Loading users…</p>;
  if (error)   return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-table-wrap">
      <div className="admin-table-row admin-table-row--header" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
        <span className="admin-table-cell admin-table-cell--head">User</span>
        <span className="admin-table-cell admin-table-cell--head">Plan</span>
        <span className="admin-table-cell admin-table-cell--head">Jobs</span>
        <span className="admin-table-cell admin-table-cell--head">Last active</span>
        <span className="admin-table-cell admin-table-cell--head">Joined</span>
      </div>
      {users.map((u, i) => (
        <div key={u.id} className={`admin-table-row ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
          <div>
            <p className="admin-table-cell" style={{ margin: 0 }}>{u.name ?? '—'}</p>
            <p className="admin-table-cell admin-table-cell--faint" style={{ margin: '0.1rem 0 0', fontSize: '0.7rem' }}>{u.email}</p>
          </div>
          <span><span className={`admin-badge admin-badge--${u.planId}`}>{u.planId}</span></span>
          <span className="admin-table-cell">{u.jobCount.toLocaleString()}</span>
          <span className="admin-table-cell admin-table-cell--muted">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : 'Never'}</span>
          <span className="admin-table-cell admin-table-cell--faint">{new Date(u.createdAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Jobs tab ────────────────────────────────────────────────────────────── */

function JobsTab({ stats }: { stats: Stats }) {
  return (
    <>
      <div className="admin-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="Total" value={stats.jobs.total.toLocaleString()} />
        <StatCard label="Today" value={stats.jobs.today.toLocaleString()} />
        <StatCard label="HD jobs" value={stats.jobs.hd.toLocaleString()} sub="Replicate provider" />
        <StatCard label="Standard" value={stats.jobs.standard.toLocaleString()} sub="Pollinations + others" />
      </div>
      <p className="admin-section-label">Recent (last 10)</p>
      <div className="admin-table-wrap">
        <div className="admin-table-row admin-table-row--header" style={{ gridTemplateColumns: '1fr 1fr auto auto auto' }}>
          <span className="admin-table-cell admin-table-cell--head">Prompt</span>
          <span className="admin-table-cell admin-table-cell--head">User</span>
          <span className="admin-table-cell admin-table-cell--head">Provider</span>
          <span className="admin-table-cell admin-table-cell--head">Status</span>
          <span className="admin-table-cell admin-table-cell--head">Date</span>
        </div>
        {stats.recentJobs.map((job, i) => (
          <div key={job.id} className={`admin-table-row ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`} style={{ gridTemplateColumns: '1fr 1fr auto auto auto' }}>
            <span className="admin-table-cell">{job.prompt}</span>
            <span className="admin-table-cell admin-table-cell--muted">{job.user?.email ?? 'guest'}</span>
            <span className={`admin-table-cell ${job.provider === 'replicate' ? 'admin-table-cell--hd' : 'admin-table-cell--std'}`}>{job.provider}</span>
            <span className={`admin-table-cell ${job.status === 'completed' ? 'admin-table-cell--ok' : job.status === 'failed' ? 'admin-table-cell--fail' : 'admin-table-cell--run'}`}>{job.status}</span>
            <span className="admin-table-cell admin-table-cell--faint">{new Date(job.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Revenue tab ─────────────────────────────────────────────────────────── */

function RevenueTab() {
  const [rev, setRev]       = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/revenue')
      .then(r => r.ok ? r.json() : r.json().then((d: {error?:string}) => Promise.reject(d.error ?? `HTTP ${r.status}`)))
      .then(setRev)
      .catch((e: string) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-loading">Loading revenue…</p>;
  if (error)   return <div className="admin-error">{error}</div>;
  if (!rev)    return null;

  return (
    <>
      <div className="admin-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="MRR (est.)" value={`$${(rev.mrr / 100).toFixed(2)}`} sub="active subscriptions × price" />
        <StatCard label="Active subs" value={rev.activeSubscriptions} />
      </div>
      <p className="admin-section-label">By plan</p>
      <div className="admin-table-wrap">
        <div className="admin-table-row admin-table-row--header" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <span className="admin-table-cell admin-table-cell--head">Plan</span>
          <span className="admin-table-cell admin-table-cell--head">Subscribers</span>
          <span className="admin-table-cell admin-table-cell--head">Revenue/mo</span>
        </div>
        {Object.entries(rev.byPlan).map(([plan, d], i) => (
          <div key={plan} className={`admin-table-row ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <span><span className={`admin-badge admin-badge--${plan}`}>{plan}</span></span>
            <span className="admin-table-cell">{d.count}</span>
            <span className="admin-table-cell admin-table-cell--hd">${(d.revenue / 100).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ── System tab ──────────────────────────────────────────────────────────── */

function SystemTab() {
  const stripeOk  = !!process.env.NEXT_PUBLIC_STRIPE_ENABLED;
  const checks = [
    { label: 'Database',    sub: 'Prisma + PostgreSQL', ok: true  },
    { label: 'Stripe',      sub: stripeOk ? 'Configured' : 'Not configured', ok: stripeOk },
    { label: 'Upstash Redis', sub: 'Rate limiting layer', ok: true },
    { label: 'Pollinations', sub: 'Standard gen provider', ok: true },
  ];

  return (
    <div className="admin-system-grid">
      {checks.map(c => (
        <div key={c.label} className="admin-system-card">
          <div className={`admin-system-card__dot ${c.ok ? 'admin-system-card__dot--ok' : 'admin-system-card__dot--warn'}`} />
          <div>
            <p className="admin-system-card__label">{c.label}</p>
            <p className="admin-system-card__sub">{c.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const [stats, setStats]   = useState<Stats | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<Tab>('overview');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? `HTTP ${r.status}`)))
      .then(setStats)
      .catch((e: string) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Admin</h1>
          {stats && (
            <p className="admin-header__sub">
              Last updated {new Date(stats.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <Link href="/pixel/studio" className="admin-header__back">← Studio</Link>
      </div>

      {loading && <p className="admin-loading">Loading…</p>}
      {error && <div className="admin-error">{error}</div>}

      {stats && !loading && (
        <>
          <div className="admin-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`admin-tab ${tab === t.id ? 'admin-tab--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && <OverviewTab stats={stats} />}
          {tab === 'users'    && <UsersTab />}
          {tab === 'jobs'     && <JobsTab stats={stats} />}
          {tab === 'revenue'  && <RevenueTab />}
          {tab === 'system'   && <SystemTab />}
        </>
      )}
    </main>
  );
}
