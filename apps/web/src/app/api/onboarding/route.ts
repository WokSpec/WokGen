import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET  /api/onboarding  — return current onboarding state
// PATCH /api/onboarding — update step / useCase
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  step:       z.number().int().min(0).max(4).optional(),
  useCase:    z.enum(['game-dev', 'brand', 'creative', 'developer']).optional(),
  completed:  z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const state = await prisma.onboardingState.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ state: state ?? null });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });

  const parsed = PatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { step, useCase, completed } = parsed.data;

  const state = await prisma.onboardingState.upsert({
    where:  { userId: session.user.id },
    create: {
      userId:      session.user.id,
      step:        step ?? 1,
      useCase:     useCase ?? null,
      completedAt: completed ? new Date() : null,
    },
    update: {
      ...(step     !== undefined && { step }),
      ...(useCase  !== undefined && { useCase }),
      ...(completed !== undefined && { completedAt: completed ? new Date() : null }),
    },
  });

  return NextResponse.json({ state });
}
