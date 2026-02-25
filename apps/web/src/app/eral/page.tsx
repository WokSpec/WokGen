import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { EralPage } from './_client';

export const metadata: Metadata = {
  title: 'WokGen Eral — AI Companion by WokSpec',
  description:
    'Ask anything. Create prompts. Get design help. Eral 7c is your AI companion for creative work.',
};

export default async function Eral() {
  const session = await auth();
  return <EralPage userId={session?.user?.id} />;
}
