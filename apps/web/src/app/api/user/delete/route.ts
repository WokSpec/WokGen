import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';

// DELETE /api/user/delete — permanently delete the authenticated user's account
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Cascade deletes handle jobs, subscriptions, gallery assets, projects, etc.
    await prisma.user.delete({ where: { id: session.user.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ err }, '[DELETE /api/user/delete]');
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
