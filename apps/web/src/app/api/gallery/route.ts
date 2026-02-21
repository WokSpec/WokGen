import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/gallery
//
// Query params:
//   limit?    number   (default: 24, max: 100)
//   cursor?   string   (cuid — for keyset pagination)
//   tool?     string   filter by tool
//   rarity?   string   filter by rarity
//   search?   string   substring match on prompt / title
//   sort?     string   "newest" | "oldest"  (default: "newest")
//
// Returns an array of public GalleryAssets with pagination metadata.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const limit  = Math.min(Number(searchParams.get('limit')  ?? 24), 100);
  const cursor = searchParams.get('cursor')  ?? undefined;
  const tool   = searchParams.get('tool')    ?? undefined;
  const rarity = searchParams.get('rarity')  ?? undefined;
  const search = searchParams.get('search')  ?? undefined;
  const sort   = searchParams.get('sort')    ?? 'newest';

  // Build the where clause
  const where: Record<string, unknown> = {
    isPublic: true,
  };

  if (tool)   where.tool   = tool;
  if (rarity) where.rarity = rarity;

  // Prisma SQLite doesn't support full-text search natively;
  // use contains (case-insensitive via mode: 'insensitive' on postgres;
  // for SQLite we rely on the default LIKE behaviour which is case-insensitive
  // for ASCII characters — good enough for self-hosted usage).
  if (search && search.trim().length > 0) {
    where.OR = [
      { prompt: { contains: search.trim() } },
      { title:  { contains: search.trim() } },
    ];
    // Remove the top-level isPublic so it doesn't conflict with OR
    delete where.isPublic;
    where.AND = [
      { isPublic: true },
      {
        OR: [
          { prompt: { contains: search.trim() } },
          { title:  { contains: search.trim() } },
        ],
      },
    ];
    delete where.OR;
  }

  const orderBy =
    sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : { createdAt: 'desc' as const };

  const assets = await prisma.galleryAsset.findMany({
    where: where as Parameters<typeof prisma.galleryAsset.findMany>[0]['where'],
    orderBy,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id:        true,
      title:     true,
      imageUrl:  true,
      thumbUrl:  true,
      size:      true,
      tool:      true,
      provider:  true,
      prompt:    true,
      tags:      true,
      rarity:    true,
      isPublic:  true,
      createdAt: true,
    },
  });

  const hasMore    = assets.length > limit;
  const trimmed    = hasMore ? assets.slice(0, limit) : assets;
  const nextCursor = hasMore ? trimmed[trimmed.length - 1].id : null;

  // Parse JSON tags field
  const serialized = trimmed.map((a) => ({
    ...a,
    tags:      safeParseJson<string[]>(a.tags, []),
    createdAt: a.createdAt.toISOString(),
  }));

  return NextResponse.json({
    assets:     serialized,
    nextCursor,
    hasMore,
    total:      trimmed.length,
  });
}

// ---------------------------------------------------------------------------
// POST /api/gallery
//
// Promote a succeeded Job to the public gallery (or update an existing asset).
//
// Request body:
// {
//   jobId:    string   (required)
//   title?:   string
//   rarity?:  string
//   isPublic? boolean  (default: true)
//   tags?:    string[]
// }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { jobId, title, rarity, isPublic = true, tags } = body;

  if (typeof jobId !== 'string' || !jobId.trim()) {
    return NextResponse.json(
      { error: 'jobId is required and must be a non-empty string' },
      { status: 400 },
    );
  }

  // Verify the job exists and has succeeded
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id:        true,
      status:    true,
      tool:      true,
      provider:  true,
      prompt:    true,
      width:     true,
      resultUrl: true,
      asset:     true,
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: `Job "${jobId}" not found` },
      { status: 404 },
    );
  }

  if (job.status !== 'succeeded') {
    return NextResponse.json(
      { error: `Job "${jobId}" has status "${job.status}"; only succeeded jobs can be promoted to the gallery` },
      { status: 422 },
    );
  }

  if (!job.resultUrl) {
    return NextResponse.json(
      { error: `Job "${jobId}" has no result URL` },
      { status: 422 },
    );
  }

  const tagsJson =
    Array.isArray(tags) && tags.length > 0
      ? JSON.stringify(tags.map(String).slice(0, 20))
      : null;

  // Upsert: if an asset already exists for this job, update it; otherwise create
  const asset = await prisma.galleryAsset.upsert({
    where: { jobId: job.id },
    create: {
      jobId:    job.id,
      title:    typeof title === 'string' ? title.trim() || null : null,
      imageUrl: job.resultUrl,
      thumbUrl: job.resultUrl,
      size:     job.width,
      tool:     job.tool,
      provider: job.provider,
      prompt:   job.prompt,
      rarity:   typeof rarity === 'string' ? rarity : null,
      isPublic: Boolean(isPublic),
      tags:     tagsJson,
    },
    update: {
      title:    typeof title === 'string' ? title.trim() || null : null,
      rarity:   typeof rarity === 'string' ? rarity : null,
      isPublic: Boolean(isPublic),
      ...(tagsJson ? { tags: tagsJson } : {}),
    },
  });

  // Keep job.isPublic in sync
  await prisma.job.update({
    where: { id: job.id },
    data:  { isPublic: Boolean(isPublic) },
  }).catch(console.error);

  return NextResponse.json({
    ok:    true,
    asset: {
      ...asset,
      tags:      safeParseJson<string[]>(asset.tags, []),
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/gallery?id=<assetId>
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id query param is required' },
      { status: 400 },
    );
  }

  const existing = await prisma.galleryAsset.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  await prisma.galleryAsset.delete({ where: { id } });

  return NextResponse.json({ ok: true, deleted: id });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
