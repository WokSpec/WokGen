import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'WokGen Privacy Policy — how we collect and use your data.',
  robots: { index: false },
};

const EFFECTIVE = 'February 22, 2025';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="legal-section">
      <h2 className="legal-section-title">{title}</h2>
      <div className="legal-section-body">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="legal-header">
        <p className="legal-date">Last updated: {EFFECTIVE}</p>
        <h1 className="legal-title">Privacy Policy</h1>
        <p className="legal-subtitle">
          This Privacy Policy describes how Wok Specialists LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
          uses, and shares information when you use WokGen at <strong>wokgen.wokspec.org</strong>.
        </p>
      </div>

      <Section title="1. Information We Collect">
        <p><strong className="legal-strong">Account data:</strong> When you sign in with GitHub, we receive your GitHub username, email address, and profile picture. We store this in our database to identify your account.</p>
        <p className="legal-p-gap"><strong className="legal-strong">Generation data:</strong> We store the prompts you submit, the images generated, and metadata (tool used, provider, size, timestamp). This lets us show you your generation history.</p>
        <p className="legal-p-gap"><strong className="legal-strong">Billing data:</strong> If you purchase a plan or credits, Stripe processes your payment. We store a Stripe customer ID and subscription status but never see or store your full card details.</p>
        <p className="legal-p-gap"><strong className="legal-strong">Usage data:</strong> We log generation counts per billing period to enforce plan quotas. We do not sell usage data.</p>
        <p className="legal-p-gap"><strong className="legal-strong">Guest usage:</strong> If you generate without signing in, we do not collect any personally identifiable information. IP addresses are used only for rate-limiting and are not stored long-term.</p>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="legal-list">
          <li>To provide and operate the service (authentication, generation, billing)</li>
          <li>To send transactional emails (welcome, low-credit warnings, payment receipts) via Resend</li>
          <li>To enforce plan quotas and rate limits</li>
          <li>To detect and prevent abuse</li>
          <li>To improve the platform (aggregate, anonymised analytics only)</li>
        </ul>
        <p className="legal-p-gap">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
      </Section>

      <Section title="3. Third-Party Services">
        <ul className="legal-list">
          <li><strong className="legal-strong">Vercel</strong> — hosting. Your requests are processed on Vercel infrastructure. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="legal-link">Privacy policy →</a></li>
          <li><strong className="legal-strong">Neon</strong> — serverless PostgreSQL database hosting your account and generation data. <a href="https://neon.tech/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">Privacy policy →</a></li>
          <li><strong className="legal-strong">Stripe</strong> — payment processing. Governed by Stripe&apos;s privacy policy. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="legal-link">Privacy policy →</a></li>
          <li><strong className="legal-strong">Resend</strong> — transactional email delivery. <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="legal-link">Privacy policy →</a></li>
          <li><strong className="legal-strong">GitHub OAuth</strong> — authentication. We receive only your public profile and primary email. <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer" className="legal-link">Privacy statement →</a></li>
          <li><strong className="legal-strong">AI Providers</strong> — your prompts are sent to Replicate, fal.ai, Together.ai, or Pollinations to generate images. Their privacy policies apply to prompts processed by their models.</li>
        </ul>
      </Section>

      <Section title="4. Data Retention">
        <p>We retain your account data and generation history while your account is active. If you delete your account,
        we will delete your personal data within 30 days, except where required by law (e.g. payment records may
        be retained for tax/accounting purposes).</p>
      </Section>

      <Section title="5. Your Rights">
        <p>Depending on your location, you may have rights to access, correct, or delete your personal data,
        or to object to or restrict processing. To exercise these rights, email
        <a href="mailto:privacy@wokspec.org" className="legal-link legal-link-indent">privacy@wokspec.org</a>.
        We will respond within 30 days.</p>
        <p className="legal-p-gap">You can delete your account and all associated data from the Account settings page.</p>
      </Section>

      <Section title="6. Cookies & Local Storage">
        <p>We use a single HTTP-only session cookie for authentication (NextAuth JWT). We do not use tracking
        cookies or third-party analytics cookies. Provider API keys entered in the Studio are stored only
        in your browser&apos;s <code className="legal-code">localStorage</code> and never sent to our servers.</p>
      </Section>

      <Section title="7. Children">
        <p>WokGen is not directed to children under 13. We do not knowingly collect data from children under 13.
        If you believe we have, contact us immediately.</p>
      </Section>

      <Section title="8. Changes">
        <p>We may update this policy. We will post the new version here with an updated date and announce
        material changes on the platform.</p>
      </Section>

      <Section title="9. Contact">
        <p>Privacy questions: <a href="mailto:privacy@wokspec.org" className="legal-link">privacy@wokspec.org</a></p>
        <p>General contact: <a href="mailto:team@wokspec.org" className="legal-link">team@wokspec.org</a></p>
      </Section>

      <div className="legal-footer">
        <Link href="/" className="legal-back-link">← Back to WokGen</Link>
      </div>
    </main>
  );
}
