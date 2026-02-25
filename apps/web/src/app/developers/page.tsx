import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokAPI — Developer Platform | WokGen',
  description: 'WokAPI gives developers programmatic access to WokGen AI tools. Generate assets, use tools, and chat with Eral 7c via REST API.',
};

export default function DevelopersPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '999px', border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.08)', fontSize: '0.75rem', fontWeight: 600, color: '#a78bfa', marginBottom: '1.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Developer Preview
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '1rem', lineHeight: 1.15 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Build with </span>
          <span style={{ color: '#a78bfa' }}>WokAPI</span>
        </h1>
        <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '560px', marginBottom: '2rem' }}>
          Programmatic access to WokGen&apos;s full AI asset generation surface. Generate images, remove backgrounds, chat with Eral 7c, and more — all via a clean REST API.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/account/api-keys" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem' }}>Get API Key</Link>
          <a href="#docs" className="btn btn-secondary" style={{ padding: '0.625rem 1.25rem' }}>View Docs</a>
        </div>
      </div>

      {/* Quick start */}
      <section id="docs" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '1.25rem' }}>Quick Start</h2>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.8, overflowX: 'auto' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}># Install WokSDK</div>
          <div style={{ color: '#34d399' }}>npm install @wokspec/sdk</div>
          <br />
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}># Or use the REST API directly</div>
          <div><span style={{ color: '#60a5fa' }}>curl</span> <span style={{ color: '#f59e0b' }}>-X POST</span> https://wokgen.wokspec.org/api/v1/generate \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-H</span> <span style={{ color: '#a78bfa' }}>&quot;Authorization: Bearer YOUR_API_KEY&quot;</span> \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-H</span> <span style={{ color: '#a78bfa' }}>&quot;Content-Type: application/json&quot;</span> \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-d</span> <span style={{ color: '#a78bfa' }}>{`'{"prompt": "pixel art sword", "mode": "pixel"}'`}</span></div>
        </div>
      </section>

      {/* Endpoints */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '1.25rem' }}>API Endpoints</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[
            { method: 'POST', path: '/api/v1/generate', desc: 'Generate AI assets (images, vectors, UI components)' },
            { method: 'GET', path: '/api/v1/assets', desc: 'List your generated assets' },
            { method: 'DELETE', path: '/api/v1/assets/:id', desc: 'Delete an asset' },
            { method: 'POST', path: '/api/v1/eral/chat', desc: 'Chat with Eral 7c AI' },
            { method: 'POST', path: '/api/v1/tools/bg-remove', desc: 'Remove background from an image URL' },
            { method: 'GET', path: '/api/v1/me', desc: 'Get authenticated user info and usage stats' },
          ].map(e => (
            <div key={e.path} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.875rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: e.method === 'GET' ? 'rgba(52,211,153,0.12)' : e.method === 'DELETE' ? 'rgba(248,113,113,0.12)' : 'rgba(167,139,250,0.12)', color: e.method === 'GET' ? '#34d399' : e.method === 'DELETE' ? '#f87171' : '#a78bfa', flexShrink: 0 }}>{e.method}</span>
              <code style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: '0 0 auto', marginRight: '0.5rem' }}>{e.path}</code>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SDK */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>TypeScript SDK</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>
          Zero-dependency TypeScript SDK. Works in Node.js, Deno, and modern browsers.{' '}
          <a href="/sdk/wokgen.ts" download style={{ color: '#a78bfa' }}>Download wokgen.ts</a>
          {' '}or use the v1 REST API directly.
        </p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '4px', padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.9, overflowX: 'auto' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{`// Copy wokgen.ts into your project (no npm install needed)`}</div>
          <div><span style={{ color: '#60a5fa' }}>import</span> {`{ WokGenClient }`} <span style={{ color: '#60a5fa' }}>from</span> <span style={{ color: '#a78bfa' }}>&apos;./wokgen&apos;</span>;</div>
          <br />
          <div><span style={{ color: '#60a5fa' }}>const</span> client = <span style={{ color: '#60a5fa' }}>new</span> <span style={{ color: '#34d399' }}>WokGenClient</span>({`{ apiKey: 'wok_your_key_here' }`});</div>
          <br />
          <div><span style={{ color: '#60a5fa' }}>const</span> result = <span style={{ color: '#60a5fa' }}>await</span> client.<span style={{ color: '#34d399' }}>generate</span>({`{`}</div>
          <div style={{ paddingLeft: '1.5rem' }}>prompt: <span style={{ color: '#a78bfa' }}>&apos;pixel art spaceship, 32x32&apos;</span>,</div>
          <div style={{ paddingLeft: '1.5rem' }}>mode: <span style={{ color: '#a78bfa' }}>&apos;pixel&apos;</span>,</div>
          <div style={{ paddingLeft: '1.5rem' }}>size: <span style={{ color: '#f59e0b' }}>512</span>,</div>
          <div>{`})`};</div>
          <br />
          <div style={{ color: 'var(--text-muted)' }}>console.log(result.resultUrl); <span style={{ color: 'var(--text-faint, rgba(255,255,255,0.2))' }}>{`// https://cdn.wokgen.io/...`}</span></div>
        </div>
      </section>

      {/* Authentication */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '0.5rem' }}>Authentication</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9375rem' }}>All API requests require an API key passed via the <code style={{ background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>X-Api-Key</code> header.</p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.9, overflowX: 'auto' }}>
          <div><span style={{ color: '#60a5fa' }}>curl</span> <span style={{ color: '#f59e0b' }}>-X POST</span> https://wokgen.wokspec.org/api/v1/generate \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-H</span> <span style={{ color: '#a78bfa' }}>&quot;X-Api-Key: wok_your_key_here&quot;</span> \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-H</span> <span style={{ color: '#a78bfa' }}>&quot;Content-Type: application/json&quot;</span> \</div>
          <div style={{ paddingLeft: '1.5rem' }}><span style={{ color: '#f59e0b' }}>-d</span> <span style={{ color: '#a78bfa' }}>{`'{"prompt":"a pixel art spaceship in space","mode":"pixel","quality":"hd"}'`}</span></div>
        </div>
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Create and manage your API keys at <Link href="/account/api-keys" style={{ color: '#a78bfa' }}>/account/api-keys</Link>.</p>
      </section>

      {/* Rate limits */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: '1.25rem' }}>Rate Limits</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { tier: 'Free', limit: '100 req/day', note: 'No credit card required' },
            { tier: 'Pro', limit: '5,000 req/day', note: 'Included with Pro plan' },
            { tier: 'Enterprise', limit: 'Custom', note: 'Contact us' },
          ].map(t => (
            <div key={t.tier} style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '10px', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontWeight: 700, marginBottom: '0.375rem' }}>{t.tier}</div>
              <div style={{ fontSize: '1.125rem', color: '#a78bfa', fontWeight: 600, marginBottom: '0.25rem' }}>{t.limit}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t.note}</div>
            </div>
          ))}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Every generation response includes rate limit headers:</p>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.25rem 1.5rem', fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.9, overflowX: 'auto' }}>
          <div><span style={{ color: '#34d399' }}>X-Request-ID</span>: <span style={{ color: '#a78bfa' }}>550e8400-e29b-41d4-a716-446655440000</span></div>
          <div><span style={{ color: '#34d399' }}>X-RateLimit-Limit</span>: <span style={{ color: '#a78bfa' }}>100</span></div>
          <div><span style={{ color: '#34d399' }}>X-RateLimit-Remaining</span>: <span style={{ color: '#a78bfa' }}>94</span></div>
          <div><span style={{ color: '#34d399' }}>X-RateLimit-Reset</span>: <span style={{ color: '#a78bfa' }}>1735689600</span> <span style={{ color: 'var(--text-muted)' }}>{`// Unix timestamp (UTC midnight)`}</span></div>
        </div>
      </section>

      <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '10px', background: 'rgba(167,139,250,0.05)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>WokAPI is in developer preview. Features and endpoints may change.</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Manage your API keys at <Link href="/account/api-keys" style={{ color: '#a78bfa' }}>dashboard API keys</Link> · Full platform management at <a href="https://dashboard.wokspec.org" target="_blank" rel="noopener noreferrer" style={{ color: '#a78bfa' }}>dashboard.wokspec.org</a></p>
      </div>
    </div>
  );
}
