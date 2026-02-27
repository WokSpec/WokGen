'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface AllStats {
  generation: QueueStats;
  cleanup: QueueStats;
}

export default function AdminJobsPage() {
  const [stats, setStats] = useState<AllStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Queue stats via the admin stats endpoint
    fetch('/api/admin/stats')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        // Placeholder counts — a dedicated /api/admin/queues endpoint can be wired later
        setStats({
          generation: { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
          cleanup:    { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 },
        });
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const queues = [
    { name: 'Generation Queue', key: 'generation' as const },
    { name: 'Cleanup Queue',    key: 'cleanup'    as const },
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Job Queues</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>BullMQ queue status and management</p>
        </div>
        <Link href="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>← Admin</Link>
      </div>

      {loading && <p style={{ color: 'var(--text-muted)' }}>Loading…</p>}

      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {queues.map(queue => {
              const s = stats?.[queue.key] ?? { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
              return (
                <div key={queue.key} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>{queue.name}</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {[
                      { label: 'Waiting',   value: s.waiting,   color: 'var(--yellow)' },
                      { label: 'Active',    value: s.active,    color: 'var(--blue)' },
                      { label: 'Completed', value: s.completed, color: 'var(--green)' },
                      { label: 'Failed',    value: s.failed,    color: 'var(--danger)' },
                    ].map(stat => (
                      <div key={stat.label} style={{ padding: '0.75rem', border: '1px solid var(--surface-raised)', borderRadius: '8px', background: 'var(--surface-card)' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Queue Notes</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              WokGen uses BullMQ backed by Redis (Upstash). Generation jobs are processed by the worker process.
              Failed jobs are retained for 200 counts, completed jobs for 100 counts.
              For full queue inspection, connect directly to Redis or use Bull Board.
            </p>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.625rem' }}>
              <Link href="/api/health" target="_blank" style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none' }}>
                View Health Endpoint
              </Link>
              <span style={{ color: 'var(--border)' }}>·</span>
              <Link href="/admin/metrics" style={{ fontSize: '0.875rem', color: 'var(--accent)', textDecoration: 'none' }}>
                Platform Metrics
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
