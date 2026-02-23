import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// POST /api/jobs/[id]/palette
//
// Extract dominant colors from a job's resultUrl using Sharp.
// Stores the palette as JSON on the Job.paletteJson field.
// Returns: { palette: [{ hex, name, ratio }] }
//
// Algorithm:
//   1. Download the image
//   2. Resize to 64x64 for speed
//   3. Quantise to 8 dominant colors using sharp's stats + pixel sampling
//   4. Name colors by hue bucket (Red, Orange, Yellow, etc.)
//   5. Store and return
// ---------------------------------------------------------------------------

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PaletteColor {
  hex: string;
  name: string;
  ratio: number;
}

// Hue → color name mapping
function hueToName(h: number, s: number, l: number): string {
  if (s < 8)  return l > 80 ? 'White' : l < 25 ? 'Black' : 'Gray';
  if (h < 15)  return 'Red';
  if (h < 40)  return 'Orange';
  if (h < 65)  return 'Yellow';
  if (h < 155) return 'Green';
  if (h < 185) return 'Cyan';
  if (h < 260) return 'Blue';
  if (h < 290) return 'Purple';
  if (h < 330) return 'Pink';
  return 'Red';
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

async function extractPalette(url: string, numColors = 8): Promise<PaletteColor[]> {
  // Fetch image
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  let arrayBuffer: ArrayBuffer;
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
    arrayBuffer = await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }

  // Resize to small thumbnail and get raw pixels
  const { data, info } = await sharp(Buffer.from(arrayBuffer))
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 3) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  // Quantise via median cut (simple bucket approach)
  // Group pixels into HSL buckets then pick most frequent centroids
  const buckets: Map<string, [number, number, number][]> = new Map();
  for (const [r, g, b] of pixels) {
    const [h, s, l] = rgbToHsl(r, g, b);
    // Quantize hue to 30-degree buckets, lightness to 4 levels
    const hBucket = Math.floor(h / 30) * 30;
    const lBucket = Math.floor(l / 25) * 25;
    const key = `${hBucket}:${lBucket}:${s > 15 ? 1 : 0}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push([r, g, b]);
  }

  // Sort buckets by size, pick top N
  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, numColors);

  const total = pixels.length;
  const palette: PaletteColor[] = sorted.map(([, bucket]) => {
    // Average color in bucket
    const avgR = Math.round(bucket.reduce((s, p) => s + p[0], 0) / bucket.length);
    const avgG = Math.round(bucket.reduce((s, p) => s + p[1], 0) / bucket.length);
    const avgB = Math.round(bucket.reduce((s, p) => s + p[2], 0) / bucket.length);
    const [h, s, l] = rgbToHsl(avgR, avgG, avgB);
    return {
      hex:   rgbToHex(avgR, avgG, avgB),
      name:  hueToName(h, s, l),
      ratio: Math.round((bucket.length / total) * 100) / 100,
    };
  });

  // Deduplicate very similar colors (ΔE approximation via hex distance)
  return palette.filter((c, i) => {
    for (let j = 0; j < i; j++) {
      const a = parseInt(palette[j].hex.slice(1), 16);
      const b = parseInt(c.hex.slice(1), 16);
      const dr = ((a >> 16) & 0xff) - ((b >> 16) & 0xff);
      const dg = ((a >> 8) & 0xff) - ((b >> 8) & 0xff);
      const db = (a & 0xff) - (b & 0xff);
      if (Math.sqrt(dr * dr + dg * dg + db * db) < 30) return false;
    }
    return true;
  }).slice(0, 6);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = !process.env.SELF_HOSTED ? await auth() : null;
  if (!process.env.SELF_HOSTED && !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, resultUrl: true, status: true },
  });

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!process.env.SELF_HOSTED && job.userId !== session!.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!job.resultUrl) {
    return NextResponse.json({ error: 'Job has no result image yet' }, { status: 400 });
  }

  try {
    const palette = await extractPalette(job.resultUrl);
    const paletteJson = JSON.stringify(palette);
    await prisma.job.update({
      where: { id: params.id },
      data: { paletteJson },
    });
    return NextResponse.json({ palette, paletteJson });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Palette extraction failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = !process.env.SELF_HOSTED ? await auth() : null;
  if (!process.env.SELF_HOSTED && !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, paletteJson: true },
  });

  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!process.env.SELF_HOSTED && job.userId !== session!.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const palette = job.paletteJson ? JSON.parse(job.paletteJson) : null;
  return NextResponse.json({ palette });
}
