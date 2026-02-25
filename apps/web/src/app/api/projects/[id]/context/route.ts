import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/projects/[id]/context — returns project brief + brand kit for studio context injection
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [brief, brandKit, project] = await Promise.all([
    prisma.projectBrief.findUnique({ where: { projectId: params.id } }),
    prisma.brandKit.findFirst({ where: { projectId: params.id, userId: session.user.id } }),
    prisma.project.findFirst({
      where: { id: params.id, userId: session.user.id },
      select: { name: true },
    }),
  ]);

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    projectName:  project.name,
    projectType:  brief?.projectType ?? null,
    artStyle:     brief?.artStyle ?? null,
    brandName:    brief?.brandName ?? null,
    briefContent: brief?.content?.slice(0, 600) ?? null,
    palette:      brandKit?.paletteJson ? JSON.parse(brandKit.paletteJson) : null,
    primaryColor: brandKit?.paletteJson
      ? (JSON.parse(brandKit.paletteJson)[0] as { hex?: string })?.hex ?? null
      : null,
  });
}
