import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// DELETE /api/presets/[id] — delete a generation preset
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const preset = await dbQuery(prisma.generationPreset.findUnique({ where: { id: params.id } }));
    if (!preset || preset.userId !== session.user.id) {
      return API_ERRORS.NOT_FOUND('Preset');
    }

    await dbQuery(prisma.generationPreset.delete({ where: { id: params.id } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/presets/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
