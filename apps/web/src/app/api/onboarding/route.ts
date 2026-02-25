import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET  /api/onboarding  — return current onboarding state
// PATCH /api/onboarding — update step / useCase
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  step:      z.number().int().min(0).max(4).optional(),
  useCase:   z.enum(['game-dev', 'brand', 'creative', 'developer', 'product', 'explore']).optional(),
  completed: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const state = await dbQuery(prisma.onboardingState.findUnique({
      where: { userId: session.user.id },
    }));

    return NextResponse.json({ state: state ?? null });
  } catch (err) {
    log.error({ err }, 'GET /api/onboarding failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = PatchSchema.safeParse(rawBody);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const { step, useCase, completed } = parsed.data;

    const state = await dbQuery(prisma.onboardingState.upsert({
      where:  { userId: session.user.id },
      create: {
        userId:      session.user.id,
        step:        step ?? 1,
        useCase:     useCase ?? null,
        completedAt: completed ? new Date() : null,
      },
      update: {
        ...(step      !== undefined && { step }),
        ...(useCase   !== undefined && { useCase }),
        ...(completed !== undefined && { completedAt: completed ? new Date() : null }),
      },
    }));

    return NextResponse.json({ state });
  } catch (err) {
    log.error({ err }, 'PATCH /api/onboarding failed');
    return API_ERRORS.INTERNAL();
  }
}
