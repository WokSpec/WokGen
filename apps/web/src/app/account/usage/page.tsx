import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UsageClient from './_client';

export const metadata = { title: 'Usage — WokGen' };

export default async function UsagePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/account/usage');
  return <UsageClient />;
}
