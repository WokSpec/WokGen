import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';

// POST /api/workspaces/[id]/invite
// Body: { email: string, role?: 'member' | 'admin' }
// Auth: project owner only
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const project = await dbQuery(prisma.project.findUnique({ where: { id: params.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Workspace');
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const email: string = (body.email ?? '').trim().toLowerCase();
    const role: string = body.role === 'admin' ? 'admin' : 'member';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return API_ERRORS.BAD_REQUEST('Valid email is required');
    }

    // Expire invitations after 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await dbQuery(prisma.workspaceInvitation.create({
      data: { projectId: params.id, email, role, expiresAt },
    }));

    return NextResponse.json({ invitation: { id: invitation.id, email, role, token: invitation.token, expiresAt } }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/workspaces/[id]/invite failed');
    return API_ERRORS.INTERNAL();
  }
}

// GET /api/workspaces/[id]/invite — list pending invitations
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return API_ERRORS.UNAUTHORIZED();
    }

    const project = await dbQuery(prisma.project.findUnique({ where: { id: params.id } }));
    if (!project) return API_ERRORS.NOT_FOUND('Workspace');
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const invitations = await dbQuery(prisma.workspaceInvitation.findMany({
      where: { projectId: params.id, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, createdAt: true, expiresAt: true },
    }));

    return NextResponse.json({ invitations });
  } catch (err) {
    log.error({ err }, 'GET /api/workspaces/[id]/invite failed');
    return API_ERRORS.INTERNAL();
  }
}
