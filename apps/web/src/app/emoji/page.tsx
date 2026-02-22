import type { Metadata } from 'next';
import Link from 'next/link';
import { WaitlistForm } from '@/app/_components/WaitlistForm';

export const metadata: Metadata = {
  title: 'WokGen Emoji — Custom Emoji & Icon Packs — Coming Soon',
  description: 'Generate custom emoji packs, reaction sets, Discord/Slack icons, and app icon sets with AI.',
};

export default function EmojiPage() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-inner">
        <div className="landing-badge">
          <span className="landing-badge-dot" style={{ background: '#fb923c' }} />
          <span>WokGen Emoji</span>
        </div>
        <h1 className="landing-h1">
          Custom emoji &amp; icons.<br />
          <span style={{ color: '#fb923c' }}>Coming soon.</span>
        </h1>
        <p className="landing-desc">
          Emoji packs, reaction sets, stickers, and app icons — designed for Discord, Slack, iOS, Android, and the web.
          High-contrast, readable at 16px, exportable as PNG and WebP.
        </p>
        <ul className="coming-soon-list">
          <li>Custom emoji packs with consistent visual style</li>
          <li>Reaction sets for Discord and Slack communities</li>
          <li>App icon generation with multiple size exports</li>
          <li>Platform-correct sizing presets (16px, 32px, 64px, 128px)</li>
          <li>Brand personality packs for companies</li>
        </ul>
        <p className="coming-soon-note">
          Want early access? Join the waitlist and be first to know.
        </p>
        <WaitlistForm mode="Emoji" accent="#fb923c" />
        <div className="landing-cta-row" style={{ marginTop: '1.5rem' }}>
          <Link href="/" className="btn-ghost btn-lg">← Back to Platform</Link>
        </div>
      </div>
    </div>
  );
}
