import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// DELETE /api/keys/[id]  — revoke a key
// PATCH  /api/keys/[id]  — rename a key
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

interface Ctx { params: { id: string } }

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userId = session?.user?.id ?? 'self-hosted';

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } });
  if (!key || key.userId !== userId) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  await prisma.apiKey.update({ where: { id: params.id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  const userId = session?.user?.id ?? 'self-hosted';

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : null;
  if (!name) return NextResponse.json({ error: 'name is required.' }, { status: 400 });

  const key = await prisma.apiKey.findUnique({ where: { id: params.id } });
  if (!key || key.userId !== userId) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const updated = await prisma.apiKey.update({ where: { id: params.id }, data: { name } });
  return NextResponse.json({ key: updated });
}
