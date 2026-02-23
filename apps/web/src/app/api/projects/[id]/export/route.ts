import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import JSZip from 'jszip';

// ---------------------------------------------------------------------------
// GET /api/projects/[id]/export
//
// Streams a ZIP of all succeeded jobs in a project.
// Files named: {mode}_{tool}_{date}_{jobId_short}.png
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const project = await prisma.project.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!project) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const jobs = await prisma.job.findMany({
    where: { projectId: params.id, status: 'succeeded', resultUrl: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, mode: true, tool: true, resultUrl: true, createdAt: true, prompt: true },
  });

  if (jobs.length === 0) {
    return NextResponse.json({ error: 'No succeeded assets in this project yet.' }, { status: 404 });
  }

  const zip = new JSZip();

  // Add a manifest
  const manifest = jobs.map((j, i) => ({
    file: buildFileName(j, i),
    prompt: j.prompt,
    mode: j.mode,
    tool: j.tool,
    createdAt: j.createdAt.toISOString(),
    jobId: j.id,
  }));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  // Fetch images and add to zip (concurrent, with error tolerance)
  await Promise.allSettled(
    jobs.map(async (job, i) => {
      if (!job.resultUrl) return;
      try {
        const res = await fetch(job.resultUrl, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        const buf = await res.arrayBuffer();
        zip.file(buildFileName(job, i), buf);
      } catch {
        // Skip unavailable images rather than failing the whole export
      }
    }),
  );

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  // Record activity event (non-blocking)
  prisma.activityEvent.create({
    data: {
      projectId: params.id,
      userId:  session.user.id ?? null,
      type:    'export',
      message: `Exported ${jobs.length} assets as ZIP`,
    },
  }).catch(() => {});

  return new NextResponse(zipBuf, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeName}_assets.zip"`,
      'Content-Length': String(zipBuf.length),
    },
  });
}

function buildFileName(
  job: { id: string; mode: string; tool: string; createdAt: Date },
  index: number,
): string {
  const date = job.createdAt.toISOString().slice(0, 10);
  const shortId = job.id.slice(-6);
  return `${String(index + 1).padStart(3, '0')}_${job.mode}_${job.tool}_${date}_${shortId}.png`;
}
