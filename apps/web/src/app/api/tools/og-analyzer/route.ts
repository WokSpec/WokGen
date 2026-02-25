import { NextRequest } from 'next/server';
import { checkSsrf } from '@/lib/ssrf-check';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limiter';
import { checkRateLimit as checkRateLimitPersist } from '@/lib/rate-limit';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  const rl = checkRateLimit(getRateLimitKey(req, 'og-analyzer'), 20, 60_000);
  if (!rl.ok) {
    return Response.json({ error: 'Too many requests. Try again in a minute.' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
    });
  }
  if (session?.user?.id) {
    const userRl = await checkRateLimitPersist(`og-analyzer:${session.user.id}`, 20, 3_600_000);
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
    if (!ssrf.ok) {
      return Response.json({ error: ssrf.reason }, { status: 403 });
    }

    let html: string;
    let finalUrl = url;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'WokGen-OGAnalyzer/1.0' },
      });
      if (!res.ok) return Response.json({ error: `Upstream returned ${res.status}` }, { status: 502 });
      finalUrl = res.url || url;
      const ssrfFinal = checkSsrf(finalUrl);
      if (!ssrfFinal.ok) return Response.json({ error: ssrfFinal.reason }, { status: 403 });
      html = await res.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 502 });
    }

    const tags: Record<string, string> = {};

    // Extract all meta tags with property or name
    const metaRe = /<meta\s+([^>]+)>/gi;
    let m: RegExpExecArray | null;
    while ((m = metaRe.exec(html)) !== null) {
      const attrs = m[1];
      const propMatch = /property=["']([^"']+)["']/i.exec(attrs);
      const nameMatch = /name=["']([^"']+)["']/i.exec(attrs);
      const contentMatch = /content=["']([^"']*)["']/i.exec(attrs);
      const key = propMatch?.[1] || nameMatch?.[1];
      if (key && contentMatch) {
        tags[key] = contentMatch[1];
      }
    }

    // Extract title
    const titleMatch = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
    if (titleMatch && !tags['og:title']) tags['_title'] = titleMatch[1].trim();

    // Resolve relative image URLs
    for (const key of ['og:image', 'twitter:image', 'twitter:image:src']) {
      if (tags[key] && !tags[key].startsWith('http')) {
        try { tags[key] = new URL(tags[key], finalUrl).toString(); } catch { /* skip */ }
      }
    }

    return Response.json({ tags, url: finalUrl });
  } catch {
    return Response.json({ error: 'Failed to fetch URL' }, { status: 500 });
  }
}
