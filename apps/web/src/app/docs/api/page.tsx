'use client';

import { useState } from 'react';

// ─── Endpoint definitions ──────────────────────────────────────────────────

interface Endpoint {
  id: string;
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH';
  path: string;
  title: string;
  description: string;
  headers?: { name: string; required: boolean; description: string }[];
  requestBody?: { field: string; type: string; required: boolean; description: string }[];
  responseBody: { field: string; type: string; description: string }[];
  curlExample: string;
  jsExample: string;
  errors: { code: number; description: string }[];
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'auth',
    method: 'GET',
    path: '/api/*',
    title: 'Authentication',
    description: 'All authenticated endpoints require an API key passed via the Authorization header. Generate keys from your Account → API Keys page.',
    headers: [
      { name: 'Authorization', required: true, description: 'Bearer <your-api-key>' },
      { name: 'Content-Type', required: false, description: 'application/json (for POST requests)' },
    ],
    responseBody: [
      { field: 'error', type: 'string', description: 'Error message when authentication fails' },
    ],
    curlExample: `curl -H "Authorization: Bearer wg_sk_..." https://wokgen.ai/api/quota`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/quota', {
  headers: { Authorization: 'Bearer wg_sk_...' }
});`,
    errors: [
      { code: 401, description: 'Missing or invalid API key' },
      { code: 403, description: 'Insufficient scopes for this endpoint' },
    ],
  },
  {
    id: 'generate',
    method: 'POST',
    path: '/api/generate',
    title: 'Generate Asset',
    description: 'Submit an asynchronous generation job. Returns a job ID — poll /api/jobs/[id] for status and result.',
    headers: [
      { name: 'Authorization', required: true, description: 'Bearer <api-key>' },
      { name: 'Content-Type', required: true, description: 'application/json' },
    ],
    requestBody: [
      { field: 'prompt', type: 'string', required: true, description: 'Text prompt for generation' },
      { field: 'mode', type: '"pixel" | "business" | "vector" | "emoji" | "uiux"', required: true, description: 'Asset type to generate' },
      { field: 'width', type: 'number', required: false, description: 'Output width in pixels (default 1024)' },
      { field: 'height', type: 'number', required: false, description: 'Output height in pixels (default 1024)' },
      { field: 'style', type: 'string', required: false, description: 'Style preset name' },
      { field: 'quality', type: '"standard" | "hd"', required: false, description: 'Quality tier (hd costs credits)' },
      { field: 'seed', type: 'number', required: false, description: 'Seed for reproducible results' },
      { field: 'negativePrompt', type: 'string', required: false, description: 'What to exclude from the output' },
    ],
    responseBody: [
      { field: 'jobId', type: 'string', description: 'Job ID to poll for status' },
      { field: 'status', type: '"pending" | "running"', description: 'Initial job status' },
      { field: 'estimatedSeconds', type: 'number', description: 'Estimated processing time' },
    ],
    curlExample: `curl -X POST https://wokgen.ai/api/generate \\
  -H "Authorization: Bearer wg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"neon cat","mode":"pixel","quality":"standard"}'`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/generate', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer wg_sk_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ prompt: 'neon cat', mode: 'pixel', quality: 'standard' }),
});
const { jobId } = await res.json();`,
    errors: [
      { code: 400, description: 'Invalid parameters or missing required fields' },
      { code: 402, description: 'Insufficient HD credits' },
      { code: 429, description: 'Daily quota exceeded or rate limit hit' },
    ],
  },
  {
    id: 'jobs-get',
    method: 'GET',
    path: '/api/jobs/[id]',
    title: 'Get Job Status',
    description: 'Poll a job for completion. Poll every 2–3 seconds until status is "succeeded" or "failed".',
    headers: [
      { name: 'Authorization', required: true, description: 'Bearer <api-key>' },
    ],
    responseBody: [
      { field: 'id', type: 'string', description: 'Job ID' },
      { field: 'status', type: '"pending" | "running" | "succeeded" | "failed"', description: 'Current job status' },
      { field: 'resultUrl', type: 'string | null', description: 'CDN URL of the generated asset (when succeeded)' },
      { field: 'error', type: 'string | null', description: 'Error message (when failed)' },
      { field: 'createdAt', type: 'string', description: 'ISO timestamp' },
    ],
    curlExample: `curl -H "Authorization: Bearer wg_sk_..." \\
  https://wokgen.ai/api/jobs/job_abc123`,
    jsExample: `async function waitForJob(jobId: string) {
  while (true) {
    const res = await fetch(\`https://wokgen.ai/api/jobs/\${jobId}\`, {
      headers: { Authorization: 'Bearer wg_sk_...' },
    });
    const job = await res.json();
    if (job.status === 'succeeded') return job.resultUrl;
    if (job.status === 'failed') throw new Error(job.error);
    await new Promise(r => setTimeout(r, 2500));
  }
}`,
    errors: [
      { code: 404, description: 'Job not found or does not belong to your account' },
    ],
  },
  {
    id: 'gallery',
    method: 'GET',
    path: '/api/gallery',
    title: 'List Gallery',
    description: 'Fetch the public gallery with optional filtering. Returns paginated asset objects.',
    headers: [
      { name: 'Authorization', required: false, description: 'Bearer <api-key> — optional, includes your private assets' },
    ],
    requestBody: [
      { field: 'limit', type: 'number', required: false, description: 'Max results per page (default 24, max 100)' },
      { field: 'offset', type: 'number', required: false, description: 'Pagination offset' },
      { field: 'mode', type: 'string', required: false, description: 'Filter by asset mode' },
      { field: 'tags', type: 'string', required: false, description: 'Comma-separated tag filter' },
    ],
    responseBody: [
      { field: 'items', type: 'Asset[]', description: 'Array of gallery assets' },
      { field: 'total', type: 'number', description: 'Total matching assets' },
      { field: 'hasMore', type: 'boolean', description: 'Whether more pages exist' },
    ],
    curlExample: `curl "https://wokgen.ai/api/gallery?limit=10&mode=pixel"`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/gallery?limit=10&mode=pixel');
const { items, total } = await res.json();`,
    errors: [
      { code: 400, description: 'Invalid query parameters' },
    ],
  },
  {
    id: 'eral-chat',
    method: 'POST',
    path: '/api/eral/chat',
    title: 'Chat with Eral',
    description: 'Send a message to the Eral AI assistant. Supports multi-turn conversations via conversationId.',
    headers: [
      { name: 'Authorization', required: true, description: 'Bearer <api-key>' },
      { name: 'Content-Type', required: true, description: 'application/json' },
    ],
    requestBody: [
      { field: 'message', type: 'string', required: true, description: 'User message text' },
      { field: 'conversationId', type: 'string', required: false, description: 'Continue an existing conversation' },
    ],
    responseBody: [
      { field: 'reply', type: 'string', description: 'Eral\'s response text' },
      { field: 'conversationId', type: 'string', description: 'Use this ID for follow-up messages' },
      { field: 'model', type: 'string', description: 'Model used for this response' },
    ],
    curlExample: `curl -X POST https://wokgen.ai/api/eral/chat \\
  -H "Authorization: Bearer wg_sk_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message":"What pixel art styles work best for icons?"}'`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/eral/chat', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer wg_sk_...',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message: 'What styles work for icons?' }),
});
const { reply, conversationId } = await res.json();`,
    errors: [
      { code: 400, description: 'Missing message field' },
      { code: 429, description: 'Rate limit exceeded' },
    ],
  },
  {
    id: 'quota',
    method: 'GET',
    path: '/api/quota',
    title: 'Get Quota',
    description: 'Retrieve the current account usage and limit information for the authenticated user.',
    headers: [
      { name: 'Authorization', required: true, description: 'Bearer <api-key>' },
    ],
    responseBody: [
      { field: 'planId', type: 'string', description: 'Current plan identifier' },
      { field: 'dailyLimit', type: 'number', description: 'Max standard generations per day' },
      { field: 'todayUsed', type: 'number', description: 'Standard generations used today' },
      { field: 'hdAlloc', type: 'number', description: 'Monthly HD credits allocated' },
      { field: 'hdUsed', type: 'number', description: 'HD credits used this month' },
      { field: 'hdAvailable', type: 'number', description: 'HD credits remaining (alloc + top-up − used)' },
    ],
    curlExample: `curl -H "Authorization: Bearer wg_sk_..." https://wokgen.ai/api/quota`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/quota', {
  headers: { Authorization: 'Bearer wg_sk_...' },
});
const quota = await res.json();
console.log(\`\${quota.todayUsed}/\${quota.dailyLimit} used today\`);`,
    errors: [
      { code: 401, description: 'Authentication required' },
    ],
  },
  {
    id: 'providers',
    method: 'GET',
    path: '/api/providers',
    title: 'Provider Status',
    description: 'List all configured generation providers and their current operational status.',
    headers: [
      { name: 'Authorization', required: false, description: 'Optional — Bearer <api-key>' },
    ],
    responseBody: [
      { field: 'providers', type: 'Provider[]', description: 'Array of provider status objects' },
      { field: 'providers[].name', type: 'string', description: 'Provider identifier (e.g. "replicate", "fal")' },
      { field: 'providers[].available', type: 'boolean', description: 'Whether provider is currently available' },
      { field: 'providers[].degraded', type: 'boolean', description: 'True if experiencing issues' },
    ],
    curlExample: `curl https://wokgen.ai/api/providers`,
    jsExample: `const res = await fetch('https://wokgen.ai/api/providers');
const { providers } = await res.json();
const available = providers.filter((p: { available: boolean }) => p.available);`,
    errors: [],
  },
];

const SIDEBAR_GROUPS = [
  { label: 'Overview', ids: ['auth'] },
  { label: 'Generation', ids: ['generate', 'jobs-get'] },
  { label: 'Content', ids: ['gallery'] },
  { label: 'AI Assistant', ids: ['eral-chat'] },
  { label: 'Account', ids: ['quota'] },
  { label: 'Platform', ids: ['providers'] },
];

function methodColor(m: string) {
  if (m === 'GET')    return 'api-endpoint-badge--get';
  if (m === 'POST')   return 'api-endpoint-badge--post';
  if (m === 'DELETE') return 'api-endpoint-badge--delete';
  return 'api-endpoint-badge--patch';
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="api-code-block">
      <div className="api-code-block__header">
        <span className="api-code-block__lang">{lang}</span>
        <button className="api-code-block__copy" onClick={copy}>{copied ? '✓ copied' : 'copy'}</button>
      </div>
      <pre className="api-code-block__pre"><code>{code}</code></pre>
    </div>
  );
}

// ─── Endpoint detail ──────────────────────────────────────────────────────────

function EndpointDetail({ ep }: { ep: Endpoint }) {
  const [tab, setTab] = useState<'curl' | 'js'>('curl');
  return (
    <div className="api-endpoint-detail">
      <div className="api-endpoint-title-row">
        <span className={`api-endpoint-badge ${methodColor(ep.method)}`}>{ep.method}</span>
        <code className="api-endpoint-path">{ep.path}</code>
      </div>
      <h2 className="api-endpoint-heading">{ep.title}</h2>
      <p className="api-endpoint-desc">{ep.description}</p>

      {ep.headers && (
        <section className="api-endpoint-section">
          <h3 className="api-endpoint-section-title">Headers</h3>
          <div className="api-endpoint-schema">
            {ep.headers.map(h => (
              <div key={h.name} className="api-schema-row">
                <code className="api-schema-field">{h.name}</code>
                <span className="api-schema-type">{h.required ? 'required' : 'optional'}</span>
                <span className="api-schema-desc">{h.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {ep.requestBody && ep.requestBody.length > 0 && (
        <section className="api-endpoint-section">
          <h3 className="api-endpoint-section-title">Request Body / Query Params</h3>
          <div className="api-endpoint-schema">
            {ep.requestBody.map(f => (
              <div key={f.field} className="api-schema-row">
                <code className="api-schema-field">{f.field}</code>
                <code className="api-schema-type">{f.type}</code>
                <span className="api-schema-badge">{f.required ? 'required' : 'optional'}</span>
                <span className="api-schema-desc">{f.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="api-endpoint-section">
        <h3 className="api-endpoint-section-title">Response</h3>
        <div className="api-endpoint-schema">
          {ep.responseBody.map(f => (
            <div key={f.field} className="api-schema-row">
              <code className="api-schema-field">{f.field}</code>
              <code className="api-schema-type">{f.type}</code>
              <span className="api-schema-desc">{f.description}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="api-endpoint-section">
        <h3 className="api-endpoint-section-title">Examples</h3>
        <div className="api-code-tabs">
          <button className={`api-code-tab${tab === 'curl' ? ' api-code-tab--active' : ''}`} onClick={() => setTab('curl')}>cURL</button>
          <button className={`api-code-tab${tab === 'js'   ? ' api-code-tab--active' : ''}`} onClick={() => setTab('js')}>JavaScript</button>
        </div>
        {tab === 'curl' && <CodeBlock lang="bash" code={ep.curlExample} />}
        {tab === 'js'   && <CodeBlock lang="typescript" code={ep.jsExample} />}
      </section>

      {ep.errors.length > 0 && (
        <section className="api-endpoint-section">
          <h3 className="api-endpoint-section-title">Error Codes</h3>
          <div className="api-endpoint-schema">
            {ep.errors.map(e => (
              <div key={e.code} className="api-schema-row">
                <code className="api-schema-field api-schema-field--error">{e.code}</code>
                <span className="api-schema-desc">{e.description}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [activeId, setActiveId] = useState('auth');
  const activeEp = ENDPOINTS.find(e => e.id === activeId) ?? ENDPOINTS[0];

  return (
    <div className="api-ref-layout">
      {/* Sidebar */}
      <aside className="api-ref-sidebar">
        <div className="api-ref-sidebar-header">
          <h1 className="api-ref-sidebar-title">API Reference</h1>
          <p className="api-ref-sidebar-version">v1.0</p>
        </div>
        <nav className="api-ref-sidebar-nav">
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.label} className="api-ref-sidebar-group">
              <p className="api-ref-sidebar-group-label">{group.label}</p>
              {group.ids.map(id => {
                const ep = ENDPOINTS.find(e => e.id === id);
                if (!ep) return null;
                return (
                  <button
                    key={id}
                    className={`api-ref-sidebar-item${activeId === id ? ' api-ref-sidebar-item--active' : ''}`}
                    onClick={() => setActiveId(id)}
                  >
                    <span className={`api-sidebar-badge ${methodColor(ep.method)}`}>{ep.method}</span>
                    <span className="api-sidebar-label">{ep.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="api-ref-content">
        <EndpointDetail key={activeEp.id} ep={activeEp} />
      </main>
    </div>
  );
}
