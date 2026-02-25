import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
import { z } from 'zod';

const MAX_NOTES = 500;

const CreateSchema = z.object({
  title:   z.string().min(1).max(200).default('Untitled'),
  content: z.string().max(50_000).default(''),
  color:   z.enum(['default','purple','blue','green','amber','red']).default('default'),
  tags:    z.array(z.string().max(50)).max(10).default([]),
});

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    const notes = await dbQuery(prisma.eralNote.findMany({
      where:   { userId: session.user.id },
      include: { tags: { select: { tag: true } } },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      take:    MAX_NOTES,
    }));

    return NextResponse.json({ notes });
  } catch (err) {
    log.error({ err }, 'GET /api/eral/notes failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return API_ERRORS.UNAUTHORIZED();

    let body: unknown;
    try { body = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON'); }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const { title, content, color, tags } = parsed.data;

    const note = await dbQuery(prisma.eralNote.create({
      data: {
        userId: session.user.id,
        title,
        content,
        color,
        tags: { create: tags.map((tag) => ({ tag })) },
      },
      include: { tags: { select: { tag: true } } },
    }));

    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/eral/notes failed');
    return API_ERRORS.INTERNAL();
  }
}
