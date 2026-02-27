'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface ChartsData {
  dailyVolume: { date: string; count: number }[];
  providerBreakdown: { provider: string; count: number }[];
  latencyP50: number;
  latencyP95: number;
}

export default function AdminCharts() {
  const [data, setData]       = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/charts')
      .then(r => r.ok ? r.json() : r.json().then((d: { error?: string }) => Promise.reject(d.error ?? `HTTP ${r.status}`)))
      .then(setData)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-loading">Loading charts…</p>;
  if (error)   return <div className="admin-error">{error}</div>;
  if (!data)   return null;

  const chartStyle = { background: 'var(--surface-card)', borderRadius: 8, padding: '1rem' };
  // Recharts SVG attrs don't support CSS vars — use matching token values
  const C = {
    grid:    '#252538',
    axis:    '#8888aa',
    accent:  '#818cf8',
    blue:    '#60a5fa',
    tooltip: { bg: 'var(--surface-raised)', border: 'var(--border)', text: 'var(--text)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <p className="admin-section-label">Daily generation volume (last 7 days)</p>
        <div style={chartStyle}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dailyVolume} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: C.tooltip.bg, border: `1px solid ${C.tooltip.border}`, borderRadius: 6, color: C.tooltip.text }}
                labelStyle={{ color: C.accent }}
              />
              <Line type="monotone" dataKey="count" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 3 }} activeDot={{ r: 5 }} name="Generations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <p className="admin-section-label">Provider distribution (last 7 days)</p>
        <div style={chartStyle}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.providerBreakdown} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="provider" tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: C.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: C.tooltip.bg, border: `1px solid ${C.tooltip.border}`, borderRadius: 6, color: C.tooltip.text }}
                labelStyle={{ color: C.blue }}
              />
              <Legend wrapperStyle={{ color: C.axis, fontSize: 11 }} />
              <Bar dataKey="count" fill={C.blue} radius={[3, 3, 0, 0]} name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {(data.latencyP50 > 0 || data.latencyP95 > 0) && (
        <section>
          <p className="admin-section-label">Latency (last 7 days)</p>
          <div className="admin-grid">
            <div className="admin-stat-card">
              <p className="admin-stat-card__label">P50</p>
              <p className="admin-stat-card__value">{data.latencyP50.toLocaleString()} ms</p>
            </div>
            <div className="admin-stat-card">
              <p className="admin-stat-card__label">P95</p>
              <p className="admin-stat-card__value">{data.latencyP95.toLocaleString()} ms</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
