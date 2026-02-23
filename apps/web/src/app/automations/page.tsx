import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AutomationsClient from './_client';

export const metadata: Metadata = {
  title: 'Automations — WokGen',
  description: 'Schedule automated messages and workflows. Fire webhooks, email digests, or in-app alerts on a cron schedule.',
};

export default async function AutomationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/automations');
  return <AutomationsClient />;
}
