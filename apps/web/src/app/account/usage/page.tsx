export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsageClient from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata = { title: 'Usage — WokGen' };

export default async function UsagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/account/usage');
  return <ErrorBoundary context="Usage"><UsageClient /></ErrorBoundary>;
}
