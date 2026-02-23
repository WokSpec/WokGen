import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import JSZip from 'jszip';

// ---------------------------------------------------------------------------
// GET /api/jobs/export?ids=id1,id2,id3
//
// Downloads a ZIP of selected job results. All jobs must belong to
// the authenticated user. Max 50 jobs per request.
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const idsParam = new URL(req.url).searchParams.get('ids');
  if (!idsParam) return NextResponse.json({ error: '"ids" query param required (comma-separated job IDs).' }, { status: 400 });

  const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean).slice(0, 50);
  if (ids.length === 0) return NextResponse.json({ error: 'No valid IDs provided.' }, { status: 400 });

  const jobs = await prisma.job.findMany({
    where: { id: { in: ids }, userId: session.user.id, status: 'succeeded', resultUrl: { not: null } },
    select: { id: true, mode: true, tool: true, resultUrl: true, createdAt: true, prompt: true },
    take: 50,
  });

  if (jobs.length === 0) {
    return NextResponse.json({ error: 'No succeeded jobs found for the given IDs.' }, { status: 404 });
  }

  const zip = new JSZip();

  const manifest = jobs.map((j, i) => ({
    file: buildFileName(j, i),
    prompt: j.prompt,
    mode: j.mode,
    tool: j.tool,
    createdAt: j.createdAt.toISOString(),
    jobId: j.id,
  }));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  await Promise.allSettled(
    jobs.map(async (job, i) => {
      if (!job.resultUrl) return;
      try {
        const res = await fetch(job.resultUrl, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) return;
        zip.file(buildFileName(job, i), await res.arrayBuffer());
      } catch { /* skip */ }
    }),
  );

  const zipBuf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const ts = new Date().toISOString().slice(0, 10);

  return new NextResponse(zipBuf, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="wokgen_export_${ts}.zip"`,
      'Content-Length': String(zipBuf.length),
    },
  });
}

function buildFileName(
  job: { id: string; mode: string; tool: string; createdAt: Date },
  index: number,
): string {
  const date    = job.createdAt.toISOString().slice(0, 10);
  const shortId = job.id.slice(-6);
  return `${String(index + 1).padStart(3, '0')}_${job.mode}_${job.tool}_${date}_${shortId}.png`;
}
