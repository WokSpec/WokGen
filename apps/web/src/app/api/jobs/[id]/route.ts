import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const job = await prisma.job.findUnique({
    where: { id },
    include: { assets: true },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Allow access to own jobs or anonymous jobs
  if (job.userId && job.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    tool: job.tool,
    prompt: job.prompt,
    provider: job.provider,
    error: job.error,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    assets: job.assets.map((a) => ({ id: a.id, url: a.url, format: a.format })),
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.userId !== session?.user?.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.job.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
