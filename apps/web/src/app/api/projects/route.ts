import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isSupportedMode } from '@/lib/modes';
import { z } from 'zod';
import { withErrorHandler, dbQuery } from '@/lib/api-handler';
import { checkRateLimit } from '@/lib/rate-limit';

// ---------------------------------------------------------------------------
// GET /api/projects — list user's projects
// POST /api/projects — create a new project
// ---------------------------------------------------------------------------

const CreateProjectSchema = z.object({
  name:        z.string().min(1).max(100),
  mode:        z.string().optional(),
  description: z.string().max(500).optional(),
  settings:    z.record(z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mode       = searchParams.get('mode') ?? undefined;
  const archived   = searchParams.get('archived') === 'true';
  const limit      = Math.min(Number(searchParams.get('limit') ?? '20'), 50);
  const page       = Math.max(Number(searchParams.get('page') ?? '1'), 1);

  const projects = await dbQuery(prisma.project.findMany({
    where: {
      userId:     session.user.id,
      isArchived: archived,
      ...(mode ? { mode } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      _count: { select: { jobs: true } },
      jobs: {
        take: 4,
        orderBy: { createdAt: 'desc' },
        where: { status: 'succeeded' },
        select: {
          asset: { select: { id: true, imageUrl: true, thumbUrl: true } },
        },
      },
    },
  }));

  const projectsWithAssets = projects.map(p => ({
    ...p,
    recentAssets: p.jobs.flatMap(j => j.asset ? [j.asset] : []).slice(0, 4),
    jobs: undefined,
  }));

  return NextResponse.json({ projects: projectsWithAssets, page, limit });
});

export const POST = withErrorHandler(async (req) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Rate limit: 20 new projects per user per day
  const rl = await checkRateLimit(`projects:create:${session.user.id}`, 20, 24 * 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Project creation limit reached. Try again tomorrow.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? 86400) } },
    );
  }

  const parsed = CreateProjectSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, { status: 400 });
  }

  const { name, mode, description, settings } = parsed.data;

  if (mode && !isSupportedMode(mode)) {
    return NextResponse.json({ error: `Invalid mode "${mode}".` }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      userId:      session.user.id,
      mode:        mode as string ?? 'pixel',
      name:        name.trim(),
      description: description?.trim() || null,
      settings:    settings ? JSON.stringify(settings) : null,
    },
  });

  return NextResponse.json({ project }, { status: 201 });
});
