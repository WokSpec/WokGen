import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Account · Docs',
  description: 'Managing your WokGen account — profile, authentication, sessions, data, and privacy.',
};

export default function DocsAccount() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* Sidebar */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
             Platform
          </div>
          <nav className="docs-toc">
            <a href="#profile" className="docs-toc-link">Your Profile</a>
            <a href="#authentication" className="docs-toc-link">Authentication</a>
            <a href="#connected-accounts" className="docs-toc-link">Connected Accounts</a>
            <a href="#profile-page" className="docs-toc-link">Profile Page</a>
            <a href="#account-settings" className="docs-toc-link">Account Settings</a>
            <a href="#sessions" className="docs-toc-link">Session Management</a>
            <a href="#data-retention" className="docs-toc-link">Data Retention</a>
            <a href="#delete-account" className="docs-toc-link">Deleting Your Account</a>
            <a href="#privacy" className="docs-toc-link">Privacy</a>
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/docs/platform/billing" className="docs-toc-link">Billing Docs →</Link>
            <Link href="/account" className="docs-toc-link">Account Settings →</Link>
          </div>
        </aside>

        {/* Content */}
        <main className="docs-content">
          <div className="docs-content-header">
            <h1 className="docs-title">Account</h1>
            <p className="docs-subtitle">
              Everything about your WokGen account — what we store, how authentication works,
              how to manage your profile, and your data rights.
            </p>
          </div>

          {/* ── Your Profile ── */}
          <section id="profile">
            <h2 className="docs-h2">Your Profile</h2>
            <p className="docs-p">
              When you sign in with GitHub for the first time, WokGen creates an account record
              with the following information pulled from your GitHub OAuth token:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Name</strong> — your GitHub display name, used across the app and on your public profile.
                You can change it at any time from <Link href="/account" className="docs-code">/account</Link>.
              </li>
              <li className="docs-li">
                <strong>Email</strong> — the primary email on your GitHub account. Used for billing
                notifications and transactional emails only. Never displayed publicly.
              </li>
              <li className="docs-li">
                <strong>Avatar</strong> — your GitHub profile picture, shown on your public profile,
                in the gallery attribution, and in the top navigation. Updated automatically when
                you sign in if your GitHub avatar has changed.
              </li>
            </ul>
            <p className="docs-p">
              Your account is tied to your GitHub identity. If you rename your GitHub account
              or update your avatar, the change will be reflected in WokGen the next time you sign in.
            </p>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">i</span>
              <span>
                You can override your display name within WokGen at{' '}
                <Link href="/account" className="docs-code">/account</Link> without
                affecting your GitHub name.
              </span>
            </div>
          </section>

          {/* ── Authentication ── */}
          <section id="authentication">
            <h2 className="docs-h2">Authentication</h2>
            <p className="docs-p">
              WokGen uses <strong>GitHub OAuth only</strong>. There is no email/password sign-in,
              no magic-link flow, and no other social providers. This is a deliberate design decision:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>No password reset complexity</strong> — GitHub manages credential security for us.
                There is no &ldquo;forgot password&rdquo; flow to build, secure, or have compromised.
              </li>
              <li className="docs-li">
                <strong>Developer-first audience</strong> — WokGen is primarily used by developers,
                indie game makers, and designers who already have GitHub accounts.
              </li>
              <li className="docs-li">
                <strong>Reliability</strong> — GitHub OAuth has extremely high uptime and is
                a well-understood, trusted authentication mechanism.
              </li>
              <li className="docs-li">
                <strong>2FA via GitHub</strong> — if you have two-factor authentication enabled on
                your GitHub account, that protection extends to WokGen automatically.
              </li>
            </ul>
            <p className="docs-p">
              To sign in, click <strong>Sign in with GitHub</strong> from the homepage or any
              protected page. You will be redirected to GitHub to authorize the WokGen app,
              then returned to WokGen with a session cookie set.
            </p>
            <p className="docs-p">
              WokGen requests only the minimum required OAuth scopes: your public profile and email.
              We do not request access to your repositories, organizations, or any write scopes.
            </p>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">i</span>
              <span>
                You can revoke WokGen&apos;s access at any time from{' '}
                <a
                  href="https://github.com/settings/applications"
                  className="docs-code"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/settings/applications
                </a>. Revoking access signs you out of WokGen but does not delete your account or data.
              </span>
            </div>
          </section>

          {/* ── Connected Accounts ── */}
          <section id="connected-accounts">
            <h2 className="docs-h2">Connected Accounts</h2>
            <p className="docs-p">
              WokGen currently supports <strong>GitHub only</strong> as an authentication provider.
              You cannot link multiple providers (e.g., Google, Discord) to the same WokGen account,
              and you cannot merge two WokGen accounts created under different GitHub identities.
            </p>
            <p className="docs-p">
              Your WokGen account is uniquely identified by your GitHub user ID — not your username.
              This means if you rename your GitHub account, your WokGen account stays intact. However,
              if you delete your GitHub account and create a new one, that will be treated as a
              brand-new WokGen account.
            </p>
            <div className="docs-callout docs-callout--warn">
              <span className="docs-callout-icon">!</span>
              <span>
                Support for additional OAuth providers (e.g., Google) may be added in the future.
                When that happens, account merging will require an explicit linking step from{' '}
                <Link href="/account" className="docs-code">/account</Link>.
              </span>
            </div>
          </section>

          {/* ── Profile Page ── */}
          <section id="profile-page">
            <h2 className="docs-h2">Profile Page</h2>
            <p className="docs-p">
              Your public profile is available at <code className="docs-code">/profile</code> when
              signed in. It contains the following sections:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Stats grid</strong> — total generations, gallery saves, HD credits used,
                and active plan badge.
              </li>
              <li className="docs-li">
                <strong>Recent thumbnails</strong> — the 6 most recent publicly saved gallery assets
                attributed to your account. Clicking a thumbnail opens it in the gallery lightbox.
              </li>
              <li className="docs-li">
                <strong>Workspace overview</strong> — a quick view of which studio modes you&apos;ve
                used and how many assets you have in each.
              </li>
              <li className="docs-li">
                <strong>Danger zone</strong> — permanent destructive actions including account
                deletion (see <a href="#delete-account" className="docs-code">Deleting Your Account</a>).
              </li>
            </ul>
            <p className="docs-p">
              The profile page is only visible to you while signed in — it is not a publicly
              accessible URL that other users can visit.
            </p>
          </section>

          {/* ── Account Settings ── */}
          <section id="account-settings">
            <h2 className="docs-h2">Account Settings</h2>
            <p className="docs-p">
              The <Link href="/account" className="docs-code">/account</Link> page is where you
              manage your personal information and view your subscription status.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Display name</strong> — editable field. Changing this updates your name
                across WokGen (gallery attribution, profile display) without affecting your
                GitHub account name.
              </li>
              <li className="docs-li">
                <strong>Email</strong> — shown read-only. Email is sourced from GitHub OAuth and
                cannot be overridden within WokGen. To change it, update your primary email on GitHub
                and sign in again.
              </li>
              <li className="docs-li">
                <strong>Plan badge</strong> — shows your current plan (Free / Plus / Pro / Max).
                Links to <Link href="/billing" className="docs-code">/billing</Link> to upgrade or
                manage your subscription.
              </li>
            </ul>
            <div className="docs-callout docs-callout--tip">
              <span className="docs-callout-icon">→</span>
              <span>
                Avatar updates are not available on <Link href="/account" className="docs-code">/account</Link>.
                To change your avatar, update it on GitHub — it will sync automatically on your next sign-in.
              </span>
            </div>
          </section>

          {/* ── Session Management ── */}
          <section id="sessions">
            <h2 className="docs-h2">Session Management</h2>
            <p className="docs-p">
              WokGen sessions are managed with HTTP-only cookies. When you sign in via GitHub OAuth,
              a secure, signed session token is stored in your browser as an HTTP-only cookie.
              This means the token is inaccessible to JavaScript running on the page, protecting it
              from XSS attacks.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Sign in</strong> — redirects you to GitHub&apos;s OAuth authorization screen,
                then back to WokGen. Your session starts immediately on return.
              </li>
              <li className="docs-li">
                <strong>Sign out</strong> — available from the top navigation menu. Clears your
                session cookie immediately. You are returned to the homepage.
              </li>
              <li className="docs-li">
                <strong>Session persistence</strong> — sessions persist across browser tabs and
                browser restarts. Closing your browser does not sign you out.
              </li>
              <li className="docs-li">
                <strong>Session expiry</strong> — sessions expire after a period of inactivity.
                You will be prompted to sign in again when a session expires.
              </li>
              <li className="docs-li">
                <strong>Multiple devices</strong> — you can be signed in on multiple browsers or
                devices simultaneously. There is no device limit.
              </li>
            </ul>
            <p className="docs-p">
              There is currently no &ldquo;active sessions&rdquo; dashboard to view or revoke specific
              sessions. To invalidate all sessions (e.g., after losing a device), revoke WokGen&apos;s
              OAuth access on GitHub, then re-authorize — this invalidates all existing session tokens.
            </p>
          </section>

          {/* ── Data Retention ── */}
          <section id="data-retention">
            <h2 className="docs-h2">Data Retention</h2>
            <p className="docs-p">
              WokGen stores the minimum data necessary to provide the service. Here is exactly
              what is stored per account:
            </p>
            <div className="docs-table-wrap">
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Data type</th>
                    <th>What&apos;s stored</th>
                    <th>Retention</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Account info</td>
                    <td>Name, email, GitHub ID, avatar URL, plan</td>
                    <td>Until account deletion</td>
                  </tr>
                  <tr>
                    <td>Generation jobs</td>
                    <td>Prompt, tool, mode, result URL, status, timestamps</td>
                    <td>Until account deletion</td>
                  </tr>
                  <tr>
                    <td>Gallery assets</td>
                    <td>Image CDN URL, prompt, tool, seed, public flag</td>
                    <td>Until deleted or account deletion</td>
                  </tr>
                  <tr>
                    <td>Workspace metadata</td>
                    <td>Projects, workspace settings, mode preferences</td>
                    <td>Until account deletion</td>
                  </tr>
                  <tr>
                    <td>Billing data</td>
                    <td>Stripe customer ID, subscription ID, credit balance</td>
                    <td>Per Stripe&apos;s retention policy</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="docs-p">
              WokGen does not store the raw image files you generate — output images are stored
              on CDN URLs provided by our AI inference providers. The CDN URLs are stored in
              your job history so you can access them later.
            </p>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">i</span>
              <span>
                CDN URLs for generation results may have a limited lifetime depending on the
                underlying provider. Download important generations to your device for permanent storage.
              </span>
            </div>
          </section>

          {/* ── Deleting Your Account ── */}
          <section id="delete-account">
            <h2 className="docs-h2">Deleting Your Account</h2>
            <p className="docs-p">
              You can permanently delete your WokGen account from the{' '}
              <strong>Danger Zone</strong> section of your{' '}
              <Link href="/profile" className="docs-code">/profile</Link> page.
            </p>
            <p className="docs-p">
              When you delete your account, the following happens:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">All generation job history is permanently deleted.</li>
              <li className="docs-li">All gallery assets saved by you are removed from the public gallery.</li>
              <li className="docs-li">Your workspace data, projects, and settings are deleted.</li>
              <li className="docs-li">Your account record (name, email, avatar, plan) is deleted.</li>
              <li className="docs-li">Your active subscription is cancelled immediately via Stripe.</li>
              <li className="docs-li">Your session is invalidated and you are signed out.</li>
            </ul>
            <div className="docs-callout docs-callout--warn">
              <span className="docs-callout-icon">!</span>
              <span>
                <strong>Account deletion is irreversible.</strong> There is no grace period and no
                recovery option. All data is permanently removed. Download any assets you want to
                keep before deleting your account.
              </span>
            </div>
            <p className="docs-p">
              To confirm deletion, you will be asked to type a confirmation phrase on the profile page.
              This prevents accidental deletion. The deletion action cannot be undone by WokGen support.
            </p>
          </section>

          {/* ── Privacy ── */}
          <section id="privacy">
            <h2 className="docs-h2">Privacy</h2>
            <p className="docs-p">
              WokGen takes a minimal-data approach to analytics and does not sell user data.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Analytics</strong> — WokGen uses Vercel&apos;s built-in analytics for
                performance monitoring (page load times, Core Web Vitals). No third-party analytics
                platforms (e.g., Google Analytics, Mixpanel, Segment) are embedded in the product.
              </li>
              <li className="docs-li">
                <strong>No data selling</strong> — your prompts, generated assets, email address,
                and usage data are never sold or shared with third parties for advertising or
                profiling purposes.
              </li>
              <li className="docs-li">
                <strong>Prompt visibility</strong> — prompts you include when saving to the public
                gallery are visible to anyone browsing the gallery. Private (non-saved) generations
                are visible only to you in your job history.
              </li>
              <li className="docs-li">
                <strong>Provider data</strong> — when you generate an image, your prompt is sent
                to the AI inference provider (e.g., Pollinations for Standard quality). Those
                providers have their own privacy and data retention policies.
              </li>
              <li className="docs-li">
                <strong>Stripe</strong> — billing and payment data is handled entirely by Stripe.
                WokGen never receives or stores your card number, CVV, or full billing details.
              </li>
            </ul>
            <p className="docs-p">
              For questions about data or privacy, contact us via the support channel linked in
              the footer of every page.
            </p>
          </section>

          <div className="docs-content-footer">
            <Link href="/account" className="btn-primary btn-sm">Account Settings →</Link>
            <Link href="/docs/platform/billing" className="btn-ghost btn-sm">Billing Docs →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
