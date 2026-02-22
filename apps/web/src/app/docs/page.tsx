import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Docs — Documentation Hub',
  description:
    'Documentation for WokGen — the multi-vertical AI asset generation platform. ' +
    'Guides for Pixel, Business, and platform features.',
};

const DOCS_SECTIONS = [
  {
    category: 'Modes',
    items: [
      {
        href: '/docs/pixel',
        title: 'WokGen Pixel',
        desc: 'Sprites, animations, tilesets, and game-ready assets. Prompting guide, tools, and export.',
        icon: '👾',
        badge: 'Live',
        badgeColor: '#a78bfa',
      },
      {
        href: '/docs/business',
        title: 'WokGen Business',
        desc: 'Logos, brand kits, slide visuals, social banners, and web hero images.',
        icon: '💼',
        badge: 'Live',
        badgeColor: '#60a5fa',
      },
      {
        href: '/docs/vector',
        title: 'WokGen Vector',
        desc: 'SVG icon sets, illustration libraries, and design system components.',
        icon: '✦',
        badge: 'Beta',
        badgeColor: '#34d399',
      },
      {
        href: '/docs/emoji',
        title: 'WokGen Emoji',
        desc: 'Custom emoji packs, reaction sets, and app icon generation.',
        icon: '😄',
        badge: 'Beta',
        badgeColor: '#fb923c',
      },
      {
        href: '/docs/uiux',
        title: 'WokGen UI/UX',
        desc: 'React components, Tailwind sections, and design-to-code generation.',
        icon: '⌨',
        badge: 'Live',
        badgeColor: '#f472b6',
      },
    ],
  },
  {
    category: 'Platform',
    items: [
      {
        href: '/docs/platform/account',
        title: 'Account & Auth',
        desc: 'Sign up with GitHub, manage your account, and understand your profile.',
        icon: '👤',
        badge: null,
        badgeColor: null,
      },
      {
        href: '/docs/platform/billing',
        title: 'Plans & Billing',
        desc: 'Free tier limits, HD credits, mode add-ons, and Stripe subscription management.',
        icon: '💳',
        badge: null,
        badgeColor: null,
      },
      {
        href: '/docs/platform/api',
        title: 'API Reference',
        desc: 'Generate assets programmatically. Endpoints, authentication, and response formats.',
        icon: '{}',
        badge: null,
        badgeColor: null,
      },
      {
        href: '/docs/platform/gallery',
        title: 'Gallery & Projects',
        desc: 'Save, organize, and share your generated assets.',
        icon: '🖼',
        badge: null,
        badgeColor: null,
      },
    ],
  },
];

export default function DocsHub() {
  return (
    <div className="docs-hub">
      <div className="docs-hub-inner">
        {/* Header */}
        <div className="docs-hub-header">
          <h1 className="docs-hub-title">Documentation</h1>
          <p className="docs-hub-desc">
            WokGen is a multi-vertical AI asset generation platform.
            Each mode has its own guides, prompting strategies, and export formats.
          </p>
        </div>

        {/* Sections */}
        {DOCS_SECTIONS.map(section => (
          <div key={section.category} className="docs-hub-section">
            <h2 className="docs-hub-section-title">{section.category}</h2>
            <div className="docs-hub-grid">
              {section.items.map(item => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`docs-hub-card${item.href === '#' ? ' docs-hub-card--disabled' : ''}`}
                >
                  <div className="docs-hub-card-header">
                    <span className="docs-hub-card-icon">{item.icon}</span>
                    <span className="docs-hub-card-title">{item.title}</span>
                    {item.badge && (
                      <span
                        className="docs-hub-card-badge"
                        style={{ color: item.badgeColor ?? undefined, borderColor: item.badgeColor ?? undefined }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="docs-hub-card-desc">{item.desc}</p>
                  {item.href !== '#' && <span className="docs-hub-card-cta">Read docs →</span>}
                  {item.href === '#' && <span className="docs-hub-card-cta docs-hub-card-cta--soon">Coming soon</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* WokSpec note */}
        <div className="docs-hub-wokspec">
          <p>
            <strong>WokSpec</strong> is the professional services layer above WokGen.
            For production delivery, custom pipelines, and enterprise work,{' '}
            <a href="https://wokspec.org" target="_blank" rel="noopener noreferrer">visit wokspec.org</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
