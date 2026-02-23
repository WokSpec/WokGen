import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Verify the current session is an admin.
 * Returns null if authorized, or a NextResponse with 401/403 if not.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string } | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Check DB isAdmin flag first, fall back to ADMIN_EMAIL env var for bootstrap
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const isAdmin = user.isAdmin || (ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { userId: user.id, email: user.email ?? '' };
}

export function isAdminResponse(result: unknown): result is NextResponse {
  return result instanceof NextResponse;
}
