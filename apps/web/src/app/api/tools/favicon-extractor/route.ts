import { NextRequest } from 'next/server';
import { checkSsrf } from '@/lib/ssrf-check';

interface FaviconEntry {
  url: string;
  rel: string;
  sizes?: string;
  type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    let normalized = url.trim();
    if (!normalized.startsWith('http')) normalized = 'https://' + normalized;

    const ssrf = checkSsrf(normalized);
    if (!ssrf.ok) return Response.json({ error: ssrf.reason }, { status: 403 });

    const origin = new URL(normalized).origin;
    const favicons: FaviconEntry[] = [];
    const seen = new Set<string>();

    const addFavicon = (href: string, rel: string, sizes?: string, type?: string) => {
      try {
        const abs = new URL(href, origin).toString();
        if (!seen.has(abs)) { seen.add(abs); favicons.push({ url: abs, rel, sizes, type }); }
      } catch { /* skip */ }
    };

    // Always add /favicon.ico
    addFavicon('/favicon.ico', 'shortcut icon', undefined, 'image/x-icon');

    try {
      const res = await fetch(normalized, {
        signal: AbortSignal.timeout(15_000),
        headers: { 'User-Agent': 'WokGen-FaviconExtractor/1.0' },
      });
      if (!res.ok) return Response.json({ error: `Upstream returned ${res.status}` }, { status: 502 });
      const html = await res.text();

      // Parse link tags
      const linkRe = /<link\s+([^>]+)>/gi;
      let m: RegExpExecArray | null;
      while ((m = linkRe.exec(html)) !== null) {
        const attrs = m[1];
        const rel = /rel=["']([^"']+)["']/i.exec(attrs)?.[1] ?? '';
        if (!rel.includes('icon') && rel !== 'apple-touch-icon') continue;
        const href = /href=["']([^"']+)["']/i.exec(attrs)?.[1];
        if (!href) continue;
        const sizes = /sizes=["']([^"']+)["']/i.exec(attrs)?.[1];
        const type = /type=["']([^"']+)["']/i.exec(attrs)?.[1];
        addFavicon(href, rel, sizes, type);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      return Response.json({ error: `Failed to fetch URL: ${msg}` }, { status: 502 });
    }

    return Response.json({ favicons, origin });
  } catch {
    return Response.json({ error: 'Failed to fetch URL' }, { status: 500 });
  }
}
