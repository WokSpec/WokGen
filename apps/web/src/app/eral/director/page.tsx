import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EralDirectorClient from './_client';

export const metadata = { title: 'Asset Director — Eral · WokGen' };

export default async function EralDirectorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/eral/director');
  return <EralDirectorClient />;
}
