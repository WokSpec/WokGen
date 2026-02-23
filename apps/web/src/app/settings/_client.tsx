'use client';

import { useState, useEffect } from 'react';

interface NotifySettings {
  notifyEmailJobDone:  boolean;
  notifyEmailComment:  boolean;
  notifyEmailDigest:   boolean;
  notifyInAppQuota:    boolean;
  notifyInAppLevelUp:  boolean;
  notifyAdminChannel:  string;
  notifyWebhookUrl:    string | null;
}

const DEFAULTS: NotifySettings = {
  notifyEmailJobDone:  true,
  notifyEmailComment:  true,
  notifyEmailDigest:   false,
  notifyInAppQuota:    true,
  notifyInAppLevelUp:  true,
  notifyAdminChannel:  'email',
  notifyWebhookUrl:    null,
};

function Toggle({
  label, description, value, onChange,
}: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="notify-toggle-row">
      <div className="notify-toggle-row__text">
        <span className="notify-toggle-row__label">{label}</span>
        {description && <span className="notify-toggle-row__desc">{description}</span>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        className={`notify-toggle ${value ? 'notify-toggle--on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="notify-toggle__thumb" />
      </button>
    </div>
  );
}

export default function NotificationSettingsClient() {
  const [settings, setSettings] = useState<NotifySettings>(DEFAULTS);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(r => r.json())
      .then(d => { setSettings({ ...DEFAULTS, ...d.settings }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof NotifySettings, value: boolean | string | null) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Save failed'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="notify-page">
      <div className="notify-page__loading">Loading settings…</div>
    </div>
  );

  return (
    <div className="notify-page">
      <div className="notify-page__header">
        <h1 className="notify-page__title">Notification Settings</h1>
        <p className="notify-page__subtitle">Choose how and where WokGen keeps you informed.</p>
      </div>

      <div className="notify-sections">

        {/* Email notifications */}
        <div className="notify-section">
          <div className="notify-section__header">
            <span className="notify-section__icon">@</span>
            <div>
              <h2 className="notify-section__title">Email</h2>
              <p className="notify-section__desc">Emails go to your account address.</p>
            </div>
          </div>
          <div className="notify-section__body">
            <Toggle
              label="Job complete"
              description="Get an email when a long-running job finishes"
              value={settings.notifyEmailJobDone}
              onChange={v => update('notifyEmailJobDone', v)}
            />
            <Toggle
              label="New comment on asset"
              description="Someone leaves a note on one of your assets"
              value={settings.notifyEmailComment}
              onChange={v => update('notifyEmailComment', v)}
            />
            <Toggle
              label="Weekly digest"
              description="A summary of your project activity every Monday"
              value={settings.notifyEmailDigest}
              onChange={v => update('notifyEmailDigest', v)}
            />
          </div>
        </div>

        {/* In-app notifications */}
        <div className="notify-section">
          <div className="notify-section__header">
            <span className="notify-section__icon">!</span>
            <div>
              <h2 className="notify-section__title">In-app</h2>
              <p className="notify-section__desc">Alerts shown inside WokGen.</p>
            </div>
          </div>
          <div className="notify-section__body">
            <Toggle
              label="Quota warning"
              description="Alert when you reach 80% of your daily generation limit"
              value={settings.notifyInAppQuota}
              onChange={v => update('notifyInAppQuota', v)}
            />
            <Toggle
              label="Level up / milestone"
              description="Celebrate when you hit generation or project milestones"
              value={settings.notifyInAppLevelUp}
              onChange={v => update('notifyInAppLevelUp', v)}
            />
          </div>
        </div>

        {/* Advanced routing */}
        <div className="notify-section">
          <div className="notify-section__header">
            <span className="notify-section__icon">»</span>
            <div>
              <h2 className="notify-section__title">Advanced routing</h2>
              <p className="notify-section__desc">Where important system alerts get sent.</p>
            </div>
          </div>
          <div className="notify-section__body">
            <div className="notify-field">
              <label className="notify-field__label">Alert channel</label>
              <div className="notify-channel-options">
                {(['email', 'webhook', 'both', 'none'] as const).map(ch => (
                  <button
                    key={ch}
                    className={`notify-channel-btn ${settings.notifyAdminChannel === ch ? 'notify-channel-btn--active' : ''}`}
                    onClick={() => update('notifyAdminChannel', ch)}
                  >
                    {ch === 'email'   && 'Email'}
                    {ch === 'webhook' && 'Webhook'}
                    {ch === 'both'    && 'Both'}
                    {ch === 'none'    && 'None'}
                  </button>
                ))}
              </div>
            </div>
            {(settings.notifyAdminChannel === 'webhook' || settings.notifyAdminChannel === 'both') && (
              <div className="notify-field">
                <label className="notify-field__label">Webhook URL</label>
                <input
                  className="input"
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={settings.notifyWebhookUrl ?? ''}
                  onChange={e => update('notifyWebhookUrl', e.target.value || null)}
                />
                <span className="notify-field__hint">
                  POST JSON payload: <code>{`{ type, message, userId }`}</code>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <p className="notify-error">{error}</p>}

      <div className="notify-page__footer">
        <button className="btn btn--primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
        {saved && <span className="notify-saved">✓ Saved</span>}
      </div>
    </div>
  );
}
