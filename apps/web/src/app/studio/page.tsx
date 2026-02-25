import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Studio — Creative AI Platform',
  description: 'One studio. Six modes. Generate pixel art, brand assets, vectors, UI components, voice, and text with AI.',
  openGraph: {
    title: 'WokGen Studio',
    description: 'One studio. Six modes. AI-powered creative platform.',
    images: [{ url: 'https://wokgen.wokspec.org/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
};

const MODES = [
  {
    id: 'pixel',
    label: 'Pixel',
    href: '/pixel/studio',
    description: 'Sprite sheets, game icons, characters, and pixel art assets.',
    status: 'live' as const,
    tags: ['Game Dev', 'Sprites', 'Icons'],
  },
  {
    id: 'business',
    label: 'Business',
    href: '/business/studio',
    description: 'Brand kits, logos, social banners, and marketing assets.',
    status: 'live' as const,
    tags: ['Branding', 'Marketing', 'Social'],
  },
  {
    id: 'vector',
    label: 'Vector',
    href: '/vector/studio',
    description: 'Clean SVG icons, illustrations, and scalable design assets.',
    status: 'live' as const,
    tags: ['SVG', 'Icons', 'Illustrations'],
  },
  {
    id: 'uiux',
    label: 'UI/UX',
    href: '/uiux/studio',
    description: 'React components, design system elements, and page templates.',
    status: 'live' as const,
    tags: ['React', 'Tailwind', 'Components'],
  },
  {
    id: 'voice',
    label: 'Voice',
    href: '/voice/studio',
    description: 'Text-to-speech, sound effects, and audio assets.',
    status: 'live' as const,
    tags: ['TTS', 'Audio', 'SFX'],
  },
  {
    id: 'text',
    label: 'Text',
    href: '/text/studio',
    description: 'Copy, scripts, game dialogue, and structured text output.',
    status: 'live' as const,
    tags: ['Copywriting', 'Dialogue', 'Content'],
  },
  {
    id: 'code',
    label: 'Code',
    href: '/studio/code',
    description: 'Describe a UI component and get production-ready React + Tailwind code instantly.',
    status: 'live' as const,
    tags: ['React', 'Tailwind', 'Components'],
  },
] as const;

export default function StudioHub() {
  return (
    <div className="studio-hub">
      <div className="studio-hub__inner">
        {/* Header */}
        <div className="studio-hub__header">
          <h1 className="studio-hub__title">WokGen Studio</h1>
          <p className="studio-hub__subtitle">
            One studio. Six modes. Select a mode to start creating.
          </p>
        </div>

        {/* Mode grid */}
        <div className="studio-hub__grid">
          {MODES.map((mode) => (
            <Link key={mode.id} href={mode.href} className="studio-hub__card">
              <div className="studio-hub__card-top">
                <span className="studio-hub__card-label">{mode.label}</span>
                <span className={`studio-hub__badge studio-hub__badge--${mode.status}`}>
                  {mode.status}
                </span>
              </div>
              <p className="studio-hub__card-desc">{mode.description}</p>
              <div className="studio-hub__card-tags">
                {mode.tags.map(tag => (
                  <span key={tag} className="studio-hub__tag">{tag}</span>
                ))}
              </div>
              <span className="studio-hub__card-cta">Open mode →</span>
            </Link>
          ))}
        </div>

        {/* Footer links */}
        <div className="studio-hub__footer">
          <Link href="/tools" className="studio-hub__footer-link">Browse free tools</Link>
          <Link href="/eral" className="studio-hub__footer-link">Ask Eral 7c</Link>
          <Link href="/docs" className="studio-hub__footer-link">Documentation</Link>
        </div>
      </div>

      <style>{`
        .studio-hub {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }
        .studio-hub__inner {
          width: 100%;
          max-width: 900px;
        }
        .studio-hub__header {
          margin-bottom: 40px;
        }
        .studio-hub__title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .studio-hub__subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .studio-hub__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .studio-hub__card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--surface-border);
          border-radius: 10px;
          text-decoration: none;
          transition: border-color 0.15s, background 0.15s;
        }
        .studio-hub__card:hover {
          border-color: rgba(129,140,248,0.4);
          background: rgba(129,140,248,0.04);
        }
        .studio-hub__card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .studio-hub__card-label {
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--text);
        }
        .studio-hub__badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .studio-hub__badge--live {
          background: rgba(52,211,153,0.1);
          color: #34d399;
          border: 1px solid rgba(52,211,153,0.2);
        }
        .studio-hub__badge--beta {
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.2);
        }
        .studio-hub__card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        .studio-hub__card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .studio-hub__tag {
          font-size: 10px;
          padding: 2px 7px;
          background: rgba(255,255,255,0.05);
          color: var(--text-muted);
          border-radius: 4px;
          border: 1px solid var(--surface-border);
        }
        .studio-hub__card-cta {
          font-size: 12px;
          color: #818cf8;
          font-weight: 500;
          margin-top: 4px;
        }
        .studio-hub__footer {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .studio-hub__footer-link {
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.12s;
        }
        .studio-hub__footer-link:hover { color: var(--text); }
      `}</style>
    </div>
  );
}

