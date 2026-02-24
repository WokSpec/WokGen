'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface ToolCount {
  tool:  string;
  count: number;
}

interface RecentUser {
  id:        string;
  email:     string;
  name:      string | null;
  createdAt: string;
}

interface Metrics {
  totalUsers:    number;
  newUsers7d:    number;
  totalJobs:     number;
  jobs24h:       number;
  activeUsers7d: number;
  topTools:      ToolCount[];
  recentSignups: RecentUser[];
  generatedAt:   string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value}</p>
      {sub && <p className="admin-stat-card__sub">{sub}</p>}
    </div>
  );
}

export default function MetricsDashboard() {
  const [data, setData]       = useState<Metrics | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/metrics')
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? `HTTP ${r.status}`)))
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const maxToolCount = data?.topTools[0]?.count ?? 1;

  return (
    <main className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-header__title">Platform Metrics</h1>
          {data && (
            <p className="admin-header__sub">
              Last updated {new Date(data.generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="admin-action-btn" onClick={load}>Refresh</button>
          <Link href="/admin" className="admin-header__back">← Admin</Link>
        </div>
      </div>

      {loading && <p className="admin-loading">Loading metrics…</p>}
      {error   && <div className="admin-error">{error}</div>}

      {data && !loading && (
        <>
          {/* ── Stats row ── */}
          <section style={{ marginBottom: '2rem' }}>
            <p className="admin-section-label">Platform overview</p>
            <div className="admin-grid">
              <StatCard label="Total users"       value={data.totalUsers.toLocaleString()} />
              <StatCard label="New users (7d)"    value={data.newUsers7d.toLocaleString()} sub="last 7 days" />
              <StatCard label="Total generations" value={data.totalJobs.toLocaleString()} />
              <StatCard label="Generations (24h)" value={data.jobs24h.toLocaleString()} sub="last 24 hours" />
              <StatCard label="Active users (7d)" value={data.activeUsers7d.toLocaleString()} sub="≥1 job in 7d" />
            </div>
          </section>

          {/* ── Top tools bar chart ── */}
          {data.topTools.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <p className="admin-section-label">Top tools by usage</p>
              <div className="admin-provider-chart">
                {data.topTools.map(row => {
                  const pct = Math.round((row.count / maxToolCount) * 100);
                  return (
                    <div key={row.tool} className="admin-provider-chart__row">
                      <span className="admin-provider-chart__name">{row.tool}</span>
                      <div className="admin-provider-chart__track">
                        <div className="admin-provider-chart__bar" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="admin-provider-chart__pct">{row.count.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Recent signups ── */}
          <section>
            <p className="admin-section-label">Recent signups</p>
            <div className="admin-table-wrap">
              <div
                className="admin-table-row admin-table-row--header"
                style={{ gridTemplateColumns: '2fr 1fr auto' }}
              >
                <span className="admin-table-cell admin-table-cell--head">User</span>
                <span className="admin-table-cell admin-table-cell--head">Email</span>
                <span className="admin-table-cell admin-table-cell--head">Joined</span>
              </div>
              {data.recentSignups.map((u, i) => (
                <div
                  key={u.id}
                  className={`admin-table-row ${i % 2 === 0 ? 'admin-table-row--odd' : 'admin-table-row--even'}`}
                  style={{ gridTemplateColumns: '2fr 1fr auto' }}
                >
                  <span className="admin-table-cell">{u.name ?? '—'}</span>
                  <span className="admin-table-cell admin-table-cell--muted">{u.email}</span>
                  <span className="admin-table-cell admin-table-cell--faint">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
