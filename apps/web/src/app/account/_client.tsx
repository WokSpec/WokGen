'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'profile' | 'compute' | 'usage' | 'preferences';

interface Props {
  user: { name: string | null; email: string | null; image: string | null };
}

interface UsageSummary {
  today:     { total: number; hd: number; standard: number };
  thisMonth: { total: number; hd: number; standard: number };
  allTime:   { total: number; hd: number; standard: number };
  quota: { todayUsed: number; dailyLimit: number };
}

interface NotifPrefs {
  notifyEmailJobDone:  boolean;
  notifyEmailComment:  boolean;
  notifyEmailDigest:   boolean;
  notifyInAppQuota:    boolean;
  notifyInAppLevelUp:  boolean;
}

interface ComputeSettings {
  comfyUrl:  string;
  ollamaUrl: string;
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile',     label: 'Profile' },
    { id: 'compute',     label: 'Compute' },
    { id: 'usage',       label: 'Usage' },
    { id: 'preferences', label: 'Preferences' },
  ];
  return (
    <div className="acct-tabs">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`acct-tab${active === t.id ? ' acct-tab--active' : ''}`}
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
        </div>
      </div>

      <div className="acct-field-group">
        <label className="acct-label">Display Name</label>
        <input className="acct-input acct-input--readonly" value={user.name ?? ''} readOnly />
      </div>
      <div className="acct-field-group">
        <label className="acct-label">Email</label>
        <input className="acct-input acct-input--readonly" value={user.email ?? ''} readOnly />
        <p className="acct-help">Email is managed through your OAuth provider.</p>
      </div>

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

// ─── Compute Tab ─────────────────────────────────────────────────────────────

function ComputeTab() {
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

  const handleSave = async () => {
    setSaving(true);
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
        <input
          className="acct-input"
          type="url"
          placeholder="http://localhost:8188"
          value={settings.comfyUrl}
          onChange={e => setSettings(s => ({ ...s, comfyUrl: e.target.value }))}
        />
        <p className="acct-help">Image generation via ComfyUI running on your machine.</p>
      </div>

      <div className="acct-field-group">
        <label className="acct-label">Ollama Endpoint</label>
        <input
          className="acct-input"
          type="url"
          placeholder="http://localhost:11434"
          value={settings.ollamaUrl}
          onChange={e => setSettings(s => ({ ...s, ollamaUrl: e.target.value }))}
        />
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
        </>
      ) : (
        <p className="acct-empty">No generation history yet. <Link href="/pixel/studio" className="acct-link">Open Studio →</Link></p>
      )}

      <div className="acct-divider" />
      <h2 className="acct-section-title">Developer</h2>
      <div className="acct-dev-links">
        <Link href="/account/api-keys" className="acct-dev-card">
          <span className="acct-dev-card-icon">🔑</span>
          <div>
            <p className="acct-dev-card-title">API Keys</p>
            <p className="acct-dev-card-desc">Manage personal access tokens</p>
          </div>
          <span className="acct-dev-card-arrow">→</span>
        </Link>
        <Link href="/account/usage" className="acct-dev-card">
          <span className="acct-dev-card-icon">📊</span>
          <div>
            <p className="acct-dev-card-title">Full Usage Report</p>
            <p className="acct-dev-card-desc">Request log, mode breakdown, charts</p>
          </div>
          <span className="acct-dev-card-arrow">→</span>
        </Link>
        <Link href="/automations" className="acct-dev-card">
          <span className="acct-dev-card-icon">⚙️</span>
          <div>
            <p className="acct-dev-card-title">Webhooks & Automations</p>
            <p className="acct-dev-card-desc">Scheduled triggers and outbound webhooks</p>
          </div>
          <span className="acct-dev-card-arrow">→</span>
        </Link>
      </div>
    </div>
  );
}

// ─── Preferences Tab ─────────────────────────────────────────────────────────

function PreferencesTab() {
  const [prefs,   setPrefs]   = useState<NotifPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.settings) setPrefs(d.settings); })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof NotifPrefs) => {
    setPrefs(p => p ? { ...p, [key]: !p[key] } : p);
  };

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    await fetch('/api/settings/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prefs),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) return <div className="acct-loading">Loading…</div>;
  if (!prefs)  return <div className="acct-loading">Could not load preferences.</div>;

  const notifItems: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'notifyEmailJobDone',  label: 'Email: generation complete', desc: 'Receive an email when a long job finishes.' },
    { key: 'notifyEmailComment',  label: 'Email: new comment',         desc: 'Email when someone comments on your asset.' },
    { key: 'notifyEmailDigest',   label: 'Email: weekly digest',       desc: 'A weekly summary of your activity.' },
    { key: 'notifyInAppQuota',    label: 'In-app: quota warnings',     desc: 'Notify when you approach daily limits.' },
    { key: 'notifyInAppLevelUp',  label: 'In-app: milestones',         desc: 'Celebrate generation milestones.' },
  ];

  return (
    <div className="acct-section">
      <h2 className="acct-section-title">Notifications</h2>
      <div className="acct-notif-list">
        {notifItems.map(item => (
          <div key={item.key} className="acct-notif-row">
            <div className="acct-notif-text">
              <p className="acct-notif-label">{item.label}</p>
              <p className="acct-notif-desc">{item.desc}</p>
            </div>
            <button
              role="switch"
              aria-checked={prefs[item.key]}
              className={`acct-toggle${prefs[item.key] ? ' acct-toggle--on' : ''}`}
              onClick={() => toggle(item.key)}
            >
              <span className="acct-toggle-thumb" />
            </button>
          </div>
        ))}
      </div>

      <div className="acct-divider" />

      <button className="acct-btn-primary" onClick={save} disabled={saving || !prefs}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save preferences'}
      </button>

      <div className="acct-divider" />
      <h2 className="acct-section-title">Links</h2>
      <div className="acct-pref-links">
        <Link href="/settings" className="acct-link">Advanced notification routing →</Link>
        <Link href="/docs" className="acct-link">Documentation →</Link>
        <Link href="/open-source" className="acct-link">Open-source models powering WokGen →</Link>
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
        <p className="acct-subtitle">Manage your profile, compute settings, and preferences.</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      <div className="acct-content">
        {tab === 'profile'     && <ProfileTab     user={user} />}
        {tab === 'compute'     && <ComputeTab />}
        {tab === 'usage'       && <UsageTab />}
        {tab === 'preferences' && <PreferencesTab />}
      </div>
    </main>
  );
}
