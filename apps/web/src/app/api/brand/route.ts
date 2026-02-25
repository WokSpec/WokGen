import { NextRequest, NextResponse } from 'next/server';
import { prisma, dbQuery } from '@/lib/db';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

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
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const cacheKey = `brand:${session.user.id}`;
    const cached = await cache.get<object[]>(cacheKey);
    if (cached) return NextResponse.json({ kits: cached });

    const kits = await dbQuery(prisma.brandKit.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    }));

    await cache.set(cacheKey, kits, 300);
    return NextResponse.json({ kits });
  } catch (err) {
    log.error({ err }, 'GET /api/brand failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const rl = await checkRateLimit(`brand-create:${session.user.id}`, 20, 86_400_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter ?? 3600) },
      });
    }

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = CreateBrandKitSchema.safeParse(rawBody);
    if (!parsed.success) {
      return API_ERRORS.BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Invalid request body.');
    }

    const { name, paletteJson, typography, styleGuide, industry, mood, projectId } = parsed.data;

    const kit = await dbQuery(prisma.brandKit.create({
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
    }));

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
  } catch (err) {
    log.error({ err }, 'POST /api/brand failed');
    return API_ERRORS.INTERNAL();
  }
}
