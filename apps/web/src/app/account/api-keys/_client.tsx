'use client';

import { useState, useEffect, useCallback } from 'react';
import { relativeTime, formatDate } from '@/lib/format';

interface ApiKey {
  id:           string;
  name:         string;
  keyPrefix:    string;
  scopes:       string;
  lastUsedAt:   string | null;
  expiresAt:    string | null;
  requestCount: number;
  createdAt:    string;
}


const SCOPE_OPTIONS = ['generate', 'read', 'projects', 'brand', 'eral'];
const EXPIRY_OPTIONS = [
  { value: 'never', label: 'No expiry'  },
  { value: '30d',   label: '30 days'    },
  { value: '90d',   label: '90 days'    },
  { value: '1y',    label: '1 year'     },
];

export default function ApiKeysClient() {
  const [keys,          setKeys]          = useState<ApiKey[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [creating,      setCreating]      = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [rawKey,        setRawKey]        = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [error,         setError]         = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const [formName,   setFormName]   = useState('');
  const [formScopes, setFormScopes] = useState<string[]>(['generate', 'read']);
  const [formExpiry, setFormExpiry] = useState<string>('never');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/keys');
    const data = await res.json().catch(() => ({}));
    setKeys(data.keys ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!formName.trim()) { setError('Name is required.'); return; }
    if (!formScopes.length) { setError('Select at least one scope.'); return; }
    setError('');
    setCreating(true);
    const res = await fetch('/api/keys', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: formName, scopes: formScopes, expiresIn: formExpiry }),
    });
    const data = await res.json().catch(() => ({}));
    setCreating(false);
    if (!res.ok) { setError(data.error ?? 'Failed to create key.'); return; }
    setRawKey(data.rawKey);
    setShowForm(false);
    setFormName('');
    setFormScopes(['generate', 'read']);
    load();
  };

  const handleRevoke = async (id: string) => {
    if (confirmRevoke !== id) { setConfirmRevoke(id); return; }
    setConfirmRevoke(null);
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    load();
  };

  const copyKey = () => {
    if (!rawKey) return;
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleScope = (s: string) => {
    setFormScopes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  return (
    <main className="apikeys-page">
      <div className="apikeys-header">
        <div>
          <h1 className="apikeys-title">API Keys</h1>
          <p className="apikeys-subtitle">
            Authenticate programmatic access to WokGen. Keys are hashed — we never store the raw value.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => { setShowForm(true); setRawKey(null); }}>
          New key
        </button>
      </div>

      {/* Raw key reveal — shown exactly once after creation */}
      {rawKey && (
        <div className="apikeys-reveal">
          <p className="apikeys-reveal-label">
            Copy this key now. It will not be shown again.
          </p>
          <div className="apikeys-reveal-row">
            <code className="apikeys-reveal-value">{rawKey}</code>
            <button type="button" className="btn-ghost btn-sm" onClick={copyKey}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button type="button" className="apikeys-reveal-dismiss" onClick={() => setRawKey(null)}>
            I have saved this key
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="apikeys-form-card">
          <h2 className="apikeys-form-title">Create API key</h2>
          {error && <p className="apikeys-form-error">{error}</p>}

          <label className="apikeys-form-label">
            Name
            <input
              className="apikeys-form-input"
              placeholder="e.g. Production app"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              maxLength={60}
            />
          </label>

          <fieldset className="apikeys-form-scopes">
            <legend className="apikeys-form-label">Scopes</legend>
            {SCOPE_OPTIONS.map(s => (
              <label key={s} className="apikeys-scope-item">
                <input
                  type="checkbox"
                  checked={formScopes.includes(s)}
                  onChange={() => toggleScope(s)}
                />
                <span>{s}</span>
              </label>
            ))}
          </fieldset>

          <label className="apikeys-form-label">
            Expiry
            <select className="apikeys-form-select" value={formExpiry} onChange={e => setFormExpiry(e.target.value)}>
              {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <div className="apikeys-form-actions">
            <button type="button" className="btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating…' : 'Create key'}
            </button>
            <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys table */}
      {loading ? (
        <div className="apikeys-loading">Loading keys…</div>
      ) : keys.length === 0 ? (
        <div className="apikeys-empty">
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          </div>
          <p style={{ fontWeight: 500, marginBottom: '0.25rem' }}>No API keys yet</p>
          <p className="apikeys-empty-sub">Create a key to start using the WokGen API programmatically.</p>
        </div>
      ) : (
        <div className="apikeys-table-wrap">
          <table className="apikeys-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Scopes</th>
                <th>Requests</th>
                <th>Last used</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k.id} className="apikeys-row">
                  <td className="apikeys-cell-name">
                    {k.name}
                    {(() => {
                      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                      return new Date(k.createdAt) < ninetyDaysAgo ? (
                        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b40', marginLeft: 6 }}>
                          Rotate — 90+ days old
                        </span>
                      ) : null;
                    })()}
                  </td>
                  <td><code className="apikeys-prefix">{k.keyPrefix}…</code></td>
                  <td className="apikeys-cell-scopes">
                    {k.scopes.split(',').map(s => (
                      <span key={s} className="apikeys-scope-badge">{s}</span>
                    ))}
                  </td>
                  <td>{k.requestCount.toLocaleString()}</td>
                  <td>{k.lastUsedAt ? relativeTime(k.lastUsedAt) : 'Never'}</td>
                  <td>{k.expiresAt ? formatDate(k.expiresAt) : 'Never'}</td>
                  <td>
                    <button type="button" className="apikeys-revoke" onClick={() => handleRevoke(k.id)} title={confirmRevoke === k.id ? 'Click again to confirm' : 'Revoke key'} style={{ fontWeight: confirmRevoke === k.id ? 700 : undefined }}>
                      {confirmRevoke === k.id ? 'Confirm?' : 'Revoke'}
                    </button>
                    {confirmRevoke === k.id && (
                      <button type="button" onClick={() => setConfirmRevoke(null)} aria-label="Cancel revoke" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '4px' }}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="apikeys-docs-link">
        <a href="/docs/platform/api" className="text-link">Read the API reference →</a>
      </div>
    </main>
  );
}
