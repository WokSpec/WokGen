import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationSettingsClient from './_client';

export const metadata: Metadata = {
  title: 'Notification Settings — WokGen',
  description: 'Control where and how WokGen sends you notifications.',
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/settings');
  return <NotificationSettingsClient />;
}
