import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BrandClient from './_client';

export const metadata = { title: 'Brand Kits — WokGen' };

export default async function BrandPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/brand');
  return <BrandClient />;
}
