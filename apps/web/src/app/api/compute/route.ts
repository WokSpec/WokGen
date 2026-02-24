import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/compute — returns BYOC endpoint settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pref = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: { stats: true },
  });

  let byoc = { comfyUrl: '', ollamaUrl: '' };
  if (pref?.stats) {
    try {
      const stats = JSON.parse(pref.stats) as Record<string, unknown>;
      const b = stats.byoc as Record<string, string> | undefined;
      if (b) byoc = { comfyUrl: b.comfyUrl ?? '', ollamaUrl: b.ollamaUrl ?? '' };
    } catch { /* ignore parse errors */ }
  }

  return NextResponse.json(byoc);
}

// POST /api/compute — saves BYOC endpoint settings into stats JSON
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { comfyUrl?: string; ollamaUrl?: string };
  const { comfyUrl = '', ollamaUrl = '' } = body;

  // Validate URLs if non-empty
  for (const url of [comfyUrl, ollamaUrl]) {
    if (url) {
      try { new URL(url); } catch {
        return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
      }
    }
  }

  const userId = session.user.id;
  const existing = await prisma.userPreference.findUnique({
    where: { userId },
    select: { stats: true },
  });

  let stats: Record<string, unknown> = {};
  if (existing?.stats) {
    try { stats = JSON.parse(existing.stats) as Record<string, unknown>; } catch { /* ignore */ }
  }

  const updated = { ...stats, byoc: { comfyUrl, ollamaUrl } };

  await prisma.userPreference.upsert({
    where:  { userId },
    create: { userId, stats: JSON.stringify(updated) },
    update: { stats: JSON.stringify(updated) },
  });

  return NextResponse.json({ ok: true });
}
