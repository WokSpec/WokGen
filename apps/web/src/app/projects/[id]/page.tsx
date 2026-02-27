export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import ProjectDashboard from './_client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props) {
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { name: true } });
  return { title: project ? `${project.name} — WokGen Projects` : 'Project — WokGen' };
}

export default async function ProjectPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/projects/${params.id}`);

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { brief: true },
  });
  if (!project) redirect('/');

  return (
    <ErrorBoundary context="Project">
      <ProjectDashboard
        projectId={params.id}
        projectName={project.name}
        projectMode={project.mode}
        brief={project.brief ? {
          genre:       project.brief.genre       ?? undefined,
          artStyle:    project.brief.artStyle     ?? undefined,
          paletteJson: project.brief.paletteJson  ?? undefined,
          brandName:   project.brief.brandName    ?? undefined,
          industry:    project.brief.industry     ?? undefined,
          colorHex:    project.brief.colorHex     ?? undefined,
          styleGuide:  project.brief.styleGuide   ?? undefined,
        } : null}
      />
    </ErrorBoundary>
  );
}
