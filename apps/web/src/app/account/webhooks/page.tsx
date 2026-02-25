'use client';

import { useState, useEffect, useCallback } from 'react';
import { relativeTime } from '@/lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastDeliveredAt: string | null;
  lastStatus: 'success' | 'failed' | null;
  createdAt: string;
}

const ALL_EVENTS = [
  { id: 'job.completed', label: 'Job Completed' },
  { id: 'job.failed', label: 'Job Failed' },
  { id: 'quota.warning', label: 'Quota Warning' },
  { id: 'quota.exceeded', label: 'Quota Exceeded' },
];


// ─── Add Webhook Form ─────────────────────────────────────────────────────────

function AddWebhookForm({ onAdded, onCancel }: { onAdded: () => void; onCancel: () => void }) {
  const [url,     setUrl]     = useState('');
  const [secret,  setSecret]  = useState('');
  const [events,  setEvents]  = useState<string[]>(['job.completed']);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const toggleEvent = (ev: string) =>
    setEvents(e => e.includes(ev) ? e.filter(x => x !== ev) : [...e, ev]);

  const handleSubmit = async () => {
    if (!url.trim()) { setError('URL is required.'); return; }
    if (!events.length) { setError('Select at least one event.'); return; }
    setError('');
    setSaving(true);
    const res = await fetch('/api/webhooks', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, events, secret }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({})) as { error?: string };
      setError(d.error ?? 'Failed to create webhook.');
      return;
    }
    onAdded();
  };

  return (
    <div className="devplatform-webhook-form">
      <h2 className="devplatform-webhook-form__title">Add Webhook</h2>
      {error && <p className="devplatform-webhook-form__error">{error}</p>}

      <div className="devplatform-webhook-form__field">
        <label className="devplatform-webhook-form__label">Endpoint URL</label>
        <input
          type="url"
          placeholder="https://example.com/webhooks/wokgen"
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="devplatform-webhook-form__input"
        />
      </div>

      <div className="devplatform-webhook-form__field">
        <label className="devplatform-webhook-form__label">Events</label>
        <div className="devplatform-webhook-form__events">
          {ALL_EVENTS.map(ev => (
            <label key={ev.id} className="devplatform-webhook-form__event">
              <input
                type="checkbox"
                checked={events.includes(ev.id)}
                onChange={() => toggleEvent(ev.id)}
              />
              <span>{ev.label}</span>
              <code className="devplatform-webhook-form__event-id">{ev.id}</code>
            </label>
          ))}
        </div>
      </div>

      <div className="devplatform-webhook-form__field">
        <label className="devplatform-webhook-form__label">Signing Secret <span className="devplatform-webhook-form__optional">(optional)</span></label>
        <input
          type="text"
          placeholder="whsec_..."
          value={secret}
          onChange={e => setSecret(e.target.value)}
          className="devplatform-webhook-form__input"
        />
        <p className="devplatform-webhook-form__help">
          We&apos;ll include an <code>X-WokGen-Signature</code> header signed with this secret.
        </p>
      </div>

      <div className="devplatform-webhook-form__actions">
        <button className="devplatform-btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating…' : 'Create Webhook'}
        </button>
        <button className="devplatform-btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Webhook Card ─────────────────────────────────────────────────────────────

function WebhookCard({ wh, onRefresh }: { wh: Webhook; onRefresh: () => void }) {
  const [testing,  setTesting]  = useState(false);
  const [testMsg,  setTestMsg]  = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestMsg(null);
    const res = await fetch(`/api/webhooks/${wh.id}/test`, { method: 'POST' });
    setTesting(false);
    setTestMsg(res.ok ? '✓ Test delivered' : '✗ Delivery failed');
    setTimeout(() => setTestMsg(null), 4000);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this webhook?')) return;
    setDeleting(true);
    await fetch(`/api/webhooks/${wh.id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className={`webhook-card${!wh.active ? ' webhook-card--inactive' : ''}`}>
      <div className="webhook-card__header">
        <div className="webhook-card__url-row">
          <span className={`webhook-card__status-dot ${wh.active ? 'webhook-card__status-dot--active' : 'webhook-card__status-dot--inactive'}`} />
          <span className="webhook-card__url">{wh.url}</span>
          <span className={`webhook-card__badge ${wh.active ? 'webhook-card__badge--active' : 'webhook-card__badge--inactive'}`}>
            {wh.active ? 'active' : 'inactive'}
          </span>
        </div>
        <div className="webhook-card__actions">
          <button className="devplatform-btn-ghost devplatform-btn-ghost--sm" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing…' : 'Test'}
          </button>
          <button className="devplatform-btn-danger--sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="webhook-card__meta">
        <div className="webhook-card__events">
          {wh.events.map(ev => <code key={ev} className="webhook-card__event-chip">{ev}</code>)}
        </div>
        <div className="webhook-card__info">
          {wh.lastDeliveredAt ? (
            <span className={`webhook-card__last-delivery ${wh.lastStatus === 'failed' ? 'webhook-card__last-delivery--failed' : ''}`}>
              Last delivery: {relativeTime(wh.lastDeliveredAt)}
              {wh.lastStatus === 'failed' ? ' ✗ failed' : ' ✓ ok'}
            </span>
          ) : (
            <span className="webhook-card__never">Never delivered</span>
          )}
        </div>
      </div>

      {testMsg && <p className="webhook-card__test-msg">{testMsg}</p>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/webhooks');
    if (!res.ok) {
      setError('Failed to load webhooks.');
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({ webhooks: [] })) as { webhooks: Webhook[] };
    setWebhooks(data.webhooks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main className="devplatform-page">
      <div className="devplatform-page__header">
        <div>
          <h1 className="devplatform-page__title">
            Webhooks
            <span style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem', borderRadius: '999px', fontWeight: 600, marginLeft: '0.5rem', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', verticalAlign: 'middle', letterSpacing: '0.04em' }}>Beta</span>
          </h1>
          <p className="devplatform-page__subtitle">
            Receive HTTP callbacks when events occur in your account.
          </p>
        </div>
        <button className="devplatform-btn-primary" onClick={() => setShowForm(true)}>
          + Add Webhook
        </button>
      </div>

      {showForm && (
        <AddWebhookForm
          onAdded={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading ? (
        <p className="devplatform-loading">Loading webhooks…</p>
      ) : error ? (
        <div className="devplatform-error">{error}</div>
      ) : webhooks.length === 0 ? (
        <div className="devplatform-empty">
          <p className="devplatform-empty__text">No webhooks configured yet.</p>
          <p className="devplatform-empty__sub">Add one to receive real-time event notifications.</p>
        </div>
      ) : (
        <div className="webhook-list">
          {webhooks.map(wh => (
            <WebhookCard key={wh.id} wh={wh} onRefresh={load} />
          ))}
        </div>
      )}

      <div className="devplatform-docs-link">
        <p>Need help? See the <a href="/docs/api" className="devplatform-link">Webhooks API docs →</a></p>
      </div>
    </main>
  );
}
