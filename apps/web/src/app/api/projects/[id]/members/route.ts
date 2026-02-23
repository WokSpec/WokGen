import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET    /api/projects/[id]/members   — list members
// POST   /api/projects/[id]/members   — add/invite a member
// DELETE /api/projects/[id]/members   — remove a member (?userId=)
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  // Owner or any member can view the member list
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  const asMember = !project
    ? await prisma.projectMember.findFirst({ where: { projectId: params.id, userId: session.user.id } })
    : null;
  if (!project && !asMember) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const members = await prisma.projectMember.findMany({
    where: { projectId: params.id },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  // Enrich with user display info
  const userIds = members.map(m => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    take: 50,
    select: { id: true, name: true, email: true, image: true },
  });
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));

  const enriched = members.map(m => ({ ...m, user: userMap[m.userId] ?? null }));
  return NextResponse.json({ members: enriched });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  // Only the project owner can add members
  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found or not owner.' }, { status: 404 });

  const body = await req.json().catch(() => null);
  const { email, role = 'editor' } = body ?? {};
  if (!email) return NextResponse.json({ error: 'email is required.' }, { status: 400 });
  if (!['owner', 'editor', 'viewer'].includes(role)) {
    return NextResponse.json({ error: 'role must be owner, editor, or viewer.' }, { status: 400 });
  }

  const invitee = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!invitee) return NextResponse.json({ error: 'No user with that email address.' }, { status: 404 });
  if (invitee.id === session.user.id) {
    return NextResponse.json({ error: 'You are already the project owner.' }, { status: 400 });
  }

  const member = await prisma.projectMember.upsert({
    where:  { projectId_userId: { projectId: params.id, userId: invitee.id } },
    create: { projectId: params.id, userId: invitee.id, role, invitedBy: session.user.id },
    update: { role },
  });
  return NextResponse.json({ member }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found or not owner.' }, { status: 404 });

  const targetUserId = new URL(req.url).searchParams.get('userId');
  if (!targetUserId) return NextResponse.json({ error: 'userId query param required.' }, { status: 400 });

  await prisma.projectMember.deleteMany({ where: { projectId: params.id, userId: targetUserId } });
  return NextResponse.json({ ok: true });
}
