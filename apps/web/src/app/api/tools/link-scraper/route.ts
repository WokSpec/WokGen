import { NextRequest } from 'next/server';
import { checkSsrf } from '@/lib/ssrf-check';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return Response.json({ error: 'URL is required' }, { status: 400 });
    }

    let parsed: URL;
    try { parsed = new URL(url); } catch {
      return Response.json({ error: 'Invalid URL' }, { status: 400 });
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return Response.json({ error: 'Only HTTP/HTTPS URLs are supported' }, { status: 400 });
    }

    const ssrf = checkSsrf(url);
    if (!ssrf.ok) {
      return Response.json({ error: 'URL not allowed' }, { status: 403 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let html: string;
    let finalUrl = url;
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'WokGen-LinkScraper/1.0' },
        redirect: 'follow',
      });
      finalUrl = res.url || url;
      html = await res.text();
    } finally {
      clearTimeout(timeout);
    }

    const base = new URL(finalUrl);

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // Extract meta tags
    const meta: Record<string, string> = {};
    const metaRegex = /<meta[^>]+>/gi;
    let mm;
    while ((mm = metaRegex.exec(html)) !== null) {
      const tag = mm[0];
      const nameMatch = tag.match(/(?:name|property)=["']([^"']+)["']/i);
      const contentMatch = tag.match(/content=["']([^"']+)["']/i);
      if (nameMatch && contentMatch) {
        meta[nameMatch[1]] = contentMatch[1];
      }
    }

    const description = meta['description'] || meta['og:description'] || '';

    // Extract links
    const links: Array<{ url: string; text: string; type: 'internal' | 'external' }> = [];
    const linkSeen = new Set<string>();
    const linkRegex = /<a[^>]+href=["']([^"'#][^"']*)["'][^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/a>/gi;
    while ((mm = linkRegex.exec(html)) !== null) {
      const raw = mm[1];
      const text = mm[2].replace(/<[^>]+>/g, '').trim().slice(0, 100);
      if (!raw || raw.startsWith('javascript:') || raw.startsWith('mailto:')) continue;
      try {
        const abs = new URL(raw, base).toString();
        if (linkSeen.has(abs)) continue;
        linkSeen.add(abs);
        const isInternal = new URL(abs).hostname === base.hostname;
        links.push({ url: abs, text, type: isInternal ? 'internal' : 'external' });
      } catch { /* skip */ }
    }

    // Extract images
    const images: Array<{ url: string; alt: string }> = [];
    const imgSeen = new Set<string>();
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*>/gi;
    while ((mm = imgRegex.exec(html)) !== null) {
      const raw = mm[1];
      const alt = mm[2] || '';
      if (!raw || raw.startsWith('data:')) continue;
      try {
        const abs = new URL(raw, base).toString();
        if (imgSeen.has(abs)) continue;
        imgSeen.add(abs);
        images.push({ url: abs, alt });
      } catch { /* skip */ }
    }

    return Response.json({
      title,
      description,
      meta,
      links: links.slice(0, 200),
      images: images.slice(0, 100),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return Response.json({ error: `Failed to scrape: ${msg}` }, { status: 500 });
  }
}
