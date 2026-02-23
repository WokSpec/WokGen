import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ProjectsClient from './_client';

export const metadata: Metadata = {
  title: 'Projects — WokGen',
  description: 'Manage your WokGen projects.',
};

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?callbackUrl=/projects');
  return <ProjectsClient />;
}
