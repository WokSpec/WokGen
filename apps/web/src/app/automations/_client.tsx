'use client';

import { useState, useEffect, useCallback } from 'react';
import { EmptyState } from '@/app/_components/EmptyState';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  targetType: string;
  targetValue: string | null;
  messageTemplate: string;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastRunError: string | null;
  createdAt: string;
}

const CRON_PRESETS = [
  { label: 'Every Monday 9am',  value: '0 9 * * 1'  },
  { label: 'Daily at midnight', value: '0 0 * * *'  },
  { label: 'Every hour',        value: '0 * * * *'  },
  { label: 'Every 5 minutes',   value: '*/5 * * * *' },
  { label: '1st of month',      value: '0 9 1 * *'  },
];

const TEMPLATE_VARS = ['{{date}}', '{{user_name}}'];

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60)    return `${secs}s ago`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

// ─── Create/edit form ─────────────────────────────────────────────────────────

function AutomationForm({
  onCreated,
  onCancel,
}: { onCreated: () => void; onCancel: () => void }) {
  const [name, setName]       = useState('');
  const [schedule, setSched]  = useState('0 9 * * 1');
  const [targetType, setType] = useState('email');
  const [targetValue, setVal] = useState('');
  const [template, setTpl]    = useState('Hi {{user_name}}, your weekly WokGen digest for {{date}}.');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const submit = async () => {
    if (!name.trim() || !template.trim()) { setError('Name and message template are required.'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, schedule, targetType, targetValue: targetValue || null, messageTemplate: template }),
    });
    if (res.ok) { onCreated(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed'); }
    setSaving(false);
  };

  return (
    <div className="automation-form">
      <h3 className="automation-form__title">New automation</h3>

      <div className="automation-form__field">
        <label>Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Weekly digest" maxLength={60} />
      </div>

      <div className="automation-form__field">
        <label>Schedule (cron)</label>
        <input className="input" value={schedule} onChange={e => setSched(e.target.value)} placeholder="0 9 * * 1" />
        <div className="automation-form__presets">
          {CRON_PRESETS.map(p => (
            <button key={p.value} className="btn btn--ghost btn--sm automation-form__preset" onClick={() => setSched(p.value)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="automation-form__field">
        <label>Target</label>
        <div className="automation-form__target-row">
          <select className="input automation-form__target-type" value={targetType} onChange={e => setType(e.target.value)}>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
            <option value="in_app">In-app</option>
          </select>
          {(targetType === 'email' || targetType === 'webhook') && (
            <input
              className="input"
              value={targetValue}
              onChange={e => setVal(e.target.value)}
              placeholder={targetType === 'email' ? 'user@example.com' : 'https://hooks.slack.com/…'}
            />
          )}
        </div>
      </div>

      <div className="automation-form__field">
        <label>Message template</label>
        <div className="automation-form__vars">
          {TEMPLATE_VARS.map(v => (
            <button key={v} className="btn btn--ghost btn--sm automation-form__var" onClick={() => setTpl(t => t + v)}>
              {v}
            </button>
          ))}
        </div>
        <textarea
          className="input automation-form__template"
          rows={4}
          value={template}
          onChange={e => setTpl(e.target.value)}
          placeholder="Your message here. Use {{date}}, {{user_name}}."
          maxLength={2000}
        />
      </div>

      {error && <p className="automation-form__error">{error}</p>}

      <div className="automation-form__actions">
        <button className="btn btn--primary btn--sm" onClick={submit} disabled={saving}>
          {saving ? 'Creating…' : 'Create automation'}
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Automation row ───────────────────────────────────────────────────────────

function AutomationRow({
  auto,
  onToggle,
  onDelete,
}: { auto: Automation; onToggle: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [testing, setTesting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/automations/${auto.id}`, { method: 'DELETE' });
    onDelete();
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await fetch(`/api/automations/${auto.id}/test`, { method: 'POST' });
      const d = (await r.json()) as { ok: boolean; status?: number; error?: string };
      alert(d.ok ? `Test delivered — HTTP ${d.status}` : `Test failed: ${d.error ?? 'unknown'}`);
    } catch {
      alert('Test request failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className={`automation-row ${!auto.enabled ? 'automation-row--disabled' : ''}`}>
      <div className="automation-row__main">
        <div className="automation-row__header">
          <span className="automation-row__name">{auto.name}</span>
          <span className={`automation-row__status ${auto.lastRunStatus === 'error' ? 'automation-row__status--error' : auto.lastRunStatus === 'ok' ? 'automation-row__status--ok' : ''}`}>
            {auto.lastRunStatus === 'error' ? 'Error' : auto.lastRunStatus === 'ok' ? 'OK' : 'Never run'}
          </span>
        </div>
        <div className="automation-row__meta">
          <code className="automation-row__cron">{auto.schedule}</code>
          <span className="automation-row__target">{auto.targetType}{auto.targetValue ? ` → ${auto.targetValue.slice(0, 30)}` : ''}</span>
          {auto.lastRunAt && <span className="automation-row__last-run">Last run {timeAgo(auto.lastRunAt)}</span>}
        </div>
        <p className="automation-row__template">{auto.messageTemplate.slice(0, 80)}{auto.messageTemplate.length > 80 ? '…' : ''}</p>
        {auto.lastRunError && (
          <p className="automation-row__error">{auto.lastRunError}</p>
        )}
      </div>
      <div className="automation-row__actions">
        <button
          role="switch"
          aria-checked={auto.enabled}
          className={`notify-toggle ${auto.enabled ? 'notify-toggle--on' : ''}`}
          onClick={onToggle}
          title={auto.enabled ? 'Disable' : 'Enable'}
        >
          <span className="notify-toggle__thumb" />
        </button>
        {auto.targetType === 'webhook' && (
          <button 
            className="btn btn--ghost btn--sm" 
            onClick={handleTest} 
            disabled={testing}
            title="Send test event to webhook"
            style={{ color: 'var(--text-muted)' }}
          >
            {testing ? '…' : 'Test'}
          </button>
        )}
        <button className="btn btn--ghost btn--sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? '…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AutomationsClient() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/automations');
    if (res.ok) { const d = await res.json(); setAutomations(d.automations ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, enabled: boolean) => {
    await fetch(`/api/automations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, enabled: !enabled } : a));
  };

  return (
    <div className="automations-page">
      <div className="automations-page__header">
        <div>
          <h1 className="automations-page__title">Automations</h1>
          <p className="automations-page__subtitle">Schedule messages, webhooks, and alerts on a cron timer.</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New automation'}
        </button>
      </div>

      {showForm && (
        <AutomationForm
          onCreated={() => { setShowForm(false); load(); }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="automations-page__info">
        <p>
          Automations run every 5 minutes on the server.
          Use cron expressions to control timing.
          Variables: <code>{'{{date}}'}</code> <code>{'{{user_name}}'}</code>
        </p>
      </div>

      {loading ? (
        <div className="automations-page__loading">Loading…</div>
      ) : automations.length === 0 ? (
        <EmptyState
          title="No automations yet"
          description="Create your first automation to schedule messages, webhooks, and alerts."
          action={{ label: 'New automation', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="automations-list">
          {automations.map(auto => (
            <AutomationRow
              key={auto.id}
              auto={auto}
              onToggle={() => toggle(auto.id, auto.enabled)}
              onDelete={() => setAutomations(prev => prev.filter(a => a.id !== auto.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
