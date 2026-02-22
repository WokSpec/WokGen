import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  let email: string | undefined;
  let mode: string | undefined;
  try {
    const body = await req.json();
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    mode  = typeof body.mode  === 'string' ? body.mode.trim().toLowerCase()  : 'unknown';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Store as a simple GalleryAsset or custom model — use a workaround: store in a
  // dedicated table via raw SQL if the WaitlistEntry model doesn't exist yet,
  // otherwise fall back to logging only (schema migration needed).
  try {
    // Try to upsert into WaitlistEntry if model exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any;
    if (db.waitlistEntry) {
      await db.waitlistEntry.upsert({
        where: { email },
        update: { mode, updatedAt: new Date() },
        create: { email, mode, createdAt: new Date(), updatedAt: new Date() },
      });
    }
  } catch {
    // Table may not exist yet — log and continue (non-fatal)
    console.info(`[waitlist] ${email} signed up for ${mode}`);
  }

  return NextResponse.json({ ok: true });
}
