import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma, dbQuery } from '@/lib/db';
import { API_ERRORS } from '@/lib/api-response';
import { log } from '@/lib/logger';
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
  try {
    const session = await auth();
    if (!session?.user?.id && !process.env.SELF_HOSTED) return API_ERRORS.UNAUTHORIZED();
    const userId = session?.user?.id ?? 'self-hosted';

    const keys = await dbQuery(prisma.apiKey.findMany({
      where:   { userId, isActive: true },
      take:    50,
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
    }));

    return NextResponse.json({ keys });
  } catch (err) {
    log.error({ err }, 'GET /api/keys failed');
    return API_ERRORS.INTERNAL();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id && !process.env.SELF_HOSTED) return API_ERRORS.UNAUTHORIZED();
    const userId = session?.user?.id ?? 'self-hosted';

    let rawBody: unknown;
    try { rawBody = await req.json(); } catch { return API_ERRORS.BAD_REQUEST('Invalid JSON body'); }

    const parsed = CreateKeySchema.safeParse(rawBody);
    if (!parsed.success) return API_ERRORS.VALIDATION(parsed.error.issues[0]?.message ?? 'Invalid request');

    const { name, scopes, expiresIn } = parsed.data;

    const count = await dbQuery(prisma.apiKey.count({ where: { userId, isActive: true } }));
    if (count >= MAX_KEYS) return API_ERRORS.BAD_REQUEST(`Max ${MAX_KEYS} active API keys per account`);

    let expiresAt: Date | null = null;
    if (expiresIn !== 'never') {
      const days = expiresIn === '30d' ? 30 : expiresIn === '90d' ? 90 : 365;
      expiresAt = new Date(Date.now() + days * 86_400_000);
    }

    const { raw, hash, prefix } = generateRawKey();

    const key = await dbQuery(prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash:   hash,
        keyPrefix: prefix,
        scopes:    scopes.join(','),
        expiresAt,
      },
    }));

    return NextResponse.json({
      key: {
        id:        key.id,
        name:      key.name,
        keyPrefix: key.keyPrefix,
        scopes:    key.scopes,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
      },
      rawKey: raw, // shown ONCE — not stored in DB
    }, { status: 201 });
  } catch (err) {
    log.error({ err }, 'POST /api/keys failed');
    return API_ERRORS.INTERNAL();
  }
}
