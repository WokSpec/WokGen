import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const MAX_PRESETS = 20;

const CreatePresetSchema = z.object({
  name:       z.string().min(1).max(80),
  mode:       z.string().min(1).max(40),
  prompt:     z.string().min(1).max(2000),
  params:     z.record(z.unknown()).optional(),
  brandKitId: z.string().optional(),
});

// GET /api/presets — list user's generation presets
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const presets = await prisma.generationPreset.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: MAX_PRESETS,
  });

  return NextResponse.json({ presets });
}

// POST /api/presets — create a generation preset
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const count = await prisma.generationPreset.count({ where: { userId: session.user.id } });
  if (count >= MAX_PRESETS) {
    return NextResponse.json({ error: `Maximum ${MAX_PRESETS} presets allowed.` }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  const parsed = CreatePresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  const preset = await prisma.generationPreset.create({
    data: { userId: session.user.id, ...parsed.data },
  });

  return NextResponse.json({ preset }, { status: 201 });
}
