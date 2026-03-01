'use client';




import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminCharts from './_charts';
import { formatNumber, formatDate } from '@/lib/format';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface ProviderHealthEntry {
  provider: string;
  configured: boolean;
  failures24h: number;
  degraded: boolean;
}

interface Stats {
  users: { total: number; activeThisMonth: number; activeToday?: number; byPlan: Record<string, number> };
  jobs:  { total: number; today: number; hd: number; standard: number };
  recentJobs: { id: string; prompt: string; provider: string; status: string; createdAt: string; user?: { email: string } }[];
  providerHealth?: ProviderHealthEntry[];
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

type Tab = 'overview' | 'users' | 'jobs' | 'revenue' | 'system' | 'charts' | 'health';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users',    label: 'Users'    },
  { id: 'jobs',     label: 'Jobs'     },
  { id: 'revenue',  label: 'Revenue'  },
  { id: 'charts',   label: 'Charts'   },
  { id: 'system',   label: 'System'   },
  { id: 'health',   label: 'Provider Health' },
];

/* ── Overview tab ────────────────────────────────────────────────────────── */

function OverviewTab({ stats }: { stats: Stats }) {
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const quickAction = async (action: string) => {
    const res = await fetch(`/api/admin/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const d = await res.json().catch(() => ({})) as { message?: string };
    setActionMsg(d.message ?? (res.ok ? 'Done.' : 'Failed.'));
    setTimeout(() => setActionMsg(null), 4000);
  };

  const failedJobs = stats.recentJobs.filter(j => j.status === 'failed').slice(0, 5);
  const totalJobs  = stats.jobs.hd + stats.jobs.standard || 1;
  void totalJobs;
  const providerCounts: Record<string, number> = {};
  stats.recentJobs.forEach(j => {
    providerCounts[j.provider] = (providerCounts[j.provider] ?? 0) + 1;
  });

  return (
    <>
      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Users</p>
        <div className="admin-grid">
          <StatCard label="Total users" value={stats.users.total} />
          <StatCard label="Active this month" value={stats.users.activeThisMonth} sub="≥1 generation" />
          <StatCard label="Active today" value={stats.users.activeToday ?? '—'} sub="unique users" />
          {Object.entries(stats.users.byPlan).map(([plan, count]) => (
            <StatCard key={plan} label={`Plan: ${plan}`} value={count} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Generations</p>
        <div className="admin-grid">
          <StatCard label="Total jobs" value={formatNumber(stats.jobs.total)} />
          <StatCard label="Today" value={formatNumber(stats.jobs.today)} />
          <StatCard label="HD (Replicate)" value={formatNumber(stats.jobs.hd)} />
          <StatCard label="Standard" value={formatNumber(stats.jobs.standard)} />
        </div>
      </section>

      {/* Provider Usage Chart */}
      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Provider usage (recent jobs)</p>
        <div className="admin-provider-chart">
          {Object.entries(providerCounts).map(([provider, count]) => {
            const pct = Math.round((count / stats.recentJobs.length) * 100);
            return (
              <div key={provider} className="admin-provider-chart__row">
                <span className="admin-provider-chart__name">{provider}</span>
                <div className="admin-provider-chart__track">
                  <div className="admin-provider-chart__bar" style={{ width: `${pct}%` }} />
                </div>
                <span className="admin-provider-chart__pct">{pct}%</span>
                <span className="admin-provider-chart__count">({count})</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Errors */}
      {failedJobs.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <p className="admin-section-label admin-section-label--error">Recent errors (last 5 failed jobs)</p>
          <div className="admin-table-wrap">
            <div className="admin-table-row admin-table-row--header" style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
              <span className="admin-table-cell admin-table-cell--head">Prompt / User</span>
              <span className="admin-table-cell admin-table-cell--head">Mode</span>
              <span className="admin-table-cell admin-table-cell--head">Provider</span>
              <span className="admin-table-cell admin-table-cell--head">Time</span>
            </div>
            {failedJobs.map((job, i) => (
              <div key={job.id} className={`admin-table-row admin-table-row--error ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`} style={{ gridTemplateColumns: '2fr 1fr 1fr auto' }}>
                <div>
                  <p className="admin-table-cell" style={{ margin: 0 }}>{job.prompt.slice(0, 60)}</p>
                  <p className="admin-table-cell admin-table-cell--faint" style={{ margin: '0.1rem 0 0', fontSize: '0.7rem' }}>{job.user?.email ?? 'guest'}</p>
                </div>
                <span className={`admin-table-cell ${job.provider === 'replicate' ? 'admin-table-cell--hd' : 'admin-table-cell--std'}`}>{job.provider}</span>
                <span className="admin-table-cell admin-table-cell--fail">failed</span>
                <span className="admin-table-cell admin-table-cell--faint">{formatDate(job.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section style={{ marginBottom: '2rem' }}>
        <p className="admin-section-label">Quick Actions</p>
        {actionMsg && <p className="admin-action-msg">{actionMsg}</p>}
        <div className="admin-quick-actions">
          <button type="button" className="admin-action-btn" onClick={() => quickAction('reset_stuck_jobs')}>
            Reset Stuck Jobs
          </button>
          <button type="button" className="admin-action-btn" onClick={() => quickAction('clear_rate_limits')}>
            Clear Rate Limits
          </button>
          <a href="/api/admin/users/export.csv" className="admin-action-btn" download>
            Export User CSV
          </a>
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
              <span className="admin-table-cell admin-table-cell--faint">{formatDate(job.createdAt)}</span>
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
          <span className="admin-table-cell">{formatNumber(u.jobCount)}</span>
          <span className="admin-table-cell admin-table-cell--muted">{u.lastActive ? formatDate(u.lastActive) : 'Never'}</span>
          <span className="admin-table-cell admin-table-cell--faint">{formatDate(u.createdAt)}</span>
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
        <StatCard label="Total" value={formatNumber(stats.jobs.total)} />
        <StatCard label="Today" value={formatNumber(stats.jobs.today)} />
        <StatCard label="HD jobs" value={formatNumber(stats.jobs.hd)} sub="Replicate provider" />
        <StatCard label="Standard" value={formatNumber(stats.jobs.standard)} sub="Pollinations + others" />
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
            <span className="admin-table-cell admin-table-cell--faint">{formatDate(job.createdAt)}</span>
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

/* ── Provider Health tab ─────────────────────────────────────────────────── */

function ProviderHealthTab({ stats }: { stats: Stats }) {
  const entries = stats.providerHealth ?? [];

  return (
    <>
      <p className="admin-section-label" style={{ marginBottom: '1rem' }}>
        Provider health — last 24 hours
      </p>
      <div className="admin-system-grid">
        {entries.map(entry => {
          const status = !entry.configured ? 'unconfigured' : entry.degraded ? 'degraded' : 'ok';
          return (
            <div key={entry.provider} className="admin-system-card">
              <div className={`admin-system-card__dot ${
                status === 'ok'           ? 'admin-system-card__dot--ok' :
                status === 'degraded'     ? 'admin-system-card__dot--fail' :
                                            'admin-system-card__dot--warn'
              }`} />
              <div>
                <p className="admin-system-card__label" style={{ textTransform: 'capitalize' }}>
                  {entry.provider}
                </p>
                <p className="admin-system-card__sub">
                  {!entry.configured
                    ? 'Not configured'
                    : entry.degraded
                      ? `Degraded — ${entry.failures24h} failures (circuit open)`
                      : `OK — ${entry.failures24h} failure${entry.failures24h !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          );
        })}
        {entries.length === 0 && (
          <p className="admin-table-cell admin-table-cell--faint">No provider data available.</p>
        )}
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
              <button type="button"
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
          {tab === 'charts'   && <AdminCharts />}
          {tab === 'system'   && <SystemTab />}
          {tab === 'health'   && <ProviderHealthTab stats={stats} />}
        </>
      )}
    </main>
  );
}
