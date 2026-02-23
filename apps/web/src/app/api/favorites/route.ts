import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FavoritePrompt {
  id: string;
  mode: string;
  prompt: string;
  label?: string;
  createdAt: string;
}

async function getFavorites(userId: string): Promise<FavoritePrompt[]> {
  const prefs = await prisma.userPreference.findUnique({ where: { userId } });
  if (!prefs?.favoritePrompts) return [];
  try {
    return JSON.parse(prefs.favoritePrompts) as FavoritePrompt[];
  } catch {
    return [];
  }
}

async function saveFavorites(userId: string, favorites: FavoritePrompt[]): Promise<void> {
  await prisma.userPreference.upsert({
    where: { userId },
    create: { userId, favoritePrompts: JSON.stringify(favorites) },
    update: { favoritePrompts: JSON.stringify(favorites) },
  });
}

// GET /api/favorites?mode=pixel — returns favorite prompts for a mode
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode = req.nextUrl.searchParams.get('mode');
  const favorites = await getFavorites(session.user.id);

  const filtered = mode ? favorites.filter(f => f.mode === mode) : favorites;
  return NextResponse.json({ favorites: filtered });
}

// POST /api/favorites — adds a prompt { mode, prompt, label? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { mode: string; prompt: string; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.mode || !body.prompt?.trim()) {
    return NextResponse.json({ error: 'mode and prompt are required' }, { status: 400 });
  }

  const favorites = await getFavorites(session.user.id);

  const newFav: FavoritePrompt = {
    id: randomUUID(),
    mode: body.mode,
    prompt: body.prompt.trim(),
    label: body.label,
    createdAt: new Date().toISOString(),
  };

  // Keep up to 50 favorites per user
  const updated = [newFav, ...favorites].slice(0, 50);
  await saveFavorites(session.user.id, updated);

  return NextResponse.json({ ok: true, favorite: newFav });
}

// DELETE /api/favorites?id=... — removes a favorite
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const favorites = await getFavorites(session.user.id);
  const updated = favorites.filter(f => f.id !== id);
  await saveFavorites(session.user.id, updated);

  return NextResponse.json({ ok: true });
}
