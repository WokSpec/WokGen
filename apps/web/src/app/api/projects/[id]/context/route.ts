import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// GET /api/projects/[id]/context — returns project brief + brand kit for studio context injection
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const [brief, brandKit, project] = await Promise.all([
      dbQuery(prisma.projectBrief.findUnique({ where: { projectId: params.id } })),
      dbQuery(prisma.brandKit.findFirst({ where: { projectId: params.id, userId: session.user.id } })),
      dbQuery(prisma.project.findFirst({
        where:  { id: params.id, userId: session.user.id },
        select: { name: true },
      })),
    ]);

    if (!project) return API_ERRORS.NOT_FOUND('Project');

    let palette: unknown = null;
    let primaryColor: string | null = null;
    if (brandKit?.paletteJson) {
      try {
        const parsed = JSON.parse(brandKit.paletteJson) as Array<{ hex?: string }>;
        palette = parsed;
        primaryColor = parsed[0]?.hex ?? null;
      } catch { /* malformed palette — ignore */ }
    }

    return NextResponse.json({
      projectName:  project.name,
      projectType:  brief?.projectType ?? null,
      artStyle:     brief?.artStyle ?? null,
      brandName:    brief?.brandName ?? null,
      briefContent: brief?.content?.slice(0, 600) ?? null,
      palette,
      primaryColor,
    });
  } catch (err) {
    log.error({ err, projectId: params.id }, 'GET /api/projects/[id]/context failed');
    return API_ERRORS.INTERNAL();
  }
}
