'use client';

import { useState, useMemo } from 'react';

function base64urlDecode(str: string): string {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (padded.length % 4)) % 4;
    const b64 = padded + '='.repeat(padLen);
    return decodeURIComponent(
      atob(b64)
        .split('')
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  } catch {
    return '';
  }
}

function prettyJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

function decodeJwt(token: string) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  const [headerB64, payloadB64, sig] = parts;
  const headerStr  = base64urlDecode(headerB64);
  const payloadStr = base64urlDecode(payloadB64);
  if (!headerStr || !payloadStr) return null;
  let header:  Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  try { header  = JSON.parse(headerStr); } catch { /* ignore */ }
  try { payload = JSON.parse(payloadStr); } catch { /* ignore */ }
  return { header, payload, signature: sig, headerStr, payloadStr };
}

function expInfo(payload: Record<string, unknown> | null) {
  if (!payload) return null;
  const exp = payload['exp'];
  const iat = payload['iat'];
  if (typeof exp !== 'number') return null;
  const expDate = new Date(exp * 1000);
  const iatDate = typeof iat === 'number' ? new Date(iat * 1000) : null;
  const expired = expDate < new Date();
  return { expDate, iatDate, expired };
}

export default function JwtDebuggerTool() {
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const decoded = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const exp = useMemo(() => expInfo(decoded?.payload ?? null), [decoded]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="jwt-tool">
      <div className="jwt-tool__input-wrap">
        <label className="tool-label">Paste JWT token</label>
        <textarea
          className="jwt-tool__textarea"
          rows={4}
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0..."
          spellCheck={false}
        />
      </div>

      {token.trim() && !decoded && (
        <div className="jwt-tool__error">Invalid JWT format — expected three dot-separated base64url segments.</div>
      )}

      {decoded && (
        <div className="jwt-tool__sections">
          {/* Header */}
          <div className="jwt-tool__section">
            <div className="jwt-tool__section-header">
              <span className="jwt-tool__section-label jwt-tool__section-label--header">Header</span>
              <button className="jwt-tool__copy-btn" onClick={() => copy(prettyJson(decoded.headerStr), 'header')}>
                {copied === 'header' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="jwt-tool__code">{prettyJson(decoded.headerStr)}</pre>
          </div>

          {/* Payload */}
          <div className="jwt-tool__section">
            <div className="jwt-tool__section-header">
              <span className="jwt-tool__section-label jwt-tool__section-label--payload">Payload</span>
              {exp && (
                <span className={`jwt-tool__exp ${exp.expired ? 'jwt-tool__exp--expired' : 'jwt-tool__exp--valid'}`}>
                  {exp.expired ? 'Expired' : 'Valid'} · exp {exp.expDate.toLocaleString()}
                  {exp.iatDate ? ` · iat ${exp.iatDate.toLocaleString()}` : ''}
                </span>
              )}
              <button className="jwt-tool__copy-btn" onClick={() => copy(prettyJson(decoded.payloadStr), 'payload')}>
                {copied === 'payload' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="jwt-tool__code">{prettyJson(decoded.payloadStr)}</pre>
          </div>

          {/* Signature */}
          <div className="jwt-tool__section">
            <div className="jwt-tool__section-header">
              <span className="jwt-tool__section-label jwt-tool__section-label--sig">Signature</span>
              <span className="jwt-tool__sig-note">Signature cannot be verified without the secret key — decode only.</span>
            </div>
            <pre className="jwt-tool__code jwt-tool__code--sig">{decoded.signature}</pre>
          </div>
        </div>
      )}

      <style>{`
        .jwt-tool { display: flex; flex-direction: column; gap: 20px; }
        .jwt-tool__input-wrap { display: flex; flex-direction: column; gap: 6px; }
        .jwt-tool__textarea {
          padding: 10px 12px; font-size: 12px; font-family: 'Menlo','Consolas',monospace;
          line-height: 1.5; background: var(--bg); color: var(--text);
          border: 1px solid var(--surface-border); border-radius: 6px;
          outline: none; resize: vertical; width: 100%; word-break: break-all;
        }
        .jwt-tool__textarea:focus { border-color: #818cf8; }
        .jwt-tool__error {
          padding: 10px 14px; background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2); border-radius: 6px;
          color: #f87171; font-size: 13px;
        }
        .jwt-tool__sections { display: flex; flex-direction: column; gap: 14px; }
        .jwt-tool__section {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; overflow: hidden;
        }
        .jwt-tool__section-header {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 8px 14px; border-bottom: 1px solid var(--surface-border);
          background: rgba(255,255,255,0.02);
        }
        .jwt-tool__section-label {
          font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .jwt-tool__section-label--header  { background: rgba(96,165,250,0.12); color: #60a5fa; }
        .jwt-tool__section-label--payload { background: rgba(52,211,153,0.12); color: #34d399; }
        .jwt-tool__section-label--sig     { background: rgba(248,113,113,0.12); color: #f87171; }
        .jwt-tool__exp {
          font-size: 11px; padding: 2px 7px; border-radius: 4px; margin-left: auto;
        }
        .jwt-tool__exp--valid   { background: rgba(52,211,153,0.1); color: #34d399; }
        .jwt-tool__exp--expired { background: rgba(239,68,68,0.1);  color: #f87171; }
        .jwt-tool__copy-btn {
          margin-left: auto; padding: 3px 10px; font-size: 11px; cursor: pointer;
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          border: 1px solid var(--surface-border); border-radius: 4px;
          transition: background 0.12s;
        }
        .jwt-tool__copy-btn:hover { background: rgba(255,255,255,0.1); }
        .jwt-tool__sig-note { font-size: 11px; color: var(--text-muted); }
        .jwt-tool__code {
          padding: 14px; font-size: 12px; font-family: 'Menlo','Consolas',monospace;
          line-height: 1.6; color: var(--text-secondary); margin: 0;
          overflow: auto; white-space: pre-wrap; word-break: break-all;
        }
        .jwt-tool__code--sig { color: #f87171; }
      `}</style>
    </div>
  );
}
