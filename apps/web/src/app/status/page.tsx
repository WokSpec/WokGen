'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProviderStatus {
  name: string;
  displayName: string;
  configured: boolean;
  available: boolean;
  degraded: boolean;
  failures24h: number;
  responseTime?: number;
}

interface HealthData {
  status: 'ok' | 'degraded' | 'outage';
  providers?: { name: string; configured: boolean; degraded: boolean; failures24h?: number }[];
  checkedAt: string;
}

const PROVIDER_DISPLAY: Record<string, string> = {
  replicate:    'Replicate',
  fal:          'FAL.ai',
  together:     'Together.ai',
  pollinations: 'Pollinations',
  stablehorde:  'Stable Horde',
  groq:         'Groq',
};

const ALL_PROVIDERS = Object.keys(PROVIDER_DISPLAY);

function statusLabel(p: ProviderStatus): { label: string; cls: string } {
  if (!p.configured)  return { label: 'Not Configured', cls: 'status-dot--gray' };
  if (!p.available)   return { label: 'Outage',          cls: 'status-dot--red'  };
  if (p.degraded)     return { label: 'Degraded',        cls: 'status-dot--yellow' };
  return { label: 'Operational', cls: 'status-dot--green' };
}

function statusEmoji(p: ProviderStatus) {
  if (!p.configured) return '—';
  if (!p.available)  return 'DOWN';
  if (p.degraded)    return 'DEGRADED';
  return 'OK';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [healthRes, providersRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/providers'),
      ]);

      const healthData: HealthData = healthRes.ok
        ? await healthRes.json().catch(() => ({ status: 'ok', checkedAt: new Date().toISOString() }))
        : { status: 'ok', checkedAt: new Date().toISOString() };

      const providersData = providersRes.ok
        ? await providersRes.json().catch(() => ({})) as { providers?: { name: string; available?: boolean; degraded?: boolean; configured?: boolean }[] }
        : {};

      const providerMap: Record<string, Partial<ProviderStatus>> = {};

      // Merge health data
      if (healthData.providers) {
        for (const p of healthData.providers) {
          providerMap[p.name] = {
            ...providerMap[p.name],
            configured: p.configured,
            degraded:   p.degraded,
            failures24h: p.failures24h ?? 0,
          };
        }
      }

      // Merge providers data
      if (providersData.providers) {
        for (const p of providersData.providers) {
          providerMap[p.name] = {
            ...providerMap[p.name],
            available:  p.available ?? true,
            configured: p.configured ?? providerMap[p.name]?.configured ?? false,
            degraded:   p.degraded   ?? providerMap[p.name]?.degraded   ?? false,
          };
        }
      }

      const merged: ProviderStatus[] = ALL_PROVIDERS.map(name => ({
        name,
        displayName: PROVIDER_DISPLAY[name] ?? name,
        configured:  providerMap[name]?.configured  ?? false,
        available:   providerMap[name]?.available   ?? (providerMap[name]?.configured ?? false),
        degraded:    providerMap[name]?.degraded    ?? false,
        failures24h: providerMap[name]?.failures24h ?? 0,
        responseTime: providerMap[name]?.responseTime,
      }));

      setProviders(merged);
      setCheckedAt(new Date(healthData.checkedAt ?? Date.now()));
    } catch {
      setError('Failed to load status data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const minutesAgo = checkedAt
    ? Math.floor((Date.now() - checkedAt.getTime()) / 60000)
    : null;

  const operationalCount = providers.filter(p => p.configured && p.available && !p.degraded).length;
  const degradedCount    = providers.filter(p => p.degraded).length;
  const outageCount      = providers.filter(p => p.configured && !p.available).length;

  const overallStatus = outageCount > 0 ? 'outage' : degradedCount > 0 ? 'degraded' : 'operational';

  return (
    <main className="devplatform-page devplatform-status-page">
      <div className="devplatform-page__header">
        <div>
          <h1 className="devplatform-page__title">Platform Status</h1>
          <p className="devplatform-page__subtitle">
            Real-time status of all generation providers.
          </p>
        </div>
        <button className="devplatform-btn-ghost" onClick={load} disabled={loading}>
          {loading ? 'Refreshing…' : '↺ Refresh'}
        </button>
      </div>

      {/* Overall banner */}
      <div className={`devplatform-status-banner devplatform-status-banner--${overallStatus}`}>
        <span className="devplatform-status-banner__emoji">
          {overallStatus === 'operational' ? 'OK' : overallStatus === 'degraded' ? 'DEGRADED' : 'DOWN'}
        </span>
        <div>
          <p className="devplatform-status-banner__title">
            {overallStatus === 'operational'
              ? 'All systems operational'
              : overallStatus === 'degraded'
              ? 'Some providers degraded'
              : 'Provider outage detected'}
          </p>
          <p className="devplatform-status-banner__sub">
            {operationalCount} operational · {degradedCount} degraded · {outageCount} outage
            {minutesAgo !== null && ` · Last checked: ${minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`}`}
          </p>
        </div>
      </div>

      {error && <div className="devplatform-error">{error}</div>}

      {loading ? (
        <div className="devplatform-status-grid">
          {ALL_PROVIDERS.map(name => (
            <div key={name} className="status-card status-card--skeleton">
              <div className="status-card__skeleton-dot" />
              <div className="status-card__skeleton-text" />
            </div>
          ))}
        </div>
      ) : (
        <div className="devplatform-status-grid">
          {providers.map(p => {
            const { label, cls } = statusLabel(p);
            return (
              <div key={p.name} className={`status-card${!p.configured ? ' status-card--unconfigured' : ''}`}>
                <div className="status-card__header">
                  <span className="status-card__emoji">{statusEmoji(p)}</span>
                  <span className={`status-dot ${cls}`} />
                </div>
                <h3 className="status-card__name">{p.displayName}</h3>
                <p className={`status-card__label status-card__label--${overallStatus}`}>{label}</p>
                {p.failures24h > 0 && (
                  <p className="status-card__failures">{p.failures24h} failure{p.failures24h !== 1 ? 's' : ''} (24h)</p>
                )}
                {p.responseTime !== undefined && (
                  <p className="status-card__response-time">{p.responseTime}ms avg</p>
                )}
                {!p.configured && (
                  <p className="status-card__unconfigured-note">API key not configured</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="devplatform-status-footer">
        For incident history and uptime reports, see{' '}
        <a href="/docs" className="devplatform-link">our documentation</a>.
      </p>
    </main>
  );
}
