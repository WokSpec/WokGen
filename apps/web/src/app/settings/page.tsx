import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import NotificationSettingsClient from './_client';

export const metadata: Metadata = {
  title: 'Settings | WokGen',
  description: 'Manage your WokGen account, privacy, and security settings.',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/settings');

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account Settings</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Manage your WokGen account, privacy, and security settings.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile */}
        <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Profile</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {session.user.image ? (
              <Image src={session.user.image} alt={session.user.name || 'Avatar'} width={56} height={56} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
            ) : (
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.25rem', color: '#a78bfa' }}>
                {(session.user.name || session.user.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{session.user.name || 'Anonymous'}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{session.user.email}</div>
            </div>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Profile information is synced from your OAuth provider (GitHub or Google). To update your name or avatar, change it on your provider account.</p>
        </section>

        {/* Sign-in Methods */}
        <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>Sign-in Methods</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>WokGen uses OAuth-only authentication — no passwords to manage or leak.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {([
              { id: 'github', label: 'GitHub', icon: 'GH' },
              { id: 'google', label: 'Google', icon: 'G' },
            ] as const).map(provider => (
              <div key={provider.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700 }}>{provider.icon}</span>
                  <span style={{ fontSize: '0.9375rem' }}>{provider.label}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.2rem 0.625rem', border: '1px solid var(--border)', borderRadius: '999px' }}>
                  {(session as any).provider === provider.id ? 'Connected' : 'Not connected'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Notifications</h2>
          <NotificationSettingsClient />
        </section>

        {/* API Access */}
        <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>API Access</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Create API keys to use WokAPI programmatically. Keys authenticate requests to <code style={{ fontSize: '0.8125rem', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>/api/v1/*</code> endpoints for asset generation, tool access, and more.</p>
          <a href="/account/api-keys" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Manage API Keys <span style={{ opacity: 0.5 }}>→</span>
          </a>
        </section>

        {/* Billing */}
        <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem' }}>Billing</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Billing is currently in beta. Upgrade options coming soon. WokGen is free for all users in the meantime.</p>
        </section>

        {/* Danger zone */}
        <section style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1.5rem', background: 'rgba(239,68,68,0.03)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.375rem', color: '#f87171' }}>Danger Zone</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Permanently delete your account and all data. This cannot be undone.</p>
          <form action="/api/account/delete" method="POST">
            <button
              type="submit"
              style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: '#f87171', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}
            
            >
              Delete Account
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
