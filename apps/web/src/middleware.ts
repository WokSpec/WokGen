import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ── In-edge simple rate limiter (Edge runtime: no Redis, but Cloudflare KV or
// local Map is available). Uses a rotating Map per 10-second window.
// This is a first-line defense — the per-user Redis rate limiter in route
// handlers is the authoritative one.
const _rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const EDGE_RL_WINDOW = 10_000;  // 10s window
const EDGE_RL_MAX    = 60;      // max 60 requests per 10s per IP

function edgeRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = _rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > EDGE_RL_WINDOW) {
    _rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true; // allow
  }
  entry.count += 1;
  if (entry.count > EDGE_RL_MAX) return false; // block
  return true;
}

function getClientIp(req: NextRequest): string {
  // Cloudflare: CF-Connecting-IP is the real client IP (cannot be spoofed)
  const cf = req.headers.get('CF-Connecting-IP');
  if (cf) return cf;
  // Vercel: x-forwarded-for is set by the platform
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

export default auth((req) => {
  const isSelfHosted = process.env.SELF_HOSTED === 'true';
  const { pathname } = req.nextUrl;

  // Self-hosted mode: no auth enforcement at all
  if (isSelfHosted) return NextResponse.next();

  // Maintenance mode — returns 503 for all non-health routes
  if (process.env.MAINTENANCE_MODE === 'true' && pathname !== '/api/health') {
    return NextResponse.json(
      { error: 'WokGen is undergoing maintenance. Back shortly.' },
      { status: 503, headers: { 'Retry-After': '300' } },
    );
  }

  // Edge IP rate limit on generation and chat endpoints
  if (pathname.startsWith('/api/generate') || pathname.startsWith('/api/eral/chat')) {
    const ip = getClientIp(req as unknown as NextRequest);
    if (!edgeRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Slow down.' },
        { status: 429, headers: { 'Retry-After': '10', 'X-RateLimit-Limit': String(EDGE_RL_MAX) } },
      );
    }
  }

  const session = req.auth;

  // Account and billing require a real session
  const needsAuth =
    pathname.startsWith('/account') ||
    pathname.startsWith('/billing') ||
    pathname.startsWith('/admin');

  if (needsAuth && !session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Security headers + request ID on all responses
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com https://cdn.vercel-insights.com`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https: http:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://*.upstash.io wss:`,
    `frame-src https://js.stripe.com https://hooks.stripe.com`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  const response = NextResponse.next();
  response.headers.set('X-WokGen-Request-Id', crypto.randomUUID());
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Nonce', nonce);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
});

export const config = {
  matcher: [
    '/studio/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/admin/:path*',
    '/admin',
    '/api/:path*',
    '/api/generate/:path*',
    '/api/generate',
    '/api/eral/chat',
  ],
};
