import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { z } from 'zod';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

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
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const presets = await dbQuery(prisma.generationPreset.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_PRESETS,
    }));

    return NextResponse.json({ presets });
  } catch (err) {
    log.error({ err }, 'GET /api/presets failed');
    return API_ERRORS.INTERNAL();
  }
}

// POST /api/presets — create a generation preset
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const count = await dbQuery(prisma.generationPreset.count({ where: { userId: session.user.id } }));
    if (count >= MAX_PRESETS) {
      return API_ERRORS.BAD_REQUEST(`Maximum ${MAX_PRESETS} presets allowed.`);
    }

    let body: unknown;
    try { body = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = CreatePresetSchema.safeParse(body);
    if (!parsed.success) {
      return API_ERRORS.BAD_REQUEST(parsed.error.issues[0]?.message ?? 'Invalid request.');
    }

    const { name, mode, prompt, params, brandKitId } = parsed.data;

    const preset = await dbQuery(prisma.generationPreset.create({
      data: { userId: session.user.id, name, mode, prompt, params: params ? JSON.parse(JSON.stringify(params)) : undefined, brandKitId: brandKitId ?? undefined },
    }));

    return NextResponse.json({ preset }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/presets failed');
    return API_ERRORS.INTERNAL();
  }
}
