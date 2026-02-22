import type { Metadata } from 'next';
import Link from 'next/link';
import { WaitlistForm } from '@/app/_components/WaitlistForm';

export const metadata: Metadata = {
  title: 'WokGen Vector — Scalable SVG Icons & Illustrations — Coming Soon',
  description: 'Generate scalable SVG icon sets, illustration libraries, and design system components with AI.',
};

export default function VectorPage() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-inner">
        <div className="landing-badge">
          <span className="landing-badge-dot" style={{ background: '#34d399' }} />
          <span>WokGen Vector</span>
        </div>
        <h1 className="landing-h1">
          Vector generation.<br />
          <span style={{ color: '#34d399' }}>Coming soon.</span>
        </h1>
        <p className="landing-desc">
          Scalable SVG icons, illustration sets, design system components, and pattern libraries.
          Stroke-consistent. Shape-grammar enforced. Pure vector output.
        </p>
        <ul className="coming-soon-list">
          <li>SVG icon packs with consistent stroke weight</li>
          <li>Illustration sets for landing pages and docs</li>
          <li>UI kit components in multiple styles (outline, filled, rounded, sharp)</li>
          <li>Pattern and texture generation</li>
          <li>Export as SVG, ZIP pack, or Figma-ready tokens</li>
        </ul>
        <p className="coming-soon-note">
          Want early access? Join the waitlist and be first to know.
        </p>
        <WaitlistForm mode="Vector" accent="#34d399" />
        <div className="landing-cta-row" style={{ marginTop: '1.5rem' }}>
          <Link href="/" className="btn-ghost btn-lg">← Back to Platform</Link>
        </div>
      </div>
    </div>
  );
}
