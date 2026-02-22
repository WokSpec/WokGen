import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Plans & Billing · Docs',
  description: 'WokGen pricing, HD credits, top-up packs, commercial licensing, and Stripe billing details.',
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return <h2 id={id} className="docs-h2" style={{ scrollMarginTop: 80 }}>{children}</h2>;
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="docs-h3">{children}</h3>;
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
  { id: 'plans-overview',   label: 'Plans Overview' },
  { id: 'hd-credits',       label: 'What HD Credits Are' },
  { id: 'monthly-credits',  label: 'Monthly Credits' },
  { id: 'topup-packs',      label: 'Top-Up Packs' },
  { id: 'standard',         label: 'Standard Generation' },
  { id: 'billing-portal',   label: 'Billing Portal' },
  { id: 'stripe-security',  label: 'Stripe Security' },
  { id: 'cancellation',     label: 'Cancellation' },
  { id: 'refund',           label: 'Refund Policy' },
  { id: 'commercial',       label: 'Commercial License' },
  { id: 'faq',              label: 'FAQ' },
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
              WokGen&apos;s billing model is built around one idea: standard generation is always
              free for everyone. HD quality is a paid upgrade backed by premium AI inference.
            </p>
          </div>

          {/* ── Plans Overview ── */}
          <H2 id="plans-overview">Plans Overview</H2>
          <P>
            There are four plans: Free, Plus, Pro, and Max. All plans include unlimited Standard
            quality generation. Paid plans add monthly HD credits, higher workspace limits,
            and a commercial license for generated assets.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>HD Credits / mo</th>
                  <th>Workspace limit</th>
                  <th>Commercial license</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Free</strong></td>
                  <td>$0</td>
                  <td>0</td>
                  <td>1 project</td>
                  <td>Personal / indie only</td>
                </tr>
                <tr>
                  <td><strong>Plus</strong></td>
                  <td>$2 / mo</td>
                  <td>20</td>
                  <td>5 projects</td>
                  <td>✓ Full commercial</td>
                </tr>
                <tr>
                  <td><strong>Pro</strong></td>
                  <td>$6 / mo</td>
                  <td>60</td>
                  <td>20 projects</td>
                  <td>✓ Full commercial</td>
                </tr>
                <tr>
                  <td><strong>Max</strong></td>
                  <td>$15 / mo</td>
                  <td>200</td>
                  <td>Unlimited projects</td>
                  <td>✓ Full commercial</td>
                </tr>
              </tbody>
            </table>
          </div>
          <Callout type="info">
            Prices listed are per calendar month. See{' '}
            <Link href="/billing">the Billing page</Link> for current pricing and any promotional
            rates that may apply.
          </Callout>

          {/* ── What HD Credits Are ── */}
          <H2 id="hd-credits">What HD Credits Are</H2>
          <P>
            HD credits are consumed when you enable the <strong>HD quality toggle</strong> in
            any studio before generating. One generation costs one HD credit, regardless of
            image dimensions.
          </P>
          <P>
            The key difference between Standard and HD is the underlying AI backend:
          </P>
          <UL>
            <LI>
              <strong>Standard</strong> — uses Pollinations, an open routing service. Fast,
              free, and good for iteration and prototyping. Quality is solid but not
              photorealistic or pixel-perfect.
            </LI>
            <LI>
              <strong>HD (Pixel mode)</strong> — uses a premium model optimized for pixel art
              fidelity. Cleaner outlines, accurate palette quantization, and sharper detail at
              small resolutions.
            </LI>
            <LI>
              <strong>HD (Business mode)</strong> — uses a high-fidelity model suited for
              professional brand assets. Photorealistic outputs, brand-safe compositions,
              better typography rendering in mockups.
            </LI>
          </UL>
          <P>
            Use Standard when iterating on ideas. Switch to HD when you&apos;re ready to generate
            final-quality assets worth exporting.
          </P>
          <Callout type="tip">
            Brand Kit in Business Studio generates 4 parallel images. Each counts as 1 HD credit,
            so a single Brand Kit run at HD quality costs 4 credits.
          </Callout>

          {/* ── Monthly Credits ── */}
          <H2 id="monthly-credits">Monthly Credits</H2>
          <P>
            Monthly HD credits are included with paid plans and reset at the start of each billing
            period — the same calendar date you first subscribed.
          </P>
          <UL>
            <LI>Credits reset to the plan&apos;s full allocation at the start of each billing cycle.</LI>
            <LI>Unused monthly credits <strong>do not roll over</strong>. They expire at cycle end.</LI>
            <LI>
              If your monthly credit balance reaches zero, the system automatically falls back
              to Standard quality — your generation <strong>never fails</strong> due to insufficient
              credits. You just get Standard output until credits reset or you purchase a top-up.
            </LI>
          </UL>
          <Callout type="info">
            The fallback-to-Standard behavior means you always get a result. You are never
            blocked from generating.
          </Callout>

          {/* ── Top-Up Packs ── */}
          <H2 id="topup-packs">Top-Up Packs</H2>
          <P>
            Top-up packs are one-time credit purchases. They supplement your monthly allocation
            and are useful when you need more HD credits before your billing period resets.
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Price</th>
                  <th>Credits</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Micro</td><td>$1</td><td>30</td></tr>
                <tr><td>Small</td><td>$3</td><td>100</td></tr>
                <tr><td>Medium</td><td>$8</td><td>400</td></tr>
                <tr><td>Large</td><td>$20</td><td>1,200</td></tr>
              </tbody>
            </table>
          </div>
          <UL>
            <LI>Top-up credits <strong>never expire</strong> — they carry over month to month.</LI>
            <LI>Monthly plan credits are always consumed first. Top-up credits are only used after
              your monthly allocation is exhausted.</LI>
            <LI>Top-up packs can be purchased from{' '}
              <Link href="/billing">the Billing page</Link> at any time, regardless of plan.</LI>
            <LI>You do not need a paid subscription to purchase a top-up pack. Free plan users
              can buy top-ups to access HD quality.</LI>
          </UL>

          {/* ── Standard Generation ── */}
          <H2 id="standard">Standard Generation</H2>
          <P>
            Standard quality generation is always free, always available, and uses no credits.
            It works for all tools across all studio modes.
          </P>
          <UL>
            <LI>No account required for basic Standard generation (guest mode).</LI>
            <LI>Authenticated Standard generation has a higher rate limit than guest.</LI>
            <LI>Standard uses Pollinations as the backend — an open, community-supported routing
              layer. No API key or payment is needed.</LI>
            <LI>Standard output is PNG (or GIF for animations) with no watermark on any plan.</LI>
            <LI>Standard generation counts toward your job history like any other generation.</LI>
          </UL>
          <Callout type="tip">
            Standard quality is a genuine creative tool, not a degraded demo mode. Many assets
            generated at Standard quality are excellent — especially for game art and quick mockups.
          </Callout>

          {/* ── Billing Portal ── */}
          <H2 id="billing-portal">Billing Portal</H2>
          <P>
            All subscription management is available at{' '}
            <Link href="/billing" className="docs-code">/billing</Link>. From there you can:
          </P>
          <UL>
            <LI>View your current plan, credit balance, and next reset date.</LI>
            <LI>Upgrade or downgrade your subscription.</LI>
            <LI>Purchase top-up credit packs.</LI>
            <LI>Open the <strong>Stripe Customer Portal</strong> to manage payment methods,
              view invoices, and cancel your subscription.</LI>
          </UL>
          <P>
            You must be signed in to access the Billing page. If you are on the Free plan,
            the page shows upgrade options. If you have an active subscription, it shows your
            current status and management options.
          </P>

          {/* ── Stripe Security ── */}
          <H2 id="stripe-security">Stripe Security</H2>
          <P>
            All payment processing is handled by <strong>Stripe</strong>. WokGen never sees,
            receives, or stores your card number, CVV, or billing address. These are entered
            directly into Stripe&apos;s hosted payment form and processed entirely within
            Stripe&apos;s PCI-compliant infrastructure.
          </P>
          <UL>
            <LI>WokGen stores only a Stripe Customer ID and Subscription ID — opaque references
              used to look up your plan status.</LI>
            <LI>Stripe handles all fraud detection, card validation, and 3D Secure authentication.</LI>
            <LI>Payment receipts and invoices are accessible directly from the Stripe Customer Portal.</LI>
          </UL>
          <Callout type="info">
            If you have concerns about a charge, you can contact WokGen support or dispute directly
            through your bank. Stripe also provides a transparent dispute resolution process.
          </Callout>

          {/* ── Cancellation ── */}
          <H2 id="cancellation">Subscription Cancellation</H2>
          <P>
            You can cancel your subscription at any time from the{' '}
            <Link href="/billing">Billing page</Link> via the Stripe Customer Portal.
            Cancellation is immediate in the sense that it stops future renewals — but your
            plan remains active until the end of the current billing period.
          </P>
          <UL>
            <LI>You keep your current plan benefits (HD credits, workspace limits, commercial
              license) until the period ends.</LI>
            <LI>At the end of the period, your plan automatically downgrades to <strong>Free</strong>.</LI>
            <LI>Unused monthly credits from the final period are forfeited on downgrade.</LI>
            <LI>Any top-up credits you purchased are <strong>retained</strong> on the Free plan —
              they do not expire and can still be used for HD generations.</LI>
            <LI>Projects above the Free plan&apos;s workspace limit are archived (not deleted) and
              become accessible again if you re-subscribe.</LI>
          </UL>

          {/* ── Refund Policy ── */}
          <H2 id="refund">Refund Policy</H2>
          <P>
            WokGen&apos;s refund policy follows Stripe&apos;s standard proration model for
            subscription changes, with the following specifics:
          </P>
          <UL>
            <LI>
              <strong>Subscription upgrades</strong> — when upgrading mid-cycle (e.g., Plus to Pro),
              Stripe prorates the charge. You pay only for the remainder of the billing period at
              the new rate.
            </LI>
            <LI>
              <strong>Subscription downgrades</strong> — downgrades take effect at the end of
              the current period. No prorated refund is issued for unused time on the higher plan.
            </LI>
            <LI>
              <strong>Top-up credit packs</strong> — one-time purchases are non-refundable once
              credits have been used. If you purchased credits that are entirely unused, contact
              support within 7 days for a review.
            </LI>
            <LI>
              <strong>Monthly credits</strong> — monthly plan credits are non-refundable. They
              are included as part of the plan subscription, not purchased individually.
            </LI>
          </UL>
          <Callout type="warn">
            If you believe you were charged in error, contact support promptly. Stripe invoices
            include a direct dispute link if needed.
          </Callout>

          {/* ── Commercial License ── */}
          <H2 id="commercial">Commercial License</H2>
          <P>
            Assets generated on WokGen can be used commercially — to what extent depends on
            your plan:
          </P>
          <div className="docs-table-wrap">
            <table className="docs-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Commercial use</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Free</td>
                  <td>Personal &amp; indie</td>
                  <td>Games, personal projects, solo work. Not for agency or client work.</td>
                </tr>
                <tr>
                  <td>Plus</td>
                  <td>✓ Full commercial</td>
                  <td>Client work, product assets, marketing materials, resale allowed.</td>
                </tr>
                <tr>
                  <td>Pro</td>
                  <td>✓ Full commercial</td>
                  <td>Same as Plus, higher volume.</td>
                </tr>
                <tr>
                  <td>Max</td>
                  <td>✓ Full commercial</td>
                  <td>Same as Plus/Pro, unlimited projects.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <H3>Important notes</H3>
          <UL>
            <LI>WokGen&apos;s commercial license covers the <em>platform&apos;s</em> terms of use.
              You are also responsible for complying with the terms of the underlying AI model
              providers (Pollinations for Standard; premium providers for HD).</LI>
            <LI>WokGen does not guarantee that any generated asset is free from third-party
              intellectual property claims. Do not generate assets that deliberately replicate
              a trademarked logo, mascot, or character.</LI>
            <LI>Team billing (a single subscription covering multiple team members) is not yet
              available. Each user needs their own subscription for commercial use.</LI>
          </UL>

          {/* ── FAQ ── */}
          <H2 id="faq">FAQ</H2>
          {[
            {
              q: 'When does my billing date reset?',
              a: 'Your billing date is set on the day you first subscribed. If you subscribed on the 14th, your credits reset and your subscription renews on the 14th of each month.',
            },
            {
              q: 'What happens if I upgrade mid-cycle?',
              a: 'Stripe prorates the charge. You immediately gain the new plan\'s credit allocation (the full monthly amount), minus any credits you\'ve already used this cycle under the old plan. Remaining days are charged at the new rate.',
            },
            {
              q: 'What if my payment fails?',
              a: 'Stripe retries failed payments over several days. During this window your plan remains active. If the payment ultimately fails, your subscription is cancelled and your account downgrades to Free. You\'ll receive an email notification from Stripe.',
            },
            {
              q: 'Is team billing available?',
              a: 'Not yet. Team billing — a single subscription that grants HD credits to multiple team members — is on the roadmap but not currently available. Each team member needs their own subscription.',
            },
            {
              q: 'Do unused monthly credits roll over?',
              a: 'No. Monthly credits reset to the full plan allocation at the start of each billing cycle. Unused credits are forfeited. Top-up pack credits, however, never expire.',
            },
            {
              q: 'Can I pause my subscription?',
              a: 'Subscription pausing is not currently available. You can cancel and re-subscribe at any time. Re-subscribing starts a new billing cycle with a fresh credit allocation.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}

          <div className="docs-content-footer">
            <Link href="/billing" className="btn-primary btn-sm">Manage Plan →</Link>
            <Link href="/docs" className="btn-ghost btn-sm">← Docs Hub</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
