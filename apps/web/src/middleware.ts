import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isSelfHosted = process.env.SELF_HOSTED === 'true';

  // Self-hosted mode: no auth enforcement at all
  if (isSelfHosted) return NextResponse.next();

  const { pathname } = req.nextUrl;
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

  // /studio and /api/generate are open to guests — the route handlers
  // enforce auth only for HD generation (standard is always free).

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/studio/:path*',
    '/account/:path*',
    '/billing/:path*',
    '/admin/:path*',
    '/admin',
    '/api/generate/:path*',
    '/api/generate',
  ],
};
