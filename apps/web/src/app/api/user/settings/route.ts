import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { publicGenerationsDefault: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ publicGenerationsDefault: user.publicGenerationsDefault });
}

export async function PATCH(req: NextRequest) {
  const { auth } = await import('@/lib/auth');
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { publicGenerationsDefault?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.publicGenerationsDefault !== 'boolean') {
    return NextResponse.json({ error: 'publicGenerationsDefault must be boolean' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { publicGenerationsDefault: body.publicGenerationsDefault },
    select: { publicGenerationsDefault: true },
  });

  return NextResponse.json({ publicGenerationsDefault: user.publicGenerationsDefault });
}
