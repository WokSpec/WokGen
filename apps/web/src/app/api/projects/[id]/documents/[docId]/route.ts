import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET    /api/projects/[id]/documents/[docId]
// PATCH  /api/projects/[id]/documents/[docId]
// DELETE /api/projects/[id]/documents/[docId]
// ---------------------------------------------------------------------------

const UpdateSchema = z.object({
  title:   z.string().min(1).max(200).optional(),
  content: z.string().max(500_000).optional(),
});

type Params = { params: { id: string; docId: string } };

async function getDoc(projectId: string, docId: string, userId: string) {
  return dbQuery(prisma.document.findFirst({ where: { id: docId, projectId, userId } }));
}

export async function GET(
  _req: NextRequest,
  { params }: Params,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const doc = await getDoc(params.id, params.docId, session.user.id);
    if (!doc) return API_ERRORS.NOT_FOUND('Document');
    return NextResponse.json({ document: doc });
  } catch (err) {
    log.error({ err, docId: params.docId }, 'GET /api/projects/[id]/documents/[docId] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: Params,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const doc = await getDoc(params.id, params.docId, session.user.id);
    if (!doc) return API_ERRORS.NOT_FOUND('Document');

    let body: unknown;
    try { body = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const updated = await dbQuery(prisma.document.update({
      where:  { id: params.docId },
      data:   parsed.data,
      select: { id: true, title: true, template: true, updatedAt: true },
    }));
    return NextResponse.json({ document: updated });
  } catch (err) {
    log.error({ err, docId: params.docId }, 'PATCH /api/projects/[id]/documents/[docId] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: Params,
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();
    const doc = await getDoc(params.id, params.docId, session.user.id);
    if (!doc) return API_ERRORS.NOT_FOUND('Document');
    await dbQuery(prisma.document.delete({ where: { id: params.docId } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err, docId: params.docId }, 'DELETE /api/projects/[id]/documents/[docId] failed');
    return API_ERRORS.INTERNAL();
  }
}
