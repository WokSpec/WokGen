'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

function PixelGlitch({ text }: { text: string }) {
  const [glitch, setGlitch] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 120);
    }, 2800);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="nf-glitch-root">
      <span className={glitch ? 'nf-glitch-text nf-glitch-text--active' : 'nf-glitch-text'}>{text}</span>
      {glitch && <span aria-hidden="true" className="nf-glitch-ghost">{text}</span>}
    </div>
  );
}

function PixelScatter() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
    id: i, x: (i * 37 + 13) % 100, y: (i * 53 + 7) % 100,
    size: ((i % 4) + 1) * 4, delay: (i * 0.15) % 1.8,
    color: ['#41A6F6','#73EFF7','#B13E53','#FFCD75','#38B764','#566C86','#29366F'][i % 7],
    opacity: 0.15 + (i % 5) * 0.08,
  }));
  return (
    <div aria-hidden="true" className="nf-scatter">
      {dots.map((dot) => (
        <div key={dot.id} className="nf-scatter-dot" style={{
          left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size,
          background: dot.color, opacity: dot.opacity,
          animationDelay: `${dot.delay}s`, animationDuration: `${2.5 + dot.delay}s`,
        }} />
      ))}
    </div>
  );
}

const QUICK_LINKS = [
  { href: '/',              label: '🏠 Home'          },
  { href: '/pixel/studio',  label: '🎮 Pixel Studio'  },
  { href: '/studio/tools',  label: '🔧 Tools'         },
  { href: '/dashboard',     label: '📊 Dashboard'     },
  { href: '/prompt-lab',    label: '🔮 Prompt Lab'    },
  { href: '/gallery',       label: '🖼️ Gallery'       },
];

export default function NotFound() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim()) router.push(`/tools?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div className="nf-page not-found">
      <PixelScatter />
      <div aria-hidden="true" className="nf-grid-overlay" />

      <div className="nf-card not-found__card">
        <div className="not-found__number">
          <PixelGlitch text="404" />
        </div>

        <div aria-hidden="true" className="nf-divider">
          {[6, 4, 8, 4, 6].map((size, i) => (
            <div key={i} className={i === 2 ? 'nf-divider-dot nf-divider-dot--accent' : 'nf-divider-dot'} style={{ width: size, height: size }} />
          ))}
        </div>

        <h1 className="nf-heading">Page Not Found</h1>
        <p className="nf-body">
          The page you&apos;re looking for doesn&apos;t exist, has moved, or the URL is incorrect.
        </p>

        {/* Search */}
        <form onSubmit={handleSearch} className="not-found__search-form">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try searching tools…"
            className="not-found__search-input"
            aria-label="Search tools"
          />
          <button type="submit" className="not-found__search-btn" aria-label="Search">→</button>
        </form>

        {/* Primary actions */}
        <div className="nf-actions">
          <Link href="/" className="nf-btn nf-btn--primary">← Home</Link>
          <Link href="/pixel/studio" className="nf-btn nf-btn--ghost">Open Studio</Link>
        </div>

        {/* Quick links */}
        <nav aria-label="Quick navigation" className="not-found__links">
          {QUICK_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="nf-quicknav-link">{label}</Link>
          ))}
        </nav>
      </div>

      <style>{`
        .not-found__card { max-width: 480px; }
        .not-found__number { margin-bottom: 0; }
        .not-found__search-form {
          display: flex;
          gap: 0;
          width: 100%;
          margin: 16px 0;
          border: 1px solid var(--border);
          border-radius: 8px;
          overflow: hidden;
          background: var(--surface-raised);
          transition: border-color 0.15s;
        }
        .not-found__search-form:focus-within { border-color: var(--accent); }
        .not-found__search-input {
          flex: 1;
          padding: 9px 14px;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          color: var(--text);
        }
        .not-found__search-input::placeholder { color: var(--text-muted); }
        .not-found__search-btn {
          padding: 9px 14px;
          background: var(--accent-subtle);
          border: none;
          color: var(--accent);
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.12s;
        }
        .not-found__search-btn:hover { background: var(--accent); color: var(--text-on-accent); }
        .not-found__links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
