import { createHash } from 'crypto';
import { prisma } from '@/lib/db';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// WokGen Personal Access Token (PAT) authentication
//
// Token format: wk_live_{32-char-hex}
// Storage:      SHA-256 hash of raw token stored in ApiKey.keyHash
// Auth header:  Authorization: Bearer wk_live_...
// ---------------------------------------------------------------------------

export type ApiKeyUser = {
  userId:  string;
  keyId:   string;
  scopes:  string[];
};

function hashKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Extract and validate a PAT from the Authorization header.
 * Returns the associated userId and scopes, or null if invalid/missing.
 */
export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer wk_')) return null;

  const raw = authHeader.slice('Bearer '.length).trim();
  if (!raw.startsWith('wk_live_') || raw.length < 16) return null;

  const hash = hashKey(raw);

  const key = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: { id: true, userId: true, scopes: true, isActive: true, expiresAt: true },
  });

  if (!key || !key.isActive) return null;
  if (key.expiresAt && key.expiresAt < new Date()) return null;

  // Update usage stats (fire-and-forget)
  prisma.apiKey.update({
    where: { id: key.id },
    data: {
      lastUsedAt:   new Date(),
      requestCount: { increment: 1 },
    },
  }).catch(() => null);

  return {
    userId: key.userId,
    keyId:  key.id,
    scopes: key.scopes.split(',').map(s => s.trim()).filter(Boolean),
  };
}

/**
 * Check if a PAT scope list includes a required scope.
 */
export function hasScope(scopes: string[], required: string): boolean {
  return scopes.includes(required) || scopes.includes('*');
}

/**
 * Generate a new PAT. Returns the raw key (shown once) + metadata.
 */
export function generateRawKey(): { raw: string; hash: string; prefix: string } {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const entropy = randomBytes(24).toString('hex'); // 48 hex chars
  const raw     = `wk_live_${entropy}`;
  const hash    = hashKey(raw);
  const prefix  = raw.slice(0, 16); // "wk_live_" + first 8 hex chars
  return { raw, hash, prefix };
}
