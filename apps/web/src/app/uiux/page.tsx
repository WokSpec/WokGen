import type { Metadata } from 'next';
import Link from 'next/link';
import { WaitlistForm } from '@/app/_components/WaitlistForm';

export const metadata: Metadata = {
  title: 'WokGen UI/UX — Design-to-Code Generation — Coming Soon',
  description: 'Generate React components, Tailwind sections, landing pages, and design system tokens with AI.',
};

export default function UIUXPage() {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-inner">
        <div className="landing-badge">
          <span className="landing-badge-dot" style={{ background: '#f472b6' }} />
          <span>WokGen UI/UX</span>
        </div>
        <h1 className="landing-h1">
          Design to code.<br />
          <span style={{ color: '#f472b6' }}>Coming soon.</span>
        </h1>
        <p className="landing-desc">
          React components, Tailwind sections, landing pages, dashboards, and design system tokens —
          generated from a prompt. Visual preview + copy-paste-ready code output.
        </p>
        <ul className="coming-soon-list">
          <li>React / Next.js component generation (JSX / TSX)</li>
          <li>Tailwind CSS sections and page layouts</li>
          <li>Landing pages, dashboards, forms, tables, cards</li>
          <li>Design system token exports</li>
          <li>Side-by-side: visual preview + code pane</li>
          <li>Export as component pack or starter project</li>
        </ul>
        <p className="coming-soon-note">
          This is the highest-leverage mode on WokGen. It turns prompts into production-ready front-end code.
        </p>
        <WaitlistForm mode="UI/UX" accent="#f472b6" />
        <div className="landing-cta-row" style={{ marginTop: '1.5rem' }}>
          <Link href="/" className="btn-ghost btn-lg">← Back to Platform</Link>
        </div>
      </div>
    </div>
  );
}
