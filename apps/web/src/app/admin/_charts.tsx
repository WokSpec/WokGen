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

  const chartStyle = { background: '#0d0d14', borderRadius: 8, padding: '1rem' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <section>
        <p className="admin-section-label">Daily generation volume (last 7 days)</p>
        <div style={chartStyle}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dailyVolume} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="date" tick={{ fill: '#8888aa', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#12121e', border: '1px solid #252538', borderRadius: 6, color: '#e0e0f0' }}
                labelStyle={{ color: '#a78bfa' }}
              />
              <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} dot={{ fill: '#a78bfa', r: 3 }} activeDot={{ r: 5 }} name="Generations" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <p className="admin-section-label">Provider distribution (last 7 days)</p>
        <div style={chartStyle}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.providerBreakdown} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252538" />
              <XAxis dataKey="provider" tick={{ fill: '#8888aa', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#8888aa', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#12121e', border: '1px solid #252538', borderRadius: 6, color: '#e0e0f0' }}
                labelStyle={{ color: '#4f8ef7' }}
              />
              <Legend wrapperStyle={{ color: '#8888aa', fontSize: 11 }} />
              <Bar dataKey="count" fill="#4f8ef7" radius={[3, 3, 0, 0]} name="Jobs" />
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
