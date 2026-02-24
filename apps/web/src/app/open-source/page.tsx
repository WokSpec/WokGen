import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Open-Source Models — WokGen',
  description:
    'Every AI model powering WokGen is open-source. Browse the full registry of image, language, and audio models with licenses, providers, and source links.',
};

// ─── Model registry ───────────────────────────────────────────────────────────

const MODELS = [
  {
    name:        'FLUX.1-schnell',
    version:     'v1',
    license:     'Apache-2.0',
    licenseType: 'permissive' as const,
    provider:    'Together AI / Hugging Face',
    description: 'State-of-the-art image generation in 4 steps. Exceptional quality-to-speed ratio.',
    hfUrl:       'https://huggingface.co/black-forest-labs/FLUX.1-schnell',
    free:        true,
    category:    'Image Generation',
  },
  {
    name:        'Stable Diffusion XL 1.0',
    version:     'SDXL 1.0',
    license:     'CreativeML',
    licenseType: 'restricted' as const,
    provider:    'Stable Horde / Hugging Face',
    description: 'Flagship SDXL model from Stability AI. High-resolution 1024×1024 native output.',
    hfUrl:       'https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0',
    free:        true,
    category:    'Image Generation',
  },
  {
    name:        'Deliberate v3',
    version:     'v3',
    license:     'CreativeML',
    licenseType: 'restricted' as const,
    provider:    'Stable Horde',
    description: 'Community favourite for photorealistic and detailed imagery. Versatile style range.',
    hfUrl:       'https://huggingface.co/XpucT/Deliberate',
    free:        true,
    category:    'Image Generation',
  },
  {
    name:        'DreamShaper 8',
    version:     'v8',
    license:     'CreativeML',
    licenseType: 'restricted' as const,
    provider:    'Stable Horde',
    description: 'Highly versatile — adapts to digital art, illustration, and photo styles effortlessly.',
    hfUrl:       'https://huggingface.co/Lykon/DreamShaper',
    free:        true,
    category:    'Image Generation',
  },
  {
    name:        'Llama 3.3 70B',
    version:     '3.3-70B-Instruct',
    license:     'Llama 3.3 Community',
    licenseType: 'community' as const,
    provider:    'Groq / Together AI',
    description: 'State-of-the-art open large language model from Meta. Powers Eral AI companion.',
    hfUrl:       'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
    free:        true,
    category:    'Language Model',
  },
  {
    name:        'Mistral 7B',
    version:     '0.3',
    license:     'Apache-2.0',
    licenseType: 'permissive' as const,
    provider:    'Together AI',
    description: 'Efficient 7B parameter language model. Fast inference with strong reasoning.',
    hfUrl:       'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3',
    free:        true,
    category:    'Language Model',
  },
  {
    name:        'Kokoro-82M',
    version:     '82M',
    license:     'Apache-2.0',
    licenseType: 'permissive' as const,
    provider:    'Hugging Face',
    description: 'High-quality text-to-speech at only 82M parameters. Multiple voice styles supported.',
    hfUrl:       'https://huggingface.co/hexgrad/Kokoro-82M',
    free:        true,
    category:    'Text-to-Speech',
  },
  {
    name:        'Bark',
    version:     'suno/bark',
    license:     'MIT',
    licenseType: 'permissive' as const,
    provider:    'Hugging Face',
    description: 'Expressive multi-speaker TTS with emotion, music, and sound effects. Highly creative.',
    hfUrl:       'https://huggingface.co/suno/bark',
    free:        true,
    category:    'Text-to-Speech',
  },
  {
    name:        'Microsoft Edge TTS',
    version:     'edge-tts',
    license:     'Proprietary / Free',
    licenseType: 'proprietary' as const,
    provider:    'Microsoft / edge-tts',
    description: '400+ voices in 100+ languages. Enterprise-quality neural TTS, free to use.',
    hfUrl:       'https://github.com/rany2/edge-tts',
    free:        true,
    category:    'Text-to-Speech',
  },
] as const;

type LicenseType = (typeof MODELS)[number]['licenseType'];

// ─── Provider health ──────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'Together AI',   status: 'operational', note: 'Primary LLM + image API' },
  { name: 'Hugging Face',  status: 'operational', note: 'Model hosting + inference' },
  { name: 'Stable Horde',  status: 'operational', note: 'Distributed GPU inference' },
  { name: 'Groq',          status: 'operational', note: 'Ultra-fast LLM inference' },
  { name: 'Pollinations',  status: 'operational', note: 'Unlimited free image gen' },
  { name: 'ElevenLabs',    status: 'operational', note: 'SFX generation' },
  { name: 'edge-tts',      status: 'operational', note: 'Microsoft neural TTS' },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function licenseBadgeClass(type: LicenseType): string {
  if (type === 'permissive')  return 'oss-badge oss-badge--green';
  if (type === 'community')   return 'oss-badge oss-badge--blue';
  if (type === 'restricted')  return 'oss-badge oss-badge--yellow';
  return 'oss-badge oss-badge--gray';
}

const CATEGORIES = [...new Set(MODELS.map(m => m.category))];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OpenSourcePage() {
  return (
    <main className="oss-page">
      {/* Hero */}
      <section className="oss-hero">
        <p className="oss-eyebrow">Open Source · Transparent</p>
        <h1 className="oss-title">Model Registry</h1>
        <p className="oss-subtitle">
          Every AI model powering WokGen is listed here — with its license, provider, and source.
          No black boxes. No proprietary lock-in.
        </p>
        <div className="oss-hero-actions">
          <Link href="/pricing" className="btn-ghost">Open-source pledge →</Link>
          <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" className="btn-ghost">
            GitHub →
          </a>
        </div>
      </section>

      {/* Model grid by category */}
      {CATEGORIES.map(category => (
        <section key={category} className="oss-category">
          <h2 className="oss-category-title">{category}</h2>
          <div className="oss-model-grid">
            {MODELS.filter(m => m.category === category).map(model => (
              <div key={model.name} className="oss-model-card">
                <div className="oss-model-card-top">
                  <div className="oss-model-name-row">
                    <h3 className="oss-model-name">{model.name}</h3>
                    <span className="oss-model-version">v{model.version}</span>
                  </div>
                  <span className={licenseBadgeClass(model.licenseType)}>{model.license}</span>
                </div>

                <p className="oss-model-desc">{model.description}</p>

                <div className="oss-model-footer">
                  <div className="oss-model-meta">
                    <span className="oss-model-provider">{model.provider}</span>
                    {model.free && <span className="oss-badge oss-badge--free">Free</span>}
                  </div>
                  <a
                    href={model.hfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="oss-model-link"
                  >
                    View model →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Provider health */}
      <section className="oss-providers">
        <h2 className="oss-section-title">Provider Health</h2>
        <p className="oss-section-desc">
          Status is manually updated. All providers shown as operational unless otherwise noted.
        </p>
        <div className="oss-provider-list">
          {PROVIDERS.map(p => (
            <div key={p.name} className="oss-provider-row">
              <div className="oss-provider-info">
                <span className={`oss-status-dot oss-status-dot--${p.status}`} />
                <span className="oss-provider-name">{p.name}</span>
                <span className="oss-provider-note">{p.note}</span>
              </div>
              <span className="oss-provider-status">{p.status}</span>
            </div>
          ))}
        </div>
        <p className="oss-provider-note-footer">
          For real-time status, check each provider&apos;s status page directly.
        </p>
      </section>

      {/* CTA */}
      <section className="oss-cta">
        <h2 className="oss-cta-title">Want to add a model?</h2>
        <p className="oss-cta-desc">
          WokGen is open-source. Open a PR on GitHub to add models, providers, or integrations.
        </p>
        <div className="oss-cta-actions">
          <a href="https://github.com/WokSpec/WokGen" target="_blank" rel="noopener noreferrer" className="btn-primary">
            Contribute on GitHub →
          </a>
          <Link href="/docs" className="btn-ghost">Read the docs</Link>
        </div>
      </section>
    </main>
  );
}
