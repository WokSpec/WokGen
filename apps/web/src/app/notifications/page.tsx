import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationsClient from './_client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Notifications | WokGen' };

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return <NotificationsClient />;
}
