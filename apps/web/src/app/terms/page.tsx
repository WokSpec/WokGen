import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'WokGen Terms of Service — rules for using the platform.',
  robots: { index: false },
};

const EFFECTIVE = 'February 22, 2025';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-heading)', margin: 0 }}>{title}</h2>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 680, margin: '0 auto', padding: '4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.5rem' }}>Last updated: {EFFECTIVE}</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)', color: 'var(--text)', margin: 0 }}>Terms of Service</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.7 }}>
          These Terms govern your use of WokGen, operated by Wok Specialists LLC (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
          By using WokGen you agree to these Terms. If you do not agree, do not use the service.
        </p>
      </div>

      <Section title="1. The Service">
        <p>WokGen is an AI pixel art generation platform available at <strong>wokgen.wokspec.org</strong>.
        We provide access to AI image generation models via third-party providers (Replicate, fal.ai, Together.ai, Pollinations).
        Standard generation is free. HD generation requires credits purchased via paid plans or one-time top-up packs.</p>
      </Section>

      <Section title="2. Accounts">
        <p>You sign in via GitHub OAuth. You are responsible for your account and all activity under it.
        You must be at least 13 years old to use the service. We reserve the right to suspend or terminate accounts
        that violate these Terms.</p>
      </Section>

      <Section title="3. Acceptable Use">
        <p>You may not use WokGen to generate content that:</p>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
          <li>Depicts minors in a sexual manner</li>
          <li>Constitutes harassment, hate speech, or incitement to violence</li>
          <li>Violates any applicable law or regulation</li>
          <li>Infringes third-party intellectual property rights</li>
          <li>Is intended to deceive, defraud, or cause harm</li>
        </ul>
        <p style={{ marginTop: '0.75rem' }}>We reserve the right to remove content and terminate accounts that violate these rules without notice.</p>
      </Section>

      <Section title="4. Payments and Refunds">
        <p>Paid plans are billed monthly via Stripe. Credit top-up packs are one-time purchases. All sales are final.
        We do not offer refunds for unused credits or subscription periods. You may cancel your subscription at any time;
        access continues until the end of the current billing period.</p>
      </Section>

      <Section title="5. Intellectual Property">
        <p>You retain ownership of the images you generate. You grant us a limited license to store and display
        images you mark as public in the gallery. We retain all rights to the WokGen platform, code, and brand.</p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>Generation is powered by third-party AI providers. Their terms and content policies also apply.
        We are not responsible for the availability, accuracy, or output of those services.</p>
      </Section>

      <Section title="7. Disclaimer of Warranties">
        <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
        WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT GENERATED CONTENT
        WILL MEET YOUR REQUIREMENTS.</p>
      </Section>

      <Section title="8. Limitation of Liability">
        <p>TO THE FULLEST EXTENT PERMITTED BY LAW, WOK SPECIALISTS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
        OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.</p>
      </Section>

      <Section title="9. Changes to Terms">
        <p>We may update these Terms at any time. Continued use after changes are posted constitutes acceptance.
        We will announce material changes via the platform.</p>
      </Section>

      <Section title="10. Contact">
        <p>Questions? Email us at <a href="mailto:team@wokspec.org" style={{ color: '#a78bfa', textDecoration: 'none' }}>team@wokspec.org</a>.</p>
      </Section>

      <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
        <Link href="/" style={{ fontSize: '0.8rem', color: 'var(--text-faint)', textDecoration: 'none' }}>← Back to WokGen</Link>
      </div>
    </main>
  );
}
