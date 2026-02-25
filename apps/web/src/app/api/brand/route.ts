import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET  /api/brand   — list user's brand kits
// POST /api/brand   — create a brand kit
// ---------------------------------------------------------------------------

const CreateBrandKitSchema = z.object({
  name:        z.string().min(1).max(80),
  paletteJson: z.array(z.object({
    hex:  z.string(),
    name: z.string().optional(),
    role: z.string().optional(),
  })).or(z.array(z.string())).optional().default([]),
  typography:  z.record(z.unknown()).optional(),
  styleGuide:  z.string().max(4000).optional(),
  industry:    z.string().max(80).optional(),
  mood:        z.string().max(80).optional(),
  projectId:   z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const cacheKey = `brand:${session.user.id}`;
  const cached = await cache.get<object[]>(cacheKey);
  if (cached) return NextResponse.json({ kits: cached });

  const kits = await prisma.brandKit.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });

  await cache.set(cacheKey, kits, 300);
  return NextResponse.json({ kits });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  const parsed = CreateBrandKitSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request body.' }, { status: 400 });
  }

  const { name, paletteJson, typography, styleGuide, industry, mood, projectId } = parsed.data;

  const kit = await prisma.brandKit.create({
    data: {
      userId: session.user.id,
      name,
      paletteJson: JSON.stringify(paletteJson ?? []),
      typography:  typography  ? JSON.stringify(typography) : null,
      styleGuide:  styleGuide  ?? null,
      industry:    industry    ?? null,
      mood:        mood        ?? null,
      projectId:   projectId   ?? null,
    },
  });

  if (projectId) {
    prisma.activityEvent.create({
      data: {
        projectId,
        userId: session.user.id,
        type: 'brand.created',
        message: `Brand kit "${name}" created`,
        refId: kit.id,
      },
    }).catch(() => {});
  }

  return NextResponse.json({ kit }, { status: 201 });
}
