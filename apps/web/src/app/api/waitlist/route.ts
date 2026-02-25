import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { log as logger } from '@/lib/logger';

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

  try {
    // Use raw SQL so this works before/after prisma generate.
    // The WaitlistEntry table is defined in schema.prisma and created on `prisma db push`.
    await prisma.$executeRaw`
      INSERT INTO "WaitlistEntry" (id, email, mode, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${email}, ${mode ?? null}, now(), now())
      ON CONFLICT (email) DO UPDATE SET mode = EXCLUDED.mode, "updatedAt" = now()
    `;
  } catch (err) {
    logger.error({ email, mode, err }, '[waitlist] db error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
