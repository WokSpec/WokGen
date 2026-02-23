import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { cache } from '@/lib/cache';

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
//   mode?     string   filter by product line: pixel | business | vector | emoji | uiux
//   mine?     string   "true" — return only the authenticated user's assets
//
// Returns an array of public GalleryAssets with pagination metadata.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const limit  = Math.min(Number(searchParams.get('limit')  ?? '24'), 50);
  const cursor = searchParams.get('cursor')  ?? undefined;
  const tool   = searchParams.get('tool')    ?? undefined;
  const rarity = searchParams.get('rarity')  ?? undefined;
  const search = searchParams.get('search')  ?? undefined;
  const sort   = searchParams.get('sort')    ?? 'newest';
  const mode   = searchParams.get('mode')    ?? undefined;
  const mine   = searchParams.get('mine')    === 'true';
  const styleFilter = searchParams.get('style') ?? null;

  // For "mine" filter, require auth
  let authedUserId: string | null = null;
  if (mine) {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    authedUserId = session?.user?.id ?? null;
    if (!authedUserId) {
      return NextResponse.json({ error: 'Authentication required for personal gallery.' }, { status: 401 });
    }
  }

  // Cache public gallery pages in Redis (skip for 'mine' or search queries)
  const cacheKey = (!mine && !search && !authedUserId)
    ? `gallery:${mode ?? 'all'}:${tool ?? 'all'}:${sort}:${cursor ?? 'first'}:${limit}`
    : null;

  if (cacheKey) {
    const hit = await cache.get<object>(cacheKey);
    if (hit) return NextResponse.json(hit, { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60', 'X-Cache': 'HIT' } });
  }

  // Build the where clause
  const where: Record<string, unknown> = mine && authedUserId
    ? { job: { userId: authedUserId } }
    : { isPublic: true };

  if (tool)        where.tool   = tool;
  if (rarity)      where.rarity = rarity;
  if (mode)        where.mode   = mode;
  // tags is stored as a JSON string — use substring match for style filter
  if (styleFilter) where.tags   = { contains: styleFilter };

  // Prisma SQLite doesn't support full-text search natively;
  // use contains (case-insensitive via mode: 'insensitive' on postgres;
  // for SQLite we rely on the default LIKE behaviour which is case-insensitive
  // for ASCII characters — good enough for self-hosted usage).
  if (search && search.trim().length > 0) {
    const searchClause = [
      { prompt: { contains: search.trim() } },
      { title:  { contains: search.trim() } },
    ];
    // For mine queries keep the userId filter; for public queries keep isPublic filter
    where.AND = [
      mine && authedUserId ? { job: { userId: authedUserId } } : { isPublic: true },
      { OR: searchClause },
    ];
    // Remove top-level keys that conflict with AND
    delete where.isPublic;
    if (mine) delete where.job;
  }

  const orderBy =
    sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : { createdAt: 'desc' as const };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assets = await prisma.galleryAsset.findMany({
    where: where as any,
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
      mode:      true,
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

  const responseBody = {
    assets:     serialized,
    nextCursor,
    hasMore,
    total:      trimmed.length,
  };

  if (cacheKey) await cache.set(cacheKey, responseBody, 30);

  // Generate a simple ETag from the first asset ID + count for conditional GET support
  const etag = `"${trimmed.length}-${trimmed[0]?.id ?? '0'}-${trimmed[trimmed.length - 1]?.id ?? '0'}"`;
  const ifNoneMatch = req.headers.get('if-none-match');
  if (!mine && ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304, headers: { 'ETag': etag, 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } });
  }

  return NextResponse.json(responseBody, {
    headers: mine
      ? {}
      : { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60', 'X-Cache': 'MISS', 'ETag': etag },
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
  // Require authentication
  const session = await auth();
  const authedUserId = session?.user?.id;
  if (!authedUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

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

  // Verify the job exists, has succeeded, and belongs to this user
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id:        true,
      userId:    true,
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

  // Only the job owner can promote it to the gallery
  if (job.userId !== authedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  // Require authentication
  const session = await auth();
  const authedUserId = session?.user?.id;
  if (!authedUserId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'id query param is required' },
      { status: 400 },
    );
  }

  const existing = await prisma.galleryAsset.findUnique({
    where: { id },
    select: { id: true, job: { select: { userId: true } } },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  // Only the asset owner can delete it
  if (existing.job?.userId !== authedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
