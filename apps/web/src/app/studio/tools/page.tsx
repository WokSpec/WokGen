import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ImageOff,
  Spline,
  Maximize2,
  Search,
  Link2,
  Braces,
  Mic,
  Box,
  Globe,
  Code2,
  Layers,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Studio Tools — WokGen',
  description: 'All tools, integrated into your workflow.',
};

type ToolStatus = 'available' | 'pro' | 'live';

interface Tool {
  id: string;
  label: string;
  href: string;
  description: string;
  status: ToolStatus;
  icon: React.ElementType | string;
  isNew?: boolean;
}

interface Category {
  id: string;
  label: string;
  tools: Tool[];
}

const CATEGORIES: Category[] = [
  {
    id: 'ai-enhancement',
    label: '✨ AI Enhancement',
    tools: [
      { id: 'prompt-lab', label: 'Prompt Lab', href: '/prompt-lab', description: 'AI-powered prompt engineering with multi-mode support', status: 'live', icon: '🔮', isNew: true },
      { id: 'upscale', label: '4× Upscaler', href: '/tools/upscale', description: 'Real-ESRGAN 4× image upscaling — free, no limits', status: 'live', icon: '🔍', isNew: true },
      { id: 'interrogate', label: 'Image Interrogator', href: '/tools/interrogate', description: 'Reverse-engineer any image into a generation prompt', status: 'live', icon: '🔬', isNew: true },
      { id: 'music-gen', label: 'Music Generator', href: '/tools/music', description: 'Generate AI background music from text — free with HF token', status: 'live', icon: '🎵', isNew: true },
    ],
  },
  {
    id: 'image',
    label: 'Image Processing',
    tools: [
      {
        id: 'bg-remove',
        label: 'Background Remover',
        href: '/tools/bg-remove',
        description: 'Remove backgrounds from images automatically with AI precision.',
        status: 'available',
        icon: ImageOff,
      },
      {
        id: 'vectorize',
        label: 'Vectorize',
        href: '/tools/vectorize',
        description: 'Convert raster images into clean, scalable SVG vectors.',
        status: 'available',
        icon: Spline,
      },
      {
        id: 'resize',
        label: 'Resize',
        href: '/tools/resize',
        description: 'Resize and crop images to exact dimensions for any platform.',
        status: 'available',
        icon: Maximize2,
      },
    ],
  },
  {
    id: 'content',
    label: 'Content & Research',
    tools: [
      {
        id: 'exa-search',
        label: 'Exa Search',
        href: '/tools/exa-search',
        description: 'Perform semantic web search powered by the Exa neural search engine.',
        status: 'available',
        icon: Search,
      },
      {
        id: 'link-scraper',
        label: 'Link Scraper',
        href: '/tools/link-scraper',
        description: 'Extract and analyze all links from any webpage URL.',
        status: 'available',
        icon: Link2,
      },
      {
        id: 'json-viewer',
        label: 'JSON Viewer',
        href: '/tools/json-viewer',
        description: 'Visualize, format, and explore JSON data with a tree view.',
        status: 'available',
        icon: Braces,
      },
    ],
  },
  {
    id: 'media',
    label: 'Media & Audio',
    tools: [
      {
        id: 'transcribe',
        label: 'Transcription',
        href: '/tools/transcribe',
        description: 'Transcribe audio and video files to text using AI speech recognition.',
        status: 'pro',
        icon: Mic,
      },
    ],
  },
  {
    id: '3d',
    label: '3D & Immersive',
    tools: [
      {
        id: 'text-to-3d',
        label: 'Text to 3D',
        href: '/tools/text-to-3d',
        description: 'Generate 3D models from text prompts using generative AI.',
        status: 'pro',
        icon: Box,
      },
      {
        id: 'skybox',
        label: 'Skybox 360°',
        href: '/tools/skybox',
        description: 'Create immersive 360° skybox environments from text descriptions.',
        status: 'pro',
        icon: Globe,
      },
    ],
  },
  {
    id: 'code',
    label: 'Code & UI',
    tools: [
      {
        id: 'code-studio',
        label: 'Code Studio',
        href: '/studio/code',
        description: 'Generate production-ready React and Tailwind components from a prompt.',
        status: 'available',
        icon: Code2,
      },
      {
        id: 'design-system',
        label: 'Design System',
        href: '/design-system',
        description: 'Browse and export WokGen design tokens, colors, and component styles.',
        status: 'available',
        icon: Layers,
      },
    ],
  },
];

function StatusBadge({ status, isNew }: { status: ToolStatus; isNew?: boolean }) {
  if (isNew) {
    return <span className="tools-badge tools-badge--new">NEW</span>;
  }
  if (status === 'pro') {
    return <span className="tools-badge tools-badge--pro">Pro</span>;
  }
  return <span className="tools-badge tools-badge--available">Available</span>;
}

export default function StudioToolsPage() {
  return (
    <div className="tools-page">
      <div className="tools-page__inner">
        {/* Header */}
        <div className="tools-page__header">
          <h1 className="tools-page__title">Studio Tools</h1>
          <p className="tools-page__subtitle">All tools, integrated into your workflow</p>
        </div>

        {/* Categories grid */}
        <div className="tools-page__categories">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="tools-category">
              <h2 className="tools-category__label">{category.label}</h2>
              <div className="tools-category__grid">
                {category.tools.map((tool) => {
                    const isEmojiIcon = typeof tool.icon === 'string';
                    return (
                    <div key={tool.id} className="tool-card">
                      <div className="tool-card__top">
                        <div className="tool-card__icon-wrap">
                          {isEmojiIcon
                            ? <span style={{ fontSize: 16 }}>{tool.icon as string}</span>
                            : (() => { const Icon = tool.icon as React.ElementType; return <Icon size={16} strokeWidth={1.5} />; })()
                          }
                        </div>
                        <StatusBadge status={tool.status} isNew={tool.isNew} />
                      </div>
                      <p className="tool-card__name">{tool.label}</p>
                      <p className="tool-card__desc">{tool.description}</p>
                      <Link href={tool.href} className="tool-card__cta">
                        Open tool →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="tools-page__footer">
          <Link href="/pixel/studio" className="tools-page__footer-link">Back to Studio</Link>
          <Link href="/tools" className="tools-page__footer-link">Browse all free tools</Link>
        </div>
      </div>

      <style>{`
        .tools-page {
          min-height: 80vh;
          padding: 48px 24px;
        }
        .tools-page__inner {
          width: 100%;
          max-width: 960px;
          margin: 0 auto;
        }
        .tools-page__header {
          margin-bottom: 40px;
        }
        .tools-page__title {
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }
        .tools-page__subtitle {
          font-size: 1rem;
          color: var(--text-secondary);
          margin: 0;
        }
        .tools-page__categories {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 40px 32px;
          margin-bottom: 40px;
        }
        @media (max-width: 640px) {
          .tools-page__categories { grid-template-columns: 1fr; }
        }
        .tools-category__label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 12px;
        }
        .tools-category__grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .tool-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--surface-border);
          border-radius: 10px;
          transition: border-color 0.15s, background 0.15s;
        }
        .tool-card:hover {
          border-color: var(--accent);
          background: var(--accent-subtle);
        }
        .tool-card__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .tool-card__icon-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 7px;
          background: var(--accent-subtle);
          color: var(--accent);
        }
        .tools-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 7px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tools-badge--new {
          background: rgba(167, 139, 250, 0.15);
          color: var(--accent-pixel);
          border: 1px solid rgba(167, 139, 250, 0.3);
        }
        .tools-badge--available {
          background: var(--success-bg);
          color: var(--success);
          border: 1px solid var(--success-glow);
        }
        .tools-badge--pro {
          background: var(--warning-bg);
          color: var(--warning);
          border: 1px solid var(--warning-bg);
        }
        .tool-card__name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }
        .tool-card__desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        .tool-card__cta {
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
          text-decoration: none;
          margin-top: 4px;
          transition: opacity 0.12s;
        }
        .tool-card__cta:hover { opacity: 0.8; }
        .tools-page__footer {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
        }
        .tools-page__footer-link {
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.12s;
        }
        .tools-page__footer-link:hover { color: var(--text); }
      `}</style>
    </div>
  );
}
