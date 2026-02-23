import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/settings/notifications  — fetch current notification prefs
// PUT /api/settings/notifications  — update notification prefs
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const DEFAULTS = {
  notifyEmailJobDone:  true,
  notifyEmailComment:  true,
  notifyEmailDigest:   false,
  notifyInAppQuota:    true,
  notifyInAppLevelUp:  true,
  notifyAdminChannel:  'email',
  notifyWebhookUrl:    null as string | null,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: {
      notifyEmailJobDone: true,
      notifyEmailComment: true,
      notifyEmailDigest:  true,
      notifyInAppQuota:   true,
      notifyInAppLevelUp: true,
      notifyAdminChannel: true,
      notifyWebhookUrl:   true,
    },
  });

  return NextResponse.json({ settings: pref ?? DEFAULTS });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    notifyEmailJobDone,
    notifyEmailComment,
    notifyEmailDigest,
    notifyInAppQuota,
    notifyInAppLevelUp,
    notifyAdminChannel,
    notifyWebhookUrl,
  } = body;

  // Validate webhook URL if provided
  if (notifyWebhookUrl && typeof notifyWebhookUrl === 'string') {
    try { new URL(notifyWebhookUrl); } catch {
      return NextResponse.json({ error: 'Invalid webhook URL' }, { status: 400 });
    }
  }

  const data: Record<string, unknown> = {};
  if (typeof notifyEmailJobDone  === 'boolean') data.notifyEmailJobDone  = notifyEmailJobDone;
  if (typeof notifyEmailComment  === 'boolean') data.notifyEmailComment  = notifyEmailComment;
  if (typeof notifyEmailDigest   === 'boolean') data.notifyEmailDigest   = notifyEmailDigest;
  if (typeof notifyInAppQuota    === 'boolean') data.notifyInAppQuota    = notifyInAppQuota;
  if (typeof notifyInAppLevelUp  === 'boolean') data.notifyInAppLevelUp  = notifyInAppLevelUp;
  if (typeof notifyAdminChannel  === 'string')  data.notifyAdminChannel  = notifyAdminChannel;
  if (notifyWebhookUrl !== undefined)           data.notifyWebhookUrl    = notifyWebhookUrl || null;

  const pref = await prisma.userPreference.upsert({
    where:  { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  return NextResponse.json({ settings: pref });
}
