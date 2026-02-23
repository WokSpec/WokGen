import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { isSupportedMode } from '@/lib/modes';
import { z } from 'zod';

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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const mode       = searchParams.get('mode') ?? undefined;
  const archived   = searchParams.get('archived') === 'true';
  const limit      = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

  const projects = await prisma.project.findMany({
    where: {
      userId:     session.user.id,
      isArchived: archived,
      ...(mode ? { mode } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: {
      _count: { select: { jobs: true } },
    },
  });

  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
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
}
