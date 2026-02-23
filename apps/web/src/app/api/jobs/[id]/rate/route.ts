import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const RateSchema = z.object({
  rating: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'rating must be 1, -1, or 0' }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { id: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const userRating = parsed.data.rating === 0 ? null : parsed.data.rating;

  const updated = await prisma.job.update({
    where: { id: params.id },
    data: { userRating },
    select: { id: true, userRating: true },
  });

  return NextResponse.json({ ok: true, job: updated });
}
