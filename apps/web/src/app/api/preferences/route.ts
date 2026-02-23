import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODE_TO_FIELD: Record<string, string> = {
  pixel:    'pixelPrefs',
  business: 'businessPrefs',
  vector:   'vectorPrefs',
  uiux:     'uiuxPrefs',
  voice:    'voicePrefs',
  text:     'textPrefs',
};

// GET /api/preferences — returns user's preferences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prefs = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    return NextResponse.json({
      eralDefaultModel: 'eral-7c',
      eralPersonality: 'balanced',
      pixelPrefs: null,
      businessPrefs: null,
      vectorPrefs: null,
      uiuxPrefs: null,
      voicePrefs: null,
      textPrefs: null,
      favoritePrompts: [],
      stats: null,
    });
  }

  return NextResponse.json({
    eralDefaultModel: prefs.eralDefaultModel,
    eralPersonality: prefs.eralPersonality,
    pixelPrefs:    prefs.pixelPrefs    ? JSON.parse(prefs.pixelPrefs)    : null,
    businessPrefs: prefs.businessPrefs ? JSON.parse(prefs.businessPrefs) : null,
    vectorPrefs:   prefs.vectorPrefs   ? JSON.parse(prefs.vectorPrefs)   : null,
    uiuxPrefs:     prefs.uiuxPrefs     ? JSON.parse(prefs.uiuxPrefs)     : null,
    voicePrefs:    prefs.voicePrefs    ? JSON.parse(prefs.voicePrefs)    : null,
    textPrefs:     prefs.textPrefs     ? JSON.parse(prefs.textPrefs)     : null,
    favoritePrompts: prefs.favoritePrompts ? JSON.parse(prefs.favoritePrompts) : [],
    stats: prefs.stats ? JSON.parse(prefs.stats) : null,
  });
}

// PATCH /api/preferences — partial update
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    mode?: string;
    prefs?: Record<string, unknown>;
    eralModel?: string;
    eralPersonality?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};

  if (body.mode && MODE_TO_FIELD[body.mode] && body.prefs) {
    updateData[MODE_TO_FIELD[body.mode]] = JSON.stringify(body.prefs);
  }
  if (body.eralModel) {
    updateData['eralDefaultModel'] = body.eralModel;
  }
  if (body.eralPersonality) {
    updateData['eralPersonality'] = body.eralPersonality;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, ...updateData },
    update: updateData,
  });

  return NextResponse.json({ ok: true });
}
