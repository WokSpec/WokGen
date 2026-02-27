import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { log } from '@/lib/logger';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Delete related data before removing the user.
    // Models with onDelete: Cascade will be handled automatically,
    // but we explicitly clean up models with onDelete: SetNull or no cascade.
    // Errors are logged but non-fatal for pre-delete cleanup steps.
    await prisma.eralNote.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: eralNote cleanup failed'));
    await prisma.eralConversation.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: eralConversation cleanup failed'));
    await prisma.galleryAsset.deleteMany({ where: { job: { userId } } }).catch((e) => log.warn({ err: e, userId }, 'account delete: galleryAsset cleanup failed'));
    await prisma.apiKey.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: apiKey cleanup failed'));
    await prisma.userPreference.delete({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: userPreference cleanup failed'));
    await prisma.usagePeriod.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: usagePeriod cleanup failed'));
    await prisma.subscription.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: subscription cleanup failed'));
    await prisma.account.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: account cleanup failed'));
    await prisma.session.deleteMany({ where: { userId } }).catch((e) => log.warn({ err: e, userId }, 'account delete: session cleanup failed'));
    await prisma.user.delete({ where: { id: userId } });

    log.info({ userId }, 'account deleted');

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://wokgen.wokspec.org';
    return Response.redirect(new URL('/login?deleted=true', baseUrl), 303);
  } catch (error) {
    log.error({ err: error, userId }, 'Account deletion failed');
    return new Response('Failed to delete account. Please contact support.', { status: 500 });
  }
}
