/**
 * POST /api/v1/assets/[id]/process
 * Apply a post-processing operation to an existing asset.
 * Supported ops: bg-remove | vectorize | resize | compress
 */
import { type NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey } from '@/lib/api-key-auth';
import { prisma, dbQuery } from '@/lib/db';
import { log } from '@/lib/logger';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const BodySchema = z.object({
  op:         z.enum(['bg-remove', 'vectorize', 'resize', 'compress']),
  targetSize: z.number().int().positive().optional(),
  quality:    z.number().int().min(1).max(100).optional(),
});

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const apiUser = await authenticateApiKey(req);
    if (!apiUser) return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401, headers: CORS_HEADERS });

    const asset = await dbQuery(prisma.galleryAsset.findFirst({
      where:  { id: params.id, job: { userId: apiUser.userId } },
      select: { id: true, imageUrl: true, prompt: true, mode: true },
    }));
    if (!asset) return NextResponse.json({ error: 'Asset not found', code: 'NOT_FOUND' }, { status: 404, headers: CORS_HEADERS });

    let body: z.infer<typeof BodySchema>;
    try {
      body = BodySchema.parse(await req.json());
    } catch {
      return NextResponse.json({ error: 'Invalid request body', code: 'VALIDATION_ERROR' }, { status: 400, headers: CORS_HEADERS });
    }

    // Forward to internal tool
    const internalBase = new URL(req.url).origin;
    let resultUrl: string | null = null;
    let processErr: string | null = null;

    if (body.op === 'bg-remove') {
      const res = await fetch(`${internalBase}/api/tools/bg-remove`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageUrl: asset.imageUrl }),
        signal:  AbortSignal.timeout(30_000),
      });
      const data = await res.json() as { resultUrl?: string; error?: string };
      resultUrl = data.resultUrl ?? null;
      if (!res.ok) processErr = data.error ?? 'Processing failed';
    } else if (body.op === 'vectorize') {
      const res = await fetch(`${internalBase}/api/tools/vectorize`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ imageUrl: asset.imageUrl }),
        signal:  AbortSignal.timeout(30_000),
      });
      const data = await res.json() as { resultUrl?: string; error?: string };
      resultUrl = data.resultUrl ?? null;
      if (!res.ok) processErr = data.error ?? 'Processing failed';
    } else {
      // resize / compress — client-side ops
      resultUrl = asset.imageUrl;
      processErr = `${body.op} is a client-side operation; apply locally using Canvas API or the /tools/${body.op} page`;
    }

    if (processErr && !resultUrl) {
      return NextResponse.json({ error: processErr, code: 'PROCESSING_ERROR' }, { status: 422, headers: CORS_HEADERS });
    }

    return NextResponse.json({
      assetId:   asset.id,
      op:        body.op,
      resultUrl: resultUrl ?? asset.imageUrl,
      note:      processErr ?? undefined,
    }, { headers: CORS_HEADERS });
  } catch (err) {
    log.error({ err, assetId: params.id }, 'POST /api/v1/assets/[id]/process failed');
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500, headers: CORS_HEADERS });
  }
}
