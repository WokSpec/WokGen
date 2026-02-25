import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// DELETE /api/presets/[id] — delete a generation preset
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const preset = await prisma.generationPreset.findUnique({ where: { id: params.id } });
  if (!preset || preset.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.generationPreset.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
