'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';

const STUDIOS = [
  {
    href: '/pixel/studio',
    emoji: '🎮',
    name: 'Pixel',
    tagline: 'Game assets & sprite sheets',
    color: '#f59e0b',
    beta: false,
  },
  {
    href: '/business/studio',
    emoji: '💼',
    name: 'Business',
    tagline: 'Logos, branding & brand kits',
    color: '#3b82f6',
    beta: false,
  },
  {
    href: '/vector/studio',
    emoji: '✏️',
    name: 'Vector',
    tagline: 'Scalable icons & illustrations',
    color: '#10b981',
    beta: false,
  },
  {
    href: '/uiux/studio',
    emoji: '🖥️',
    name: 'UI/UX',
    tagline: 'Components & design systems',
    color: '#ec4899',
    beta: false,
  },
  {
    href: '/voice/studio',
    emoji: '🎙️',
    name: 'Voice',
    tagline: 'AI voices & audio assets',
    color: '#8b5cf6',
    beta: true,
  },
  {
    href: '/text/studio',
    emoji: '✍️',
    name: 'Text',
    tagline: 'Copy, docs & content',
    color: '#f97316',
    beta: true,
  },
] as const;

export function StudiosDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="nav-studios-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="nav-link nav-studios-btn"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Studios
        <svg
          className="nav-studios-chevron"
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="studios-dropdown" role="menu">
          <div className="studios-dropdown-header">
            <span>Choose a Studio</span>
          </div>
          <div className="studios-dropdown-grid">
            {STUDIOS.map((studio) => (
              <Link
                key={studio.href}
                href={studio.href}
                className="studios-dropdown-card"
                role="menuitem"
                onClick={() => setOpen(false)}
                style={{ '--card-color': studio.color } as React.CSSProperties}
              >
                <span className="studios-dropdown-card-emoji" aria-hidden="true">
                  {studio.emoji}
                </span>
                <div className="studios-dropdown-card-body">
                  <div className="studios-dropdown-card-name">
                    {studio.name}
                    {studio.beta && (
                      <span className="studios-dropdown-card-badge">beta</span>
                    )}
                  </div>
                  <div className="studios-dropdown-card-tagline">{studio.tagline}</div>
                </div>
                <span className="studios-dropdown-card-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
