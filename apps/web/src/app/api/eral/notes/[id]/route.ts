import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';

const UpdateSchema = z.object({
  title:   z.string().min(1).max(200).optional(),
  content: z.string().max(50_000).optional(),
  color:   z.enum(['default','purple','blue','green','amber','red']).optional(),
  pinned:  z.boolean().optional(),
  tags:    z.array(z.string().max(50)).max(10).optional(),
});

async function getNote(noteId: string, userId: string) {
  return dbQuery(prisma.eralNote.findFirst({ where: { id: noteId, userId } }));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const note = await getNote(params.id, session.user.id);
    if (!note) return API_ERRORS.NOT_FOUND('Note');

    let body: unknown;
    try { body = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = UpdateSchema.safeParse(body);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const { tags, ...fields } = parsed.data;

    const updated = await dbQuery(prisma.eralNote.update({
      where: { id: params.id },
      data: {
        ...fields,
        ...(tags !== undefined && {
          tags: { deleteMany: {}, create: tags.map((tag) => ({ tag })) },
        }),
      },
      include: { tags: { select: { tag: true } } },
    }));

    return NextResponse.json({ note: updated });
  } catch (err) {
    log.error({ err, noteId: params.id }, 'PATCH /api/eral/notes/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const note = await getNote(params.id, session.user.id);
    if (!note) return API_ERRORS.NOT_FOUND('Note');

    await dbQuery(prisma.eralNote.delete({ where: { id: params.id } }));
    return NextResponse.json({ ok: true });
  } catch (err) {
    log.error({ err, noteId: params.id }, 'DELETE /api/eral/notes/[id] failed');
    return API_ERRORS.INTERNAL();
  }
}
