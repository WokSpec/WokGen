'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

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
      <span className={glitch ? 'nf-glitch-text nf-glitch-text--active' : 'nf-glitch-text'}>
        {text}
      </span>
      {glitch && (
        <span aria-hidden="true" className="nf-glitch-ghost">
          {text}
        </span>
      )}
    </div>
  );
}

function PixelScatter() {
  const dots = Array.from({ length: 24 }, (_, i) => ({
    id:    i,
    x:     (i * 37 + 13) % 100,
    y:     (i * 53 + 7)  % 100,
    size:  ((i % 4) + 1) * 4,
    delay: (i * 0.15) % 1.8,
    color: ['#41A6F6','#73EFF7','#B13E53','#FFCD75','#38B764','#566C86','#29366F'][i % 7],
    opacity: 0.15 + (i % 5) * 0.08,
  }));

  return (
    <div aria-hidden="true" className="nf-scatter">
      {dots.map((dot) => (
        <div
          key={dot.id}
          className="nf-scatter-dot"
          style={{
            left:           `${dot.x}%`,
            top:            `${dot.y}%`,
            width:           dot.size,
            height:          dot.size,
            background:      dot.color,
            opacity:         dot.opacity,
            animationDelay: `${dot.delay}s`,
            animationDuration: `${2.5 + dot.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="nf-page">
      <PixelScatter />
      <div aria-hidden="true" className="nf-grid-overlay" />

      <div className="nf-card">
        <PixelGlitch text="404" />

        <div aria-hidden="true" className="nf-divider">
          {[6, 4, 8, 4, 6].map((size, i) => (
            <div key={i} className={i === 2 ? 'nf-divider-dot nf-divider-dot--accent' : 'nf-divider-dot'} style={{ width: size, height: size }} />
          ))}
        </div>

        <h1 className="nf-heading">Page Not Found</h1>

        <p className="nf-body">
          The page you&apos;re looking for doesn&apos;t exist, has moved, or the URL is incorrect.
        </p>

        <div className="nf-actions">
          <Link href="/" className="nf-btn nf-btn--primary">← Home</Link>
          <Link href="/pixel/studio" className="nf-btn nf-btn--ghost">Open Studio</Link>
        </div>

        <nav aria-label="Quick navigation" className="nf-quicknav">
          {[{ href: '/gallery', label: 'Gallery' }, { href: '/docs', label: 'Docs' }].map(({ href, label }) => (
            <Link key={href} href={href} className="nf-quicknav-link">{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
