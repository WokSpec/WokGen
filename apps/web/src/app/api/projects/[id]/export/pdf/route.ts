import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// ---------------------------------------------------------------------------
// GET /api/projects/[id]/export/pdf
//
// Generates a PDF brand sheet for a project.
// Includes: project name, brief, color palette, and up to 12 asset thumbnails.
// Uses pdfkit (server-side only, Node runtime).
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { brief: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const jobs = await prisma.job.findMany({
    where:   { projectId: params.id, status: 'succeeded', resultUrl: { not: null } },
    orderBy: { createdAt: 'desc' },
    take:    12,
    select:  { id: true, tool: true, prompt: true, resultUrl: true, createdAt: true },
  });

  // Build PDF
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFDocument = require('pdfkit') as typeof import('pdfkit');

  const doc = new PDFDocument({ size: 'A4', margin: 40, info: {
    Title: `${project.name} — WokGen Brand Sheet`,
    Author: 'WokGen',
  }, bufferPages: true });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  // ── Cover ──────────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 120).fill('#0d0d14');
  doc.fillColor('#ffffff').fontSize(28).font('Helvetica-Bold')
    .text(project.name, 40, 38);
  doc.fontSize(11).fillColor('#a0a0b0').font('Helvetica')
    .text('WokGen Brand Sheet', 40, 74);

  doc.moveDown(4);

  // ── Brief / description ────────────────────────────────────────────────────
  if (project.description) {
    doc.rect(40, doc.y, doc.page.width - 80, 1).fill('#1a1a2e');
    doc.moveDown(0.5);
    doc.fillColor('#333366').fontSize(9).font('Helvetica-Bold').text('PROJECT BRIEF');
    doc.moveDown(0.3);
    doc.fillColor('#222222').fontSize(11).font('Helvetica')
      .text(project.description, { width: doc.page.width - 80 });
    doc.moveDown(1);
  }

  // ── Brand Kit colors (if brief has palette) ────────────────────────────────
  const brandBrief = project.brief as { palette?: string[] } | null;
  if (brandBrief?.palette && Array.isArray(brandBrief.palette)) {
    doc.fillColor('#333366').fontSize(9).font('Helvetica-Bold').text('PALETTE');
    doc.moveDown(0.4);
    let cx = 40;
    const paletteY = doc.y;
    for (const hex of brandBrief.palette.slice(0, 8)) {
      if (typeof hex === 'string' && /^#[0-9a-fA-F]{6}$/.test(hex)) {
        doc.roundedRect(cx, paletteY, 36, 36, 4).fill(hex);
        cx += 44;
      }
    }
    doc.moveDown(3.5);
  }

  // ── Assets grid ───────────────────────────────────────────────────────────
  if (jobs.length > 0) {
    doc.addPage();
    doc.rect(0, 0, doc.page.width, 50).fill('#0d0d14');
    doc.fillColor('#ffffff').fontSize(14).font('Helvetica-Bold')
      .text('Generated Assets', 40, 17);

    const COLS   = 3;
    const CELL_W = 160;
    const CELL_H = 160;
    const GAP    = 12;
    const START_Y = 70;

    const imageBuffers = await Promise.allSettled(
      jobs.map(async (job) => {
        try {
          const res = await fetch(job.resultUrl!, { signal: AbortSignal.timeout(10_000) });
          if (!res.ok) return null;
          const buf = Buffer.from(await res.arrayBuffer());
          return { buf, job };
        } catch {
          return null;
        }
      })
    );

    let col = 0;
    let row = 0;

    for (const settled of imageBuffers) {
      if (settled.status !== 'fulfilled' || !settled.value) {
        col++;
        if (col >= COLS) { col = 0; row++; }
        continue;
      }
      const { buf, job } = settled.value;
      const x = 40 + col * (CELL_W + GAP);
      const y = START_Y + row * (CELL_H + GAP + 24);

      if (y + CELL_H + 30 > doc.page.height - 40) {
        doc.addPage();
        row = 0;
        col = 0;
      }

      const finalY = START_Y + row * (CELL_H + GAP + 24);

      try {
        doc.image(buf, x, finalY, { width: CELL_W, height: CELL_H, fit: [CELL_W, CELL_H] });
      } catch {
        doc.rect(x, finalY, CELL_W, CELL_H).fill('#1a1a2e');
      }

      doc.fillColor('#888888').fontSize(7).font('Helvetica')
        .text(job.tool ?? '', x, finalY + CELL_H + 3, { width: CELL_W });

      col++;
      if (col >= COLS) { col = 0; row++; }
    }
  }

  // ── Footer on all pages ────────────────────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#999').fontSize(8).font('Helvetica')
      .text(
        `Generated by WokGen — ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        40, doc.page.height - 28,
        { align: 'center', width: doc.page.width - 80 },
      );
  }

  doc.end();

  await new Promise<void>((resolve) => doc.on('end', resolve));
  const pdf = Buffer.concat(chunks);

  const safeName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return new NextResponse(pdf, {
    headers: {
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}_brand_sheet.pdf"`,
      'Content-Length':      String(pdf.byteLength),
      'Cache-Control':       'private, no-cache',
    },
  });
}
