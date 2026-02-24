'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'usage' | 'apikeys' | 'integrations' | 'byoc';

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
}

interface UsageSummary {
  today:     { total: number; hd: number; standard: number };
  thisMonth: { total: number; hd: number; standard: number };
  allTime:   { total: number; hd: number; standard: number };
  quota: { todayUsed: number; dailyLimit: number };
  daily?: { date: string; total: number; hd: number; standard: number }[];
}

interface ComputeSettings {
  comfyUrl:  string;
  ollamaUrl: string;
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',      label: 'Profile'      },
    { id: 'usage',        label: 'Usage'        },
    { id: 'apikeys',      label: 'API Keys'     },
    { id: 'integrations', label: 'Integrations' },
    { id: 'byoc',         label: 'BYOC'         },
  ];
  return (
    <div className="account-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`account-tab${active === t.id ? ' account-tab--active' : ''}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: Props['user'] }) {
  const initials = ((user.name ?? user.email ?? 'U')[0] ?? 'U').toUpperCase();
  const [displayName, setDisplayName] = useState(user.name ?? '');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: displayName, bio }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="acct-section">
      <div className="acct-profile-row">
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? ''} className="acct-avatar" />
        ) : (
          <div className="acct-avatar acct-avatar--initials">{initials}</div>
        )}
        <div className="acct-profile-info">
          <p className="acct-profile-name">{user.name ?? '—'}</p>
          <p className="acct-profile-email">{user.email ?? '—'}</p>
          {user.image && (
            <p className="acct-help" style={{ marginTop: '4px' }}>Avatar synced from GitHub</p>
          )}
        </div>
      </div>

      <div className="acct-field-group">
        <label className="acct-label">Display Name</label>
        <input
          className="acct-input"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />
      </div>
      <div className="acct-field-group">
        <label className="acct-label">Email</label>
        <input className="acct-input acct-input--readonly" value={user.email ?? ''} readOnly />
        <p className="acct-help">Email is managed through your OAuth provider.</p>
      </div>
      <div className="acct-field-group">
        <label className="acct-label">Bio</label>
        <textarea
          className="acct-textarea"
          rows={3}
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell the community about yourself…"
        />
      </div>
      <div className="acct-field-group">
        <label className="acct-label">Public Profile</label>
        <div className="acct-profile-link-row">
          <span className="acct-profile-link-prefix">wokgen.ai/profile/</span>
          <Link href="/profile" className="acct-link">View your profile →</Link>
        </div>
      </div>

      <button className="acct-btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
      </button>

      <div className="acct-divider" />

      <button
        className="acct-btn-danger"
        onClick={() => signOut({ callbackUrl: '/' })}
      >
        Sign out
      </button>
    </div>
  );
}

// ─── BYOC Tab ─────────────────────────────────────────────────────────────────

function BYOCTab() {
  const [settings, setSettings] = useState<ComputeSettings>({ comfyUrl: '', ollamaUrl: '' });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    fetch('/api/compute')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSettings(d); })
      .finally(() => setLoading(false));
  }, []);

  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const testEndpoint = async (type: 'comfyUrl' | 'ollamaUrl') => {
    const url = settings[type];
    if (!url) return;
    setTesting(type);
    const res = await fetch('/api/compute/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, url }),
    });
    setTesting(null);
    const d = await res.json().catch(() => ({})) as { ok?: boolean; models?: string[]; error?: string };
    setTestResult(r => ({
      ...r,
      [type]: res.ok && d.ok
        ? `✓ Connected${d.models ? ` — ${d.models.length} models detected` : ''}`
        : `✗ ${d.error ?? 'Connection failed'}`,
    }));
  };

  const handleSave = async () => {
    await fetch('/api/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="acct-loading">Loading…</div>;

  return (
    <div className="acct-section">
      <div className="acct-compute-hero">
        <div className="acct-compute-icon">⚡</div>
        <div>
          <h2 className="acct-compute-title">Connect your own GPU</h2>
          <p className="acct-compute-desc">
            WokGen will route requests to your hardware when available,
            giving you unlimited generations with zero quota.
          </p>
        </div>
      </div>

      <div className="acct-field-group">
        <label className="acct-label">ComfyUI Endpoint</label>
        <div className="acct-input-with-action">
          <input
            className="acct-input"
            type="url"
            placeholder="http://localhost:8188"
            value={settings.comfyUrl}
            onChange={e => setSettings(s => ({ ...s, comfyUrl: e.target.value }))}
          />
          <button
            className="acct-btn-ghost-sm"
            onClick={() => testEndpoint('comfyUrl')}
            disabled={!settings.comfyUrl || testing === 'comfyUrl'}
          >
            {testing === 'comfyUrl' ? 'Testing…' : 'Test'}
          </button>
        </div>
        {testResult.comfyUrl && <p className="acct-help">{testResult.comfyUrl}</p>}
        <p className="acct-help">Image generation via ComfyUI running on your machine.</p>
      </div>

      <div className="acct-field-group">
        <label className="acct-label">Ollama Endpoint</label>
        <div className="acct-input-with-action">
          <input
            className="acct-input"
            type="url"
            placeholder="http://localhost:11434"
            value={settings.ollamaUrl}
            onChange={e => setSettings(s => ({ ...s, ollamaUrl: e.target.value }))}
          />
          <button
            className="acct-btn-ghost-sm"
            onClick={() => testEndpoint('ollamaUrl')}
            disabled={!settings.ollamaUrl || testing === 'ollamaUrl'}
          >
            {testing === 'ollamaUrl' ? 'Testing…' : 'Test'}
          </button>
        </div>
        {testResult.ollamaUrl && <p className="acct-help">{testResult.ollamaUrl}</p>}
        <p className="acct-help">Local LLM inference via Ollama for Eral and text tools.</p>
      </div>

      <div className="acct-compute-info">
        <span className="acct-compute-info-icon">ℹ</span>
        <p>
          Leave fields blank to use the default cloud providers.
          Your endpoints are stored only for your account and never shared.
          See the{' '}
          <Link href="/docs" className="acct-link">self-hosting guide</Link>
          {' '}for setup instructions.
        </p>
      </div>

      <button className="acct-btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save settings'}
      </button>
    </div>
  );
}

// ─── Usage Tab ───────────────────────────────────────────────────────────────

function UsageTab() {
  const [data,    setData]    = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/usage?limit=1');
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dailyPct = data
    ? (data.quota.dailyLimit > 0
        ? Math.min(100, Math.round((data.quota.todayUsed / data.quota.dailyLimit) * 100))
        : 0)
    : 0;

  return (
    <div className="acct-section">
      <h2 className="acct-section-title">Generation Counters</h2>

      {loading ? (
        <div className="acct-usage-grid">
          {['Today', 'This month', 'All time'].map(l => (
            <div key={l} className="acct-stat-card acct-stat-card--skeleton">
              <span className="acct-stat-label">{l}</span>
              <div className="acct-skeleton-num" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="acct-usage-grid">
            <div className="acct-stat-card">
              <span className="acct-stat-label">Today</span>
              <span className="acct-stat-value">{data.today.total.toLocaleString()}</span>
              <span className="acct-stat-sub">{data.today.standard} std · {data.today.hd} HD</span>
            </div>
            <div className="acct-stat-card">
              <span className="acct-stat-label">This month</span>
              <span className="acct-stat-value">{data.thisMonth.total.toLocaleString()}</span>
              <span className="acct-stat-sub">{data.thisMonth.standard} std · {data.thisMonth.hd} HD</span>
            </div>
            <div className="acct-stat-card">
              <span className="acct-stat-label">All time</span>
              <span className="acct-stat-value">{data.allTime.total.toLocaleString()}</span>
              <span className="acct-stat-sub">{data.allTime.standard} std · {data.allTime.hd} HD</span>
            </div>
          </div>

          {data.quota.dailyLimit > 0 && (
            <div className="acct-quota">
              <div className="acct-quota-header">
                <span className="acct-quota-label">Daily limit</span>
                <span className="acct-quota-value">{data.quota.todayUsed} / {data.quota.dailyLimit}</span>
              </div>
              <div className="acct-quota-track">
                <div
                  className="acct-quota-fill"
                  style={{ width: `${dailyPct}%`, background: dailyPct >= 90 ? '#ef4444' : dailyPct >= 70 ? '#f59e0b' : '#a78bfa' }}
                />
              </div>
            </div>
          )}

          {data.daily && data.daily.length > 0 && (
            <div className="acct-chart-section">
              <h3 className="acct-section-title">Generations — Last 7 Days</h3>
              <div className="usage-chart">
                {data.daily.slice(-7).map((d) => {
                  const max = Math.max(...(data.daily ?? []).slice(-7).map(x => x.total), 1);
                  return (
                    <div key={d.date} className="usage-chart-col">
                      <div className="usage-chart-bars">
                        <div
                          className="usage-chart-bar usage-chart-bar--hd"
                          style={{ height: `${Math.round((d.hd / max) * 100)}%` }}
                          title={`HD: ${d.hd}`}
                        />
                        <div
                          className="usage-chart-bar usage-chart-bar--std"
                          style={{ height: `${Math.round((d.standard / max) * 100)}%` }}
                          title={`Std: ${d.standard}`}
                        />
                      </div>
                      <span className="usage-chart-label">
                        {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="usage-chart-legend">
                <span className="usage-chart-legend__item"><span className="usage-chart-legend__dot usage-chart-legend__dot--hd" />HD</span>
                <span className="usage-chart-legend__item"><span className="usage-chart-legend__dot usage-chart-legend__dot--std" />Standard</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="acct-empty">No generation history yet. <Link href="/pixel/studio" className="acct-link">Open Studio →</Link></p>
      )}

      <div className="acct-divider" />
      <Link href="/account/usage" className="acct-dev-card">
        <span className="acct-dev-card-icon">📊</span>
        <div>
          <p className="acct-dev-card-title">Full Usage Report</p>
          <p className="acct-dev-card-desc">Request log, mode breakdown, detailed charts</p>
        </div>
        <span className="acct-dev-card-arrow">→</span>
      </Link>
    </div>
  );
}

// ─── API Keys Tab ─────────────────────────────────────────────────────────────

interface ApiKey {
  id: string; name: string; keyPrefix: string;
  scopes: string; lastUsedAt: string | null;
  expiresAt: string | null; requestCount: number; createdAt: string;
}

function ApiKeysTab() {
  const [keys,     setKeys]     = useState<ApiKey[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rawKey,   setRawKey]   = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [error,    setError]    = useState('');
  const [formName, setFormName] = useState('');
  const [formScopes, setFormScopes] = useState<string[]>(['generate', 'read']);
  const [formExpiry, setFormExpiry] = useState('never');

  const SCOPE_OPTIONS = ['generate', 'read', 'projects', 'brand', 'eral'];
  const EXPIRY_OPTIONS = [
    { value: 'never', label: 'No expiry' },
    { value: '30d',   label: '30 days'   },
    { value: '90d',   label: '90 days'   },
    { value: '1y',    label: '1 year'    },
  ];

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/keys');
    const data = await res.json().catch(() => ({})) as { keys?: ApiKey[] };
    setKeys(data.keys ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleScope = (s: string) =>
    setFormScopes(sc => sc.includes(s) ? sc.filter(x => x !== s) : [...sc, s]);

  const handleCreate = async () => {
    if (!formName.trim()) { setError('Name is required.'); return; }
    if (!formScopes.length) { setError('Select at least one scope.'); return; }
    setError('');
    setCreating(true);
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formName, scopes: formScopes, expiresIn: formExpiry }),
    });
    const data = await res.json().catch(() => ({})) as { error?: string; rawKey?: string };
    setCreating(false);
    if (!res.ok) { setError(data.error ?? 'Failed to create key.'); return; }
    setRawKey(data.rawKey ?? null);
    setShowForm(false);
    setFormName('');
    setFormScopes(['generate', 'read']);
    load();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key?')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    load();
  };

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString() : '—';

  return (
    <div className="acct-section">
      <div className="account-v2-apikeys-header">
        <h2 className="acct-section-title">API Keys</h2>
        <button className="acct-btn-primary acct-btn-primary--sm" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New Key'}
        </button>
      </div>

      {rawKey && (
        <div className="account-v2-rawkey">
          <p className="account-v2-rawkey__warning">⚠ Copy your key now — it won&apos;t be shown again.</p>
          <div className="account-v2-rawkey__row">
            <code className="account-v2-rawkey__code">{rawKey}</code>
            <button
              className="acct-btn-ghost-sm"
              onClick={() => { navigator.clipboard.writeText(rawKey); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <button className="acct-btn-ghost-sm" onClick={() => setRawKey(null)}>Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="account-v2-keycreate">
          {error && <p className="account-v2-keycreate__error">{error}</p>}
          <div className="acct-field-group">
            <label className="acct-label">Key Name</label>
            <input className="acct-input" placeholder="e.g. My App" value={formName} onChange={e => setFormName(e.target.value)} />
          </div>
          <div className="acct-field-group">
            <label className="acct-label">Scopes</label>
            <div className="account-v2-scopes">
              {SCOPE_OPTIONS.map(s => (
                <label key={s} className="account-v2-scope-label">
                  <input type="checkbox" checked={formScopes.includes(s)} onChange={() => toggleScope(s)} />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="acct-field-group">
            <label className="acct-label">Expiry</label>
            <select className="acct-input" value={formExpiry} onChange={e => setFormExpiry(e.target.value)}>
              {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button className="acct-btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create Key'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="acct-loading">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="acct-empty">No API keys yet. Create one to get started.</p>
      ) : (
        <div className="account-v2-keys-table">
          <div className="account-v2-keys-table__head">
            <span>Name</span><span>Prefix</span><span>Scopes</span><span>Created</span><span>Last used</span><span>Requests</span><span></span>
          </div>
          {keys.map(k => (
            <div key={k.id} className="account-v2-keys-table__row">
              <span className="account-v2-keys-table__name">{k.name}</span>
              <code className="account-v2-keys-table__prefix">{k.keyPrefix}…</code>
              <span className="account-v2-keys-table__scopes">{k.scopes}</span>
              <span className="account-v2-keys-table__date">{fmtDate(k.createdAt)}</span>
              <span className="account-v2-keys-table__date">{k.lastUsedAt ? fmtDate(k.lastUsedAt) : 'Never'}</span>
              <span className="account-v2-keys-table__count">{k.requestCount.toLocaleString()}</span>
              <button className="account-v2-keys-table__revoke" onClick={() => handleRevoke(k.id)}>Revoke</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab() {
  return (
    <div className="acct-section">
      <h2 className="acct-section-title">Connected Services</h2>
      <div className="account-v2-integrations-list">

        <div className="account-v2-integration-card">
          <div className="account-v2-integration-card__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          </div>
          <div className="account-v2-integration-card__info">
            <p className="account-v2-integration-card__name">GitHub</p>
            <p className="account-v2-integration-card__desc">Your account is connected via GitHub OAuth.</p>
          </div>
          <span className="account-v2-integration-card__status account-v2-integration-card__status--connected">Connected</span>
        </div>

        <div className="account-v2-integration-card">
          <div className="account-v2-integration-card__icon account-v2-integration-card__icon--discord">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.175 13.175 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028z"/></svg>
          </div>
          <div className="account-v2-integration-card__info">
            <p className="account-v2-integration-card__name">Discord</p>
            <p className="account-v2-integration-card__desc">Connect Discord to use the WokGen bot in your server.</p>
          </div>
          <button className="acct-btn-ghost-sm">Connect</button>
        </div>

        <div className="account-v2-integration-card">
          <div className="account-v2-integration-card__icon account-v2-integration-card__icon--webhook">🔗</div>
          <div className="account-v2-integration-card__info">
            <p className="account-v2-integration-card__name">Webhooks</p>
            <p className="account-v2-integration-card__desc">Receive HTTP callbacks on generation events.</p>
          </div>
          <Link href="/account/webhooks" className="acct-btn-ghost-sm">Manage →</Link>
        </div>

      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AccountClient({ user }: Props) {
  const [tab, setTab] = useState<Tab>('profile');

  return (
    <main className="acct-page">
      <div className="acct-header">
        <h1 className="acct-title">Account</h1>
        <p className="acct-subtitle">Manage your profile, API keys, integrations, and compute settings.</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      <div className="acct-content">
        {tab === 'profile'      && <ProfileTab     user={user} />}
        {tab === 'usage'        && <UsageTab />}
        {tab === 'apikeys'      && <ApiKeysTab />}
        {tab === 'integrations' && <IntegrationsTab />}
        {tab === 'byoc'         && <BYOCTab />}
      </div>
    </main>
  );
}
