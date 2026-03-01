import crypto from 'crypto';

interface WokGenUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

/**
 * Sign a short-lived WokSpec JWT for authenticating to the Eral Worker.
 * The Eral Worker verifies this with its JWT_SECRET using issuer/audience
 * values matching https://api.wokspec.org → https://wokspec.org.
 *
 * Requires ERAL_JWT_SECRET in environment (shared secret with Eral Worker).
 * Returns null when the secret is absent (Eral calls will fail with 401).
 */
export function signEralToken(user: WokGenUser): string | null {
  const secret = process.env.ERAL_JWT_SECRET;
  if (!secret) return null;

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: 'https://api.wokspec.org',
    aud: 'https://wokspec.org',
    sub: user.id,
    email: user.email ?? '',
    displayName: user.name ?? user.email ?? 'WokGen User',
    avatarUrl: user.image ?? null,
    iat: now,
    exp: now + 300, // 5-minute TTL
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${sig}`;
}
