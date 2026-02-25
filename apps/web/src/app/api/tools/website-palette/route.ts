import { NextRequest } from 'next/server';
import { checkSsrf } from '@/lib/ssrf-check';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import { checkRateLimit as checkRateLimitPersist } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

function normalizeHex(raw: string): string | null {
  const hex = raw.replace('#', '');
  if (hex.length === 3) {
    const r = hex[0] + hex[0], g = hex[1] + hex[1], b = hex[2] + hex[2];
    return `#${r}${g}${b}`.toUpperCase();
  }
  if (hex.length === 6) return `#${hex}`.toUpperCase();
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const rl = checkRateLimit(getRateLimitKey(req, 'website-palette'), 20, 60_000);
  if (!rl.ok) {
    return Response.json({ error: 'Too many requests. Try again in a minute.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }
  if (session?.user?.id) {
    const userRl = await checkRateLimitPersist(`website-palette:${session.user.id}`, 20, 3_600_000);
    if (!userRl.allowed) {
      return Response.json({ error: 'Rate limit exceeded.' }, { status: 429, headers: { 'Retry-After': String(userRl.retryAfter ?? 60) } });
    }
  }
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }
    const ssrf = checkSsrf(url);
    if (!ssrf.ok) return Response.json({ error: ssrf.reason }, { status: 403 });

    let html: string;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'WokGen-WebsitePalette/1.0' },
      });
      if (!res.ok) return Response.json({ error: `Upstream returned ${res.status}` }, { status: 502 });
      const finalUrl = res.url || url;
      const ssrfFinal = checkSsrf(finalUrl);
      if (!ssrfFinal.ok) return Response.json({ error: ssrfFinal.reason }, { status: 403 });
      html = await res.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 502 });
    }

    const colors = new Set<string>();

    // Hex colors
    const hexRe = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
    let m: RegExpExecArray | null;
    while ((m = hexRe.exec(html)) !== null) {
      const n = normalizeHex(m[0]);
      if (n) colors.add(n);
    }

    // rgb() colors
    const rgbRe = /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/g;
    while ((m = rgbRe.exec(html)) !== null) {
      colors.add(rgbToHex(parseInt(m[1]), parseInt(m[2]), parseInt(m[3])));
    }

    // Filter near-black, near-white, and very common greys
    const filtered = [...colors].filter(c => {
      const hex = c.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const lum = (r + g + b) / 3;
      return lum > 15 && lum < 240 && !(r === g && g === b);
    });

    return Response.json({ colors: filtered.slice(0, 80) });
  } catch {
    return Response.json({ error: 'Failed to fetch URL' }, { status: 500 });
  }
}
