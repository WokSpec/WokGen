'use client';

import { useState } from 'react';

const STATUS_CODES = [
  { code: 100, name: 'Continue', desc: 'The server has received the request headers.' },
  { code: 101, name: 'Switching Protocols', desc: 'The server is switching protocols.' },
  { code: 200, name: 'OK', desc: 'The request succeeded.' },
  { code: 201, name: 'Created', desc: 'The request was fulfilled and a new resource was created.' },
  { code: 204, name: 'No Content', desc: 'The server processed the request successfully but returns no content.' },
  { code: 206, name: 'Partial Content', desc: 'The server is delivering only part of the resource.' },
  { code: 301, name: 'Moved Permanently', desc: 'The URL has been changed permanently.' },
  { code: 302, name: 'Found', desc: 'The resource is temporarily at a different URI.' },
  { code: 304, name: 'Not Modified', desc: 'The cached version of the response is still valid.' },
  { code: 307, name: 'Temporary Redirect', desc: 'The request should be repeated with the same method at the new URL.' },
  { code: 308, name: 'Permanent Redirect', desc: 'Like 301 but the method must not change.' },
  { code: 400, name: 'Bad Request', desc: 'The server cannot process the request due to malformed syntax.' },
  { code: 401, name: 'Unauthorized', desc: 'Authentication is required and has failed or was not provided.' },
  { code: 403, name: 'Forbidden', desc: 'The server understood the request but refuses to authorize it.' },
  { code: 404, name: 'Not Found', desc: 'The server cannot find the requested resource.' },
  { code: 405, name: 'Method Not Allowed', desc: 'The request method is known but not supported for this resource.' },
  { code: 408, name: 'Request Timeout', desc: 'The server timed out waiting for the request.' },
  { code: 409, name: 'Conflict', desc: 'The request conflicts with the current state of the server.' },
  { code: 410, name: 'Gone', desc: 'The resource is no longer available and will not be available again.' },
  { code: 413, name: 'Content Too Large', desc: 'The request body is larger than the server is willing to accept.' },
  { code: 422, name: 'Unprocessable Entity', desc: 'The request was well-formed but has semantic errors.' },
  { code: 429, name: 'Too Many Requests', desc: 'The user has sent too many requests in a given time.' },
  { code: 500, name: 'Internal Server Error', desc: 'The server encountered an unexpected condition.' },
  { code: 501, name: 'Not Implemented', desc: 'The server does not support the functionality required.' },
  { code: 502, name: 'Bad Gateway', desc: 'The server received an invalid response from an upstream server.' },
  { code: 503, name: 'Service Unavailable', desc: 'The server is not ready to handle the request.' },
  { code: 504, name: 'Gateway Timeout', desc: 'The upstream server did not respond in time.' },
];

function getColor(code: number) {
  if (code < 200) return { bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' };
  if (code < 300) return { bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', text: '#34d399' };
  if (code < 400) return { bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)', text: '#fbbf24' };
  if (code < 500) return { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', text: '#f87171' };
  return { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', text: '#ef4444' };
}

export default function HttpStatusTool() {
  const [query, setQuery] = useState('');
  const filtered = STATUS_CODES.filter(s =>
    !query || String(s.code).includes(query) || s.name.toLowerCase().includes(query.toLowerCase()) || s.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="tool-section">
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by code or name..." style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.625rem 0.875rem', color: 'var(--text-primary)', fontSize: '0.9375rem', outline: 'none', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {filtered.map(s => {
          const c = getColor(s.code);
          return (
            <div key={s.code} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', padding: '0.875rem 1rem', border: `1px solid ${c.border}`, borderRadius: '8px', background: c.bg }}>
              <code style={{ fontWeight: 700, fontSize: '1rem', color: c.text, flexShrink: 0, minWidth: '36px' }}>{s.code}</code>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{s.name}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{s.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
