import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'WokGen Billing & Plans — Free, HD Credits & Mode Add-ons',
  description: 'WokGen pricing: free unlimited standard generation, HD credits for quality upgrades, and mode-specific add-ons.',
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="docs-h2" style={{ scrollMarginTop: 80 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="docs-p">{children}</p>;
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="docs-ul">{children}</ul>;
}
function LI({ children }: { children: React.ReactNode }) {
  return <li className="docs-li">{children}</li>;
}
function Callout({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'tip' | 'warn' }) {
  const icons = { info: 'ℹ', tip: '✦', warn: '⚠' };
  return (
    <div className={`docs-callout docs-callout--${type}`}>
      <span className="docs-callout-icon">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

const TOC = [
  { id: 'free',     label: 'Free Tier' },
  { id: 'hd',       label: 'HD Credits' },
  { id: 'plans',    label: 'Plans' },
  { id: 'faq',      label: 'FAQ' },
];

export default function BillingDocs() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
            <span>💳</span>
            <span>Plans &amp; Billing</span>
          </div>
          <nav className="docs-toc">
            {TOC.map(t => (
              <a key={t.id} href={`#${t.id}`} className="docs-toc-link">{t.label}</a>
            ))}
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/billing" className="btn-primary btn-sm">Manage Plan</Link>
          </div>
        </aside>

        <main className="docs-content">
          <div className="docs-content-header">
            <h1 className="docs-title">Plans &amp; Billing</h1>
            <p className="docs-subtitle">
              WokGen&apos;s billing model is simple: standard generation is always free. HD is paid.
            </p>
          </div>

          <H2 id="free">Free Tier</H2>
          <P>
            The free tier gives you unlimited standard-quality generation across all live modes
            (Pixel and Business) with no account required for basic use.
          </P>
          <UL>
            <LI>Unlimited standard generations</LI>
            <LI>All tools available (Generate, Animate, Scene, Rotate, Inpaint for Pixel; all 5 Business tools)</LI>
            <LI>Public gallery sharing</LI>
            <LI>PNG and GIF download, no watermarks</LI>
            <LI>Personal and indie commercial use</LI>
          </UL>
          <Callout type="info">
            Standard quality uses Pollinations (open routing). Fast but lower fidelity than HD.
          </Callout>

          <H2 id="hd">HD Credits</H2>
          <P>
            HD quality uses Replicate&apos;s FLUX models for significantly higher fidelity.
            HD requires credits — one credit per HD generation.
          </P>
          <UL>
            <LI>Pixel HD: FLUX-Schnell on Replicate</LI>
            <LI>Business HD: FLUX-1.1-Pro on Replicate (best photorealism)</LI>
            <LI>Animations count as N credits where N = frame count</LI>
            <LI>Brand Kit = 4 credits (4 parallel generations)</LI>
          </UL>

          <H2 id="plans">Plans</H2>
          <P>
            See the <Link href="/billing">Billing page</Link> for current plan pricing and subscription options.
            Plans include monthly HD credit allocations. Additional credits can be purchased as top-ups.
          </P>
          <Callout type="tip">
            Mode add-ons are coming — subscribe to Pixel only, Business only, or bundle.
            This keeps cost aligned with your actual use case.
          </Callout>

          <H2 id="faq">FAQ</H2>
          {[
            {
              q: 'Do unused monthly credits roll over?',
              a: 'No. Monthly credits reset at the start of each billing cycle. Top-up credits never expire.',
            },
            {
              q: 'Can I cancel my subscription?',
              a: 'Yes, at any time from the Billing page. You keep access until the end of your current period.',
            },
            {
              q: 'Is there a refund policy?',
              a: 'Unused credits are non-refundable. Contact support if you have a specific issue.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          <div className="docs-content-footer">
            <Link href="/docs" className="btn-ghost btn-sm">← Docs Hub</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
