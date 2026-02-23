import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateRawKey } from '@/lib/api-key-auth';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET  /api/keys  — list user's API keys (no raw key returned after creation)
// POST /api/keys  — create a new key (raw key returned ONCE)
// ---------------------------------------------------------------------------

export const dynamic = 'force-dynamic';

const MAX_KEYS = 10;

const CreateKeySchema = z.object({
  name:      z.string().min(1).max(60),
  scopes:    z.array(z.string()).optional().default(['generate', 'read']),
  expiresIn: z.enum(['never', '30d', '90d', '1y']).optional().default('never'),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const userId = session?.user?.id ?? 'self-hosted';

  const keys = await prisma.apiKey.findMany({
    where:   { userId, isActive: true },
    select:  {
      id:           true,
      name:         true,
      keyPrefix:    true,
      scopes:       true,
      lastUsedAt:   true,
      expiresAt:    true,
      requestCount: true,
      createdAt:    true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id && !process.env.SELF_HOSTED) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const userId = session?.user?.id ?? 'self-hosted';

  const rawBody = await req.json().catch(() => null);
  if (!rawBody) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });

  const parsed = CreateKeySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
  }

  const { name, scopes, expiresIn } = parsed.data;

  // Enforce limit
  const count = await prisma.apiKey.count({ where: { userId, isActive: true } });
  if (count >= MAX_KEYS) {
    return NextResponse.json({ error: `Max ${MAX_KEYS} active API keys per account.` }, { status: 400 });
  }

  // Compute expiry
  let expiresAt: Date | null = null;
  if (expiresIn !== 'never') {
    const days = expiresIn === '30d' ? 30 : expiresIn === '90d' ? 90 : 365;
    expiresAt = new Date(Date.now() + days * 86_400_000);
  }

  const { raw, hash, prefix } = generateRawKey();

  const key = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash:   hash,
      keyPrefix: prefix,
      scopes:    scopes.join(','),
      expiresAt,
    },
  });

  // Return the raw key exactly once — it is NOT stored in the DB
  return NextResponse.json({
    key: {
      id:        key.id,
      name:      key.name,
      keyPrefix: key.keyPrefix,
      scopes:    key.scopes,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    },
    rawKey: raw,  // shown ONCE — cannot be recovered
  }, { status: 201 });
}
