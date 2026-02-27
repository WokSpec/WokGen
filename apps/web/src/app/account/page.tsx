import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Account — WokGen',
  description: 'Manage your WokGen account and settings.',
  robots: { index: false, follow: false },
};

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import AccountClient from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/account');

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <ErrorBoundary context="Account">
      <AccountClient
        user={{
          name:  user?.name  ?? null,
          email: user?.email ?? null,
          image: user?.image ?? null,
        }}
      />
    </ErrorBoundary>
  );
}
