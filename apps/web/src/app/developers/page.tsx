import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeExamples, DevSidebarNav } from './_client';

export const metadata: Metadata = {
  title: 'Developer Docs — WokGen API',
  description: 'Comprehensive API reference for WokGen. Generate images, voice, music, and more via REST API.',
};

const NAV_SECTIONS = [
  { id: 'overview',      label: 'Overview'             },
  { id: 'auth',          label: 'Authentication'        },
  { id: 'image-gen',     label: 'Image Generation'      },
  { id: 'text-gen',      label: 'Text Generation'       },
  { id: 'voice-gen',     label: 'Voice / TTS'           },
  { id: 'music-gen',     label: 'Music Generation'      },
  { id: 'upscale',       label: 'Image Upscaling'       },
  { id: 'interrogate',   label: 'Image Interrogation'   },
  { id: 'prompt-enh',    label: 'Prompt Enhancement'    },
  { id: 'code-examples', label: 'Code Examples'         },
  { id: 'webhooks',      label: 'Webhooks'              },
  { id: 'sdk',           label: 'SDK Reference'         },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="dev-code-block"><code>{children}</code></pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="dev-section">
      <h2 className="dev-section__title">{title}</h2>
      {children}
    </section>
  );
}

function Method({ method }: { method: 'GET' | 'POST' | 'DELETE' }) {
  const colors: Record<string, string> = { GET: '#34d399', POST: 'var(--accent)', DELETE: '#f87171' };
  return (
    <span className="dev-method-badge" style={{ color: colors[method], borderColor: `${colors[method]}40`, background: `${colors[method]}12` }}>
      {method}
    </span>
  );
}

export default function DevelopersPage() {
  return (
    <div className="dev-page">
      {/* Sidebar */}
      <aside className="dev-sidebar">
        <p className="dev-sidebar__heading">API Reference</p>
        <DevSidebarNav sections={NAV_SECTIONS} />
        <div style={{ marginTop: 'auto', paddingTop: 24 }}>
          <Link href="/account/api-keys" className="dev-sidebar__cta">Get API Key →</Link>
        </div>
      </aside>

      {/* Content */}
      <main className="dev-content">
        {/* Hero */}
        <div className="dev-hero">
          <div className="dev-hero__badge">Developer Preview</div>
          <h1 className="dev-hero__title">
            <span style={{ color: 'var(--text-secondary)' }}>Build with </span>
            <span style={{ color: 'var(--accent)' }}>WokAPI</span>
          </h1>
          <p className="dev-hero__desc">
            Programmatic access to WokGen&apos;s full AI generation surface. REST API + TypeScript SDK.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/account/api-keys" className="btn btn-primary" style={{ padding: '0.625rem 1.25rem' }}>Get API Key</Link>
            <a href="#overview" className="btn btn-secondary" style={{ padding: '0.625rem 1.25rem' }}>View Docs</a>
          </div>
        </div>

        {/* Overview */}
        <Section id="overview" title="Overview">
          <p className="dev-p">WokGen API lets you generate AI assets, enhance prompts, upscale images, and more — all via a clean REST interface.</p>
          <div className="dev-info-grid">
            <div className="dev-info-item">
              <span className="dev-info-item__label">Base URL</span>
              <code className="dev-info-item__val">https://wokgen.wokspec.org/api</code>
            </div>
            <div className="dev-info-item">
              <span className="dev-info-item__label">Format</span>
              <code className="dev-info-item__val">JSON (Content-Type: application/json)</code>
            </div>
          </div>
        </Section>

        {/* Auth */}
        <Section id="auth" title="Authentication">
          <p className="dev-p">Pass your API key as a Bearer token in the <code className="dev-inline-code">Authorization</code> header. Obtain keys at <Link href="/account/api-keys" style={{ color: 'var(--accent)' }}>/account/api-keys</Link>.</p>
          <CodeBlock>{`Authorization: Bearer wok_your_key_here`}</CodeBlock>
          <h3 className="dev-section__sub">Rate Limits</h3>
          <div className="dev-rate-grid">
            {[
              { tier: 'Guest',  limit: '10 / day',       note: 'No account needed'    },
              { tier: 'Free',   limit: '50 / day',        note: 'Free account'         },
              { tier: 'Plus',   limit: '500 / day',       note: '+$9/mo'               },
              { tier: 'Pro',    limit: 'Unlimited',       note: '+$29/mo'              },
            ].map((t) => (
              <div key={t.tier} className="dev-rate-card">
                <div className="dev-rate-card__tier">{t.tier}</div>
                <div className="dev-rate-card__limit">{t.limit}</div>
                <div className="dev-rate-card__note">{t.note}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Image Generation */}
        <Section id="image-gen" title="Image Generation">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/generate</code></div>
          <CodeBlock>{`{
  "prompt": "pixel art sword glowing red",
  "mode": "pixel",
  "tool": "generate",
  "width": 512,
  "height": 512,
  "seed": 42,
  "quality": "standard",
  "provider": "auto"
}`}</CodeBlock>
          <p className="dev-p" style={{ marginTop: 12 }}>Response:</p>
          <CodeBlock>{`{
  "jobId": "job_abc123",
  "status": "completed",
  "imageUrl": "https://cdn.wokgen.io/assets/abc123.png",
  "prompt": "pixel art sword glowing red",
  "provider": "pollinations",
  "createdAt": "2026-03-01T12:00:00Z"
}`}</CodeBlock>
        </Section>

        {/* Text Generation */}
        <Section id="text-gen" title="Text Generation">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/text/generate</code></div>
          <CodeBlock>{`{
  "prompt": "Write a product description for...",
  "type": "product-desc",
  "tone": "professional",
  "length": "medium"
}`}</CodeBlock>
        </Section>

        {/* Voice */}
        <Section id="voice-gen" title="Voice / TTS">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/voice/generate</code></div>
          <CodeBlock>{`{
  "text": "Hello, welcome to WokGen!",
  "voiceId": "default",
  "speed": 1.0
}`}</CodeBlock>
        </Section>

        {/* Music */}
        <Section id="music-gen" title="Music Generation">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/music/generate</code></div>
          <CodeBlock>{`{
  "prompt": "upbeat 8-bit chiptune adventure theme",
  "duration": 30,
  "guidance": 3.5
}`}</CodeBlock>
        </Section>

        {/* Upscale */}
        <Section id="upscale" title="Image Upscaling">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/tools/upscale</code></div>
          <CodeBlock>{`{
  "imageUrl": "https://example.com/image.png",
  "scale": 4,
  "model": "real-esrgan"
}`}</CodeBlock>
        </Section>

        {/* Interrogate */}
        <Section id="interrogate" title="Image Interrogation">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/tools/interrogate</code></div>
          <CodeBlock>{`{
  "imageUrl": "https://example.com/image.png"
}

// Response: { "prompt": "pixel art sword, glowing red, dark background, 32x32" }`}</CodeBlock>
        </Section>

        {/* Prompt Enhancement */}
        <Section id="prompt-enh" title="Prompt Enhancement">
          <div className="dev-endpoint-line"><Method method="POST" /><code>/api/prompt/enhance</code></div>
          <CodeBlock>{`{
  "prompt": "dragon",
  "mode": "pixel",
  "provider": "groq"
}`}</CodeBlock>
        </Section>

        {/* Code Examples */}
        <Section id="code-examples" title="Code Examples">
          <CodeExamples />
        </Section>

        {/* Webhooks */}
        <Section id="webhooks" title="Webhooks">
          <p className="dev-p">Receive a POST to your endpoint when an async generation completes. Configure in <Link href="/account/api-keys" style={{ color: 'var(--accent)' }}>API settings</Link>.</p>
          <CodeBlock>{`// POST to your webhook URL
{
  "event": "generation.completed",
  "jobId": "job_abc123",
  "imageUrl": "https://cdn.wokgen.io/assets/abc123.png",
  "prompt": "pixel art dragon",
  "timestamp": "2026-03-01T12:00:05Z"
}`}</CodeBlock>
        </Section>

        {/* SDK */}
        <Section id="sdk" title="SDK Reference">
          <p className="dev-p">Zero-dependency TypeScript SDK — works in Node.js, Deno, and browsers.</p>
          <CodeBlock>{`npm install @wokspec/sdk`}</CodeBlock>
          <CodeBlock>{`import { WokGenClient } from '@wokspec/sdk';
const client = new WokGenClient({ apiKey: 'wok_your_key_here' });

// Generate image
const result = await client.generate({ prompt: 'pixel art dragon', mode: 'pixel' });
console.log(result.imageUrl);

// Enhance prompt
const enhanced = await client.enhancePrompt({ prompt: 'dragon', mode: 'pixel' });

// Upscale image
const upscaled = await client.upscale({ imageUrl: result.imageUrl, scale: 4 });`}</CodeBlock>
          <p className="dev-p">
            Or <a href="/sdk/wokgen.ts" download style={{ color: 'var(--accent)' }}>download wokgen.ts</a> directly — no npm install required.
          </p>
        </Section>

      </main>

      <style>{`
        .dev-page {
          display: flex;
          gap: 0;
          min-height: 100vh;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 0 80px;
        }
        .dev-sidebar {
          width: 220px;
          flex-shrink: 0;
          position: sticky;
          top: 56px;
          height: calc(100vh - 56px);
          overflow-y: auto;
          padding: 32px 20px 24px;
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        .dev-sidebar__heading {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-faint);
          margin: 0 0 12px;
        }
        .dev-sidebar__nav { display: flex; flex-direction: column; gap: 2px; }
        .dev-sidebar__link {
          display: block;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 13px;
          color: var(--text-secondary);
          text-align: left;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }
        .dev-sidebar__link:hover { background: var(--surface-raised); color: var(--text); }
        .dev-sidebar__link--active { background: var(--accent-subtle); color: var(--accent); font-weight: 600; }
        .dev-sidebar__cta {
          font-size: 12px;
          color: var(--accent);
          font-weight: 600;
          text-decoration: none;
          padding: 8px 10px;
          border-radius: 6px;
          background: var(--accent-subtle);
          display: block;
          text-align: center;
          transition: opacity 0.12s;
        }
        .dev-sidebar__cta:hover { opacity: 0.8; }
        .dev-content {
          flex: 1;
          min-width: 0;
          padding: 40px 48px;
          overflow-x: hidden;
        }
        .dev-hero { margin-bottom: 48px; }
        .dev-hero__badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid var(--accent-glow);
          background: var(--accent-subtle);
          font-size: 11px;
          font-weight: 600;
          color: var(--accent);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .dev-hero__title {
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 16px;
          line-height: 1.15;
        }
        .dev-hero__desc {
          font-size: 1.0625rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 520px;
          margin: 0 0 24px;
        }
        .dev-section {
          margin-bottom: 48px;
          padding-top: 8px;
        }
        .dev-section__title {
          font-size: 1.375rem;
          font-weight: 700;
          margin: 0 0 16px;
          color: var(--text);
        }
        .dev-section__sub {
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin: 20px 0 10px;
        }
        .dev-p {
          font-size: 0.9375rem;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 0 12px;
        }
        .dev-code-block {
          background: var(--surface-card, var(--bg-elevated));
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px 20px;
          font-family: monospace;
          font-size: 0.8125rem;
          line-height: 1.8;
          overflow-x: auto;
          color: var(--text);
          margin: 0 0 12px;
        }
        .dev-inline-code {
          background: var(--surface-raised);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875em;
        }
        .dev-endpoint-line {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .dev-method-badge {
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .dev-info-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin: 12px 0;
        }
        .dev-info-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.875rem;
        }
        .dev-info-item__label {
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 600;
          width: 80px;
          flex-shrink: 0;
        }
        .dev-info-item__val {
          font-family: monospace;
          background: var(--surface-raised);
          padding: 3px 8px;
          border-radius: 4px;
          color: var(--text);
        }
        .dev-rate-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin: 12px 0;
        }
        .dev-rate-card {
          padding: 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-card, var(--bg-elevated));
        }
        .dev-rate-card__tier { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .dev-rate-card__limit { font-size: 1rem; color: var(--accent); font-weight: 600; margin-bottom: 4px; }
        .dev-rate-card__note { font-size: 12px; color: var(--text-muted); }
        @media (max-width: 768px) {
          .dev-page { flex-direction: column; }
          .dev-sidebar { position: static; width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border); padding: 20px; }
          .dev-content { padding: 24px 20px; }
        }
      `}</style>
    </div>
  );
}
