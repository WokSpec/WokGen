import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import sharp from 'sharp';

export const dynamic  = 'force-dynamic';
export const runtime  = 'nodejs';
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// POST /api/atlas
//
// Build a sprite atlas (spritesheet) from a set of job result images.
//
// Body:
// {
//   jobIds:       string[]  (2–64 jobs, must belong to requesting user)
//   columns?:     number    (default: auto-square)
//   cellSize?:    number    (default: 64px — each sprite is resized to this)
//   padding?:     number    (default: 2px between cells)
//   format?:      "png" | "webp" (default: "png")
//   jsonMeta?:    boolean   (include JSON metadata in response, default: true)
// }
//
// Returns a PNG/WebP spritesheet + JSON atlas metadata.
// ---------------------------------------------------------------------------

interface AtlasFrame {
  name:    string;
  jobId:   string;
  prompt:  string;
  tool:    string;
  x:       number;
  y:       number;
  w:       number;
  h:       number;
}

interface AtlasMeta {
  version:   1;
  totalFrames: number;
  cellSize:  number;
  columns:   number;
  rows:      number;
  atlasW:    number;
  atlasH:    number;
  padding:   number;
  frames:    AtlasFrame[];
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId  = session?.user?.id;

  if (!userId && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    jobIds:    string[];
    columns?:  number;
    cellSize?: number;
    padding?:  number;
    format?:   'png' | 'webp';
    jsonMeta?: boolean;
  };

  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { jobIds, columns, cellSize = 64, padding = 2, format = 'png', jsonMeta = true } = body;

  if (!Array.isArray(jobIds) || jobIds.length < 2) {
    return NextResponse.json({ error: 'At least 2 jobIds are required' }, { status: 400 });
  }
  if (jobIds.length > 64) {
    return NextResponse.json({ error: 'Maximum 64 sprites per atlas' }, { status: 400 });
  }

  const cell    = Math.max(16, Math.min(512, cellSize));
  const pad     = Math.max(0, Math.min(32, padding));
  const stride  = cell + pad;

  // Fetch jobs — verify ownership
  const jobs = await prisma.job.findMany({
    where: {
      id:        { in: jobIds },
      status:    'completed',
      ...(userId ? { userId } : {}),
    },
    select: { id: true, resultUrl: true, prompt: true, tool: true },
  });

  if (jobs.length < 2) {
    return NextResponse.json({ error: 'Not enough valid completed jobs found' }, { status: 404 });
  }

  // Determine grid dimensions
  const count   = jobs.length;
  const cols    = columns ? Math.max(1, Math.min(count, columns)) : Math.ceil(Math.sqrt(count));
  const rows    = Math.ceil(count / cols);
  const atlasW  = cols * stride + pad;
  const atlasH  = rows * stride + pad;

  // Download all images in parallel (with timeout)
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 20_000);

  const imageBuffers = await Promise.allSettled(
    jobs.map(async (j) => {
      if (!j.resultUrl) return null;
      const res = await fetch(j.resultUrl, { signal: controller.signal });
      if (!res.ok) return null;
      const raw = Buffer.from(await res.arrayBuffer());
      return sharp(raw)
        .resize(cell, cell, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    }),
  ).finally(() => clearTimeout(timeout));

  // Build composite operations
  const composites: sharp.OverlayOptions[] = [];
  const frames:     AtlasFrame[]           = [];

  for (let i = 0; i < jobs.length; i++) {
    const result = imageBuffers[i];
    if (result.status !== 'fulfilled' || !result.value) continue;

    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = pad + col * stride;
    const y   = pad + row * stride;

    composites.push({ input: result.value, left: x, top: y });
    frames.push({
      name:   `sprite_${i.toString().padStart(3, '0')}`,
      jobId:  jobs[i].id,
      prompt: jobs[i].prompt.slice(0, 80),
      tool:   jobs[i].tool,
      x, y, w: cell, h: cell,
    });
  }

  if (composites.length === 0) {
    return NextResponse.json({ error: 'No images could be downloaded' }, { status: 502 });
  }

  // Create transparent base canvas
  const atlasBuffer = await sharp({
    create: {
      width:      atlasW,
      height:     atlasH,
      channels:   4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    [format === 'webp' ? 'webp' : 'png']()
    .toBuffer();

  const meta: AtlasMeta = {
    version:     1,
    totalFrames: frames.length,
    cellSize:    cell,
    columns:     cols,
    rows,
    atlasW,
    atlasH,
    padding:     pad,
    frames,
  };

  // Return multipart if jsonMeta requested, otherwise just the image
  if (jsonMeta) {
    // Return JSON with base64-encoded atlas image + meta
    return NextResponse.json({
      ok:       true,
      meta,
      imageB64: atlasBuffer.toString('base64'),
      mimeType: format === 'webp' ? 'image/webp' : 'image/png',
    });
  }

  return new NextResponse(atlasBuffer, {
    status:  200,
    headers: {
      'Content-Type':        format === 'webp' ? 'image/webp' : 'image/png',
      'Content-Disposition': `attachment; filename="atlas_${Date.now()}.${format}"`,
      'Content-Length':      String(atlasBuffer.length),
    },
  });
}
