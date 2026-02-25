import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// Verify ownership helper
async function verifyOwnership(id: string, userId: string) {
  const workspace = await dbQuery(prisma.project.findUnique({ where: { id } }));
  if (!workspace) return { error: 'Workspace not found', status: 404 };
  if (workspace.userId !== userId) return { error: 'Forbidden', status: 403 };
  return { workspace };
}

// PATCH /api/workspaces/[id] — rename
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const check = await verifyOwnership(params.id, session.user.id);
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    const body = await req.json().catch(() => ({}));
    const name = (body.name ?? '').trim();
    if (!name || name.length > 40) {
      return API_ERRORS.BAD_REQUEST('Workspace name must be 1–40 characters');
    }

    const updated = await dbQuery(prisma.project.update({
      where: { id: params.id },
      data:  { name },
    }));

    return NextResponse.json({ workspace: { id: updated.id, name: updated.name } });
  } catch (err) {
    log.error({ err }, 'PATCH /api/workspaces/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

// DELETE /api/workspaces/[id] — soft-delete (isArchived = true)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const check = await verifyOwnership(params.id, session.user.id);
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status });

    await dbQuery(prisma.project.update({
      where: { id: params.id },
      data:  { isArchived: true },
    }));

    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err }, 'DELETE /api/workspaces/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
