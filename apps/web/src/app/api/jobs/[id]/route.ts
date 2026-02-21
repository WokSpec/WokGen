import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// ---------------------------------------------------------------------------
// GET /api/jobs/[id]
//
// Returns the current state of a job. Used by the studio UI to poll for
// completion after POST /api/generate returns a running job ID.
//
// Response:
// {
//   id, tool, status, provider, prompt, width, height, seed,
//   resultUrl, resultUrls, error, isPublic, createdAt, updatedAt
// }
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id },
    select: {
      id:            true,
      tool:          true,
      status:        true,
      provider:      true,
      prompt:        true,
      negPrompt:     true,
      width:         true,
      height:        true,
      seed:          true,
      resultUrl:     true,
      resultUrls:    true,
      error:         true,
      isPublic:      true,
      providerJobId: true,
      createdAt:     true,
      updatedAt:     true,
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: `Job not found: ${id}` },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ...job,
    resultUrls: job.resultUrls ? JSON.parse(job.resultUrls) : null,
    createdAt:  job.createdAt.toISOString(),
    updatedAt:  job.updatedAt.toISOString(),
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/jobs/[id]
//
// Update mutable job fields: title, isPublic, tags.
// Used by the studio UI for "Save to Gallery" and visibility toggling.
//
// Request body:
// {
//   title?:    string
//   isPublic?: boolean
//   tags?:     string[]
// }
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const existing = await prisma.job.findUnique({
    where: { id },
    select: { id: true, status: true, resultUrl: true },
  });

  if (!existing) {
    return NextResponse.json({ error: `Job not found: ${id}` }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof body.title === 'string') {
    updateData.title = body.title.trim().slice(0, 200) || null;
  }

  if (typeof body.isPublic === 'boolean') {
    updateData.isPublic = body.isPublic;
  }

  if (Array.isArray(body.tags)) {
    const tags = (body.tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 32);
    updateData.tags = JSON.stringify(tags);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update. Allowed: title, isPublic, tags' },
      { status: 400 },
    );
  }

  const updated = await prisma.job.update({
    where: { id },
    data: updateData,
    select: {
      id:        true,
      tool:      true,
      status:    true,
      provider:  true,
      prompt:    true,
      width:     true,
      height:    true,
      seed:      true,
      resultUrl: true,
      isPublic:  true,
      title:     true,
      tags:      true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Sync isPublic change to the linked GalleryAsset if one exists
  if (typeof body.isPublic === 'boolean') {
    await prisma.galleryAsset
      .updateMany({
        where: { jobId: id },
        data:  { isPublic: Boolean(body.isPublic) },
      })
      .catch(console.error);
  }

  return NextResponse.json({
    ok: true,
    job: {
      ...updated,
      tags:      updated.tags ? JSON.parse(updated.tags) : [],
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

// ---------------------------------------------------------------------------
// DELETE /api/jobs/[id]
//
// Hard-deletes a job and its associated GalleryAsset (cascade handled by
// Prisma schema). The generated image URLs (hosted on provider CDNs) are
// NOT deleted — that would require provider-specific API calls and is out
// of scope for the self-hosted use case.
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  const existing = await prisma.job.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: `Job not found: ${id}` }, { status: 404 });
  }

  await prisma.job.delete({ where: { id } });

  return NextResponse.json({ ok: true, deleted: id });
}
