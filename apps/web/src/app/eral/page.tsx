export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { ERAL_URL } from '@/lib/eral-integration';
import { EralPage } from './_client';

export const metadata: Metadata = {
  title: 'Eral — AI Companion by WokSpec',
  description:
    'Ask anything. Create prompts. Get design help. Eral is your AI companion for creative work.',
};

export default async function Eral() {
  const session = await auth();

  // When a standalone Eral deployment is configured, embed it.
  // The standalone app runs at NEXT_PUBLIC_ERAL_URL (wokspec/Eral repo).
  const isExternal = ERAL_URL.startsWith('http');
  if (isExternal) {
    return (
      <iframe
        src={ERAL_URL}
        title="Eral"
        style={{ width: '100%', height: 'calc(100dvh - 44px)', border: 'none' }}
        allow="microphone; clipboard-write"
      />
    );
  }

  // Bundled (local) mode — served from this app until standalone is ready.
  return <EralPage userId={session?.user?.id} />;
}
