export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import NotificationSettingsClient from './_client';
import { AppearanceSettings } from './_components/AppearanceSettings';
import BillingSection from './_components/BillingSection';
import { AiServicesSettings } from './_components/AiServicesSettings';

export const metadata: Metadata = {
  title: 'Settings | WokGen',
  description: 'Manage your WokGen account, privacy, and security settings.',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/settings');

  return (
    <div className="settings-page">
      <h1 className="settings-page__title">Account Settings</h1>
      <p className="settings-page__subtitle">Manage your WokGen account, privacy, and security settings.</p>

      <div className="settings-sections">
        {/* Profile */}
        <section className="settings-card">
          <h2 className="settings-card__title">Profile</h2>
          <div className="settings-profile-row">
            {session.user.image ? (
              <Image src={session.user.image} alt={session.user.name || 'Avatar'} width={56} height={56} className="settings-avatar-img" />
            ) : (
              <div className="settings-avatar-placeholder">
                {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div className="settings-profile-name">{session.user.name || 'Anonymous'}</div>
              <div className="settings-profile-email">{session.user.email}</div>
            </div>
          </div>
          <p className="settings-card__desc">Profile information is synced from your OAuth provider (GitHub or Google). To update your name or avatar, change it on your provider account.</p>
        </section>

        {/* Sign-in Methods */}
        <section className="settings-card">
          <h2 className="settings-card__title">Sign-in Methods</h2>
          <p className="settings-card__desc settings-card__desc--mb">WokGen uses OAuth-only authentication — no passwords to manage or leak.</p>
          <div className="settings-providers">
            {([
              { id: 'github', label: 'GitHub', icon: 'GH' },
              { id: 'google', label: 'Google', icon: 'G' },
            ] as const).map(provider => (
              <div key={provider.id} className="settings-provider-row">
                <div className="settings-provider-left">
                  <span className="settings-provider-icon">{provider.icon}</span>
                  <span className="settings-provider-label">{provider.label}</span>
                </div>
                <span className="settings-provider-status">
                  {(session as any).provider === provider.id ? 'Connected' : 'Not connected'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <h2 className="settings-card__title">Notifications</h2>
          <NotificationSettingsClient />
        </section>

        {/* Appearance */}
        <AppearanceSettings />

        {/* AI Services / BYOK */}
        <section className="settings-card">
          <h2 className="settings-card__title">AI Services</h2>
          <p className="settings-card__desc settings-card__desc--mb">Bring your own API keys (BYOK) for external AI and media services.</p>
          <AiServicesSettings />
        </section>

        {/* API Access / Developer */}
        <section className="settings-card">
          <h2 className="settings-card__title">Developer</h2>
          <p className="settings-card__desc settings-card__desc--mb">Create API keys, configure webhooks, and access the SDK to use WokGen programmatically.</p>
          <div className="settings-dev-links">
            <a href="/account/api-keys" className="settings-dev-link">API Keys <span aria-hidden="true">→</span></a>
            <a href="/account/webhooks" className="settings-dev-link">Webhooks <span aria-hidden="true">→</span></a>
            <a href="/docs/api" className="settings-dev-link">SDK Docs <span aria-hidden="true">→</span></a>
          </div>
        </section>

        {/* Billing */}
        <BillingSection />

        {/* Danger zone */}
        <section className="settings-card settings-card--danger">
          <h2 className="settings-card__title settings-card__title--danger">Danger Zone</h2>
          <p className="settings-card__desc settings-card__desc--mb">Permanently delete your account and all data. This cannot be undone.</p>
          <form action="/api/account/delete" method="POST">
            <button type="submit" className="btn-danger">Delete Account</button>
          </form>
        </section>
      </div>
    </div>
  );
}
