'use client';

import { useEffect, useState } from 'react';

interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string; description: string };
  paths: Record<string, Record<string, {
    summary: string;
    description?: string;
    tags?: string[];
    requestBody?: { content: { 'application/json': { schema: unknown } } };
    responses: Record<string, { description: string }>;
    security?: unknown[];
  }>>;
}

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/openapi')
      .then(r => r.json())
      .then(d => { setSpec(d as OpenAPISpec); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const METHOD_COLORS: Record<string, string> = {
    get: '#22c55e',
    post: '#3b82f6',
    put: '#f59e0b',
    patch: '#a78bfa',
    delete: '#ef4444',
  };

  if (loading) return <div className="docs-loading">Loading API reference...</div>;
  if (!spec) return <div className="docs-error">Failed to load API spec</div>;

  return (
    <div className="docs-api">
      <div className="docs-api__header">
        <h1 className="docs-api__title">{spec.info.title}</h1>
        <span className="docs-api__version">v{spec.info.version}</span>
        <p className="docs-api__desc">{spec.info.description}</p>
      </div>
      <div className="docs-api__auth">
        <h2>Authentication</h2>
        <p>Pass your API key as a Bearer token in the Authorization header:</p>
        <pre className="docs-api__code">Authorization: Bearer wok_your_api_key</pre>
      </div>
      <div className="docs-api__endpoints">
        {Object.entries(spec.paths ?? {}).map(([path, methods]) => (
          <div key={path} className="docs-api__endpoint">
            {Object.entries(methods).map(([method, op]) => (
              <div key={method} className="docs-api__op">
                <button
                  className="docs-api__op-header"
                  onClick={() => setExpandedPath(expandedPath === `${method}:${path}` ? null : `${method}:${path}`)}
                >
                  <span className="docs-api__method" style={{ color: METHOD_COLORS[method] ?? '#aaa', textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, minWidth: 52 }}>{method}</span>
                  <span className="docs-api__path" style={{ fontFamily: 'monospace', fontSize: 13 }}>{path}</span>
                  <span className="docs-api__summary" style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 'auto', paddingLeft: 16 }}>{op.summary}</span>
                </button>
                {expandedPath === `${method}:${path}` && (
                  <div className="docs-api__op-body">
                    {op.description && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{op.description}</p>}
                    {op.security && op.security.length > 0 && (
                      <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>🔑 Requires authentication</div>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Responses</strong>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {Object.entries(op.responses ?? {}).map(([code, res]) => (
                          <div key={code} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                            <span style={{ fontFamily: 'monospace', color: code.startsWith('2') ? '#22c55e' : '#ef4444', fontWeight: 600, minWidth: 36 }}>{code}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{res.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
